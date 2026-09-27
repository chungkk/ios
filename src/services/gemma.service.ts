// GemmaService — On-device LLM translation using llama.rn
// Supports multiple Gemma model variants with device-aware recommendations
// Downloads and manages GGUF models for offline word translation

import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';
import { initLlama, type LlamaContext } from 'llama.rn';

// ============================================================
// Types
// ============================================================

export type GemmaModelId = 'gemma-2b' | 'gemma-4b';

export interface GemmaModelVariant {
  id: GemmaModelId;
  name: string;
  description: string;
  sizeMB: number;
  minRAMGB: number;
  url: string;
  filename: string;
  emoji: string;
  quality: 'good' | 'excellent';
  speed: string; // e.g. "~1-2s/từ"
}

export interface DeviceCapability {
  deviceName: string;      // e.g. "iPhone 15 Pro"
  totalRAMGB: number;      // e.g. 8
  freeStorageMB: number;
  recommendedModel: GemmaModelId;
  supportedModels: GemmaModelId[];
}

export interface GemmaModelInfo {
  isDownloaded: boolean;
  isDownloading: boolean;
  downloadProgress: number; // 0-100
  activeModelId: GemmaModelId | null;
  deviceCapability: DeviceCapability | null;
}

export interface GemmaTranslationResult {
  translation: string;
  source: 'offline' | 'error';
  latencyMs: number;
}

type ProgressCallback = (progress: number) => void;
type StatusCallback = (info: GemmaModelInfo) => void;

// ============================================================
// Model Definitions
// ============================================================

const MODEL_DIR = `${RNFS.DocumentDirectoryPath}/models`;

export const GEMMA_MODELS: Record<GemmaModelId, GemmaModelVariant> = {
  'gemma-2b': {
    id: 'gemma-2b',
    name: 'Gemma 2B',
    description: 'Nhẹ, nhanh — phù hợp mọi iPhone',
    sizeMB: 1600,
    minRAMGB: 3,
    url: 'https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    filename: 'gemma-2b-it-q4_k_m.gguf',
    emoji: '⚡',
    quality: 'good',
    speed: '~1-2s/từ',
  },
  'gemma-4b': {
    id: 'gemma-4b',
    name: 'Gemma 4 E4B',
    description: 'Thông minh hơn — cần iPhone 15 Pro+',
    sizeMB: 5400,
    minRAMGB: 6,
    url: 'https://huggingface.co/bartowski/google_gemma-4-E4B-it-GGUF/resolve/main/google_gemma-4-E4B-it-Q4_K_M.gguf',
    filename: 'gemma-4-e4b-it-q4_k_m.gguf',
    emoji: '🧠',
    quality: 'excellent',
    speed: '~2-4s/từ',
  },
};

// ============================================================
// iPhone model → RAM mapping
// ============================================================

const IPHONE_RAM_MAP: Record<string, number> = {
  // iPhone 12 series — 4GB
  'iPhone13,1': 4, 'iPhone13,2': 4, 'iPhone13,3': 4, 'iPhone13,4': 6,
  // iPhone 13 series — 4GB (Pro: 6GB)
  'iPhone14,4': 4, 'iPhone14,5': 4, 'iPhone14,2': 6, 'iPhone14,3': 6,
  // iPhone 14 series — 6GB
  'iPhone14,7': 6, 'iPhone14,8': 6, 'iPhone15,2': 6, 'iPhone15,3': 6,
  // iPhone 15 series — 6GB (Pro: 8GB)
  'iPhone15,4': 6, 'iPhone15,5': 6, 'iPhone16,1': 8, 'iPhone16,2': 8,
  // iPhone 16 series — 8GB
  'iPhone17,1': 8, 'iPhone17,2': 8, 'iPhone17,3': 8, 'iPhone17,4': 8, 'iPhone17,5': 8,
  // iPad Pro — typically 8-16GB
};

// Human-readable names for iPhone model identifiers
const IPHONE_NAME_MAP: Record<string, string> = {
  'iPhone13,1': 'iPhone 12 mini', 'iPhone13,2': 'iPhone 12',
  'iPhone13,3': 'iPhone 12 Pro', 'iPhone13,4': 'iPhone 12 Pro Max',
  'iPhone14,4': 'iPhone 13 mini', 'iPhone14,5': 'iPhone 13',
  'iPhone14,2': 'iPhone 13 Pro', 'iPhone14,3': 'iPhone 13 Pro Max',
  'iPhone14,7': 'iPhone 14', 'iPhone14,8': 'iPhone 14 Plus',
  'iPhone15,2': 'iPhone 14 Pro', 'iPhone15,3': 'iPhone 14 Pro Max',
  'iPhone15,4': 'iPhone 15', 'iPhone15,5': 'iPhone 15 Plus',
  'iPhone16,1': 'iPhone 15 Pro', 'iPhone16,2': 'iPhone 15 Pro Max',
  'iPhone17,1': 'iPhone 16', 'iPhone17,2': 'iPhone 16 Plus',
  'iPhone17,3': 'iPhone 16 Pro', 'iPhone17,4': 'iPhone 16 Pro Max',
  'iPhone17,5': 'iPhone 16e',
};

// ============================================================
// Lazy imports for llama.rn
// ============================================================

let llamaContext: LlamaContext | null = null;

/**
 * Get device model identifier and RAM using native DeviceHelper module
 */
async function getDeviceHardwareInfo(): Promise<{ model: string; ramBytes: number }> {
  try {
    const helper = NativeModules.DeviceHelper;
    if (helper) {
      const [model, ramBytes] = await Promise.all([
        helper.getDeviceModel(),
        helper.getTotalMemory(),
      ]);
      return { model: model || 'unknown', ramBytes: Number(ramBytes) || 0 };
    }
  } catch (e) {
    console.warn('[GemmaService] DeviceHelper not available:', e);
  }
  return { model: 'unknown', ramBytes: 0 };
}

// ============================================================
// GemmaService
// ============================================================

class GemmaService {
  private _isInitialized = false;
  private _isDownloading = false;
  private _downloadProgress = 0;
  private _downloadJobId: number | null = null;
  private _activeModelId: GemmaModelId | null = null;
  private _statusListeners: StatusCallback[] = [];
  private _deviceCapability: DeviceCapability | null = null;
  private _initPromise: Promise<boolean> | null = null;

  // ----------------------------------------------------------
  // Device Detection
  // ----------------------------------------------------------

  /**
   * Detect device capabilities and determine supported models
   */
  async getDeviceCapability(): Promise<DeviceCapability> {
    if (this._deviceCapability) return this._deviceCapability;

    let deviceName = 'iPhone';
    let totalRAMGB = 4; // conservative default

    try {
      const hw = await getDeviceHardwareInfo();
      console.log('[GemmaService] Device model:', hw.model, 'RAM bytes:', hw.ramBytes);

      // Get human-readable name
      deviceName = IPHONE_NAME_MAP[hw.model] || `iPhone (${hw.model})`;

      // Get RAM from our mapping first, then from actual hardware
      if (IPHONE_RAM_MAP[hw.model]) {
        totalRAMGB = IPHONE_RAM_MAP[hw.model];
      } else if (hw.ramBytes > 0) {
        totalRAMGB = Math.round(hw.ramBytes / (1024 * 1024 * 1024));
      } else {
        totalRAMGB = hw.model.startsWith('iPhone') ? 8 : 4;
      }
    } catch (e) {
      console.warn('[GemmaService] Device detection failed:', e);
    }

    // Determine free storage
    let freeStorageMB = 0;
    try {
      const fsInfo = await RNFS.getFSInfo();
      freeStorageMB = Math.round(fsInfo.freeSpace / (1024 * 1024));
    } catch {
      freeStorageMB = -1;
    }

    // Determine supported models based on RAM
    const supportedModels: GemmaModelId[] = [];
    let recommendedModel: GemmaModelId = 'gemma-2b';

    for (const model of Object.values(GEMMA_MODELS)) {
      if (totalRAMGB >= model.minRAMGB) {
        supportedModels.push(model.id);
      }
    }

    // If no models supported (very old device), still allow 2B
    if (supportedModels.length === 0) {
      supportedModels.push('gemma-2b');
    }

    // Recommend the best supported model
    if (supportedModels.includes('gemma-4b')) {
      recommendedModel = 'gemma-4b';
    }

    this._deviceCapability = {
      deviceName,
      totalRAMGB,
      freeStorageMB,
      recommendedModel,
      supportedModels,
    };

    return this._deviceCapability;
  }

  /**
   * Get list of all models with compatibility info for this device
   */
  async getModelsForDevice(): Promise<Array<GemmaModelVariant & {
    isSupported: boolean;
    isRecommended: boolean;
    isDownloaded: boolean;
    reason?: string;
  }>> {
    const cap = await this.getDeviceCapability();

    const results = [];
    for (const model of Object.values(GEMMA_MODELS)) {
      const isSupported = cap.supportedModels.includes(model.id);
      const isDownloaded = await this._isModelFileExists(model.id);

      let reason: string | undefined;
      if (!isSupported) {
        reason = `Cần ${model.minRAMGB}GB RAM (máy bạn: ${cap.totalRAMGB}GB)`;
      }

      results.push({
        ...model,
        isSupported,
        isRecommended: cap.recommendedModel === model.id,
        isDownloaded,
        reason,
      });
    }

    return results;
  }

  // ----------------------------------------------------------
  // Status & Info
  // ----------------------------------------------------------

  private async _isModelFileExists(modelId: GemmaModelId): Promise<boolean> {
    const model = GEMMA_MODELS[modelId];
    if (!model) return false;
    try {
      return await RNFS.exists(`${MODEL_DIR}/${model.filename}`);
    } catch {
      return false;
    }
  }

  /**
   * Check if any model is downloaded
   */
  async isAnyModelDownloaded(): Promise<boolean> {
    for (const modelId of Object.keys(GEMMA_MODELS) as GemmaModelId[]) {
      if (await this._isModelFileExists(modelId)) return true;
    }
    return false;
  }

  /**
   * Check if the LLM context is ready for inference
   */
  isReady(): boolean {
    return this._isInitialized && llamaContext !== null;
  }

  /**
   * Get the active model ID
   */
  getActiveModelId(): GemmaModelId | null {
    return this._activeModelId;
  }

  /**
   * Get comprehensive model status information
   */
  async getModelInfo(): Promise<GemmaModelInfo> {
    const cap = await this.getDeviceCapability();

    // Find which model is downloaded
    let activeModelId: GemmaModelId | null = this._activeModelId;
    if (!activeModelId) {
      for (const modelId of Object.keys(GEMMA_MODELS) as GemmaModelId[]) {
        if (await this._isModelFileExists(modelId)) {
          activeModelId = modelId;
          break;
        }
      }
    }

    return {
      isDownloaded: activeModelId !== null && await this._isModelFileExists(activeModelId),
      isDownloading: this._isDownloading,
      downloadProgress: this._downloadProgress,
      activeModelId,
      deviceCapability: cap,
    };
  }

  /**
   * Subscribe to model status changes
   */
  onStatusChange(callback: StatusCallback): () => void {
    this._statusListeners.push(callback);
    return () => {
      this._statusListeners = this._statusListeners.filter(l => l !== callback);
    };
  }

  private async _notifyStatusChange() {
    const info = await this.getModelInfo();
    this._statusListeners.forEach(listener => {
      try { listener(info); } catch {}
    });
  }

  // ----------------------------------------------------------
  // Download
  // ----------------------------------------------------------

  /**
   * Download a specific model variant
   */
  async downloadModel(
    modelId: GemmaModelId,
    onProgress?: ProgressCallback
  ): Promise<boolean> {
    if (this._isDownloading) {
      console.warn('[GemmaService] Download already in progress');
      return false;
    }

    const model = GEMMA_MODELS[modelId];
    if (!model) {
      console.error('[GemmaService] Unknown model:', modelId);
      return false;
    }

    const modelPath = `${MODEL_DIR}/${model.filename}`;

    try {
      // Ensure model directory exists
      if (!(await RNFS.exists(MODEL_DIR))) {
        await RNFS.mkdir(MODEL_DIR);
      }

      // Check if already downloaded
      if (await RNFS.exists(modelPath)) {
        console.log(`[GemmaService] Model ${modelId} already downloaded`);
        return true;
      }

      // Delete any other downloaded model first (save space)
      await this._deleteAllModels();

      // Check free space
      const fsInfo = await RNFS.getFSInfo();
      const requiredSpace = model.sizeMB * 1024 * 1024 * 1.1; // 10% buffer
      if (fsInfo.freeSpace < requiredSpace) {
        console.error('[GemmaService] Insufficient storage space');
        return false;
      }

      this._isDownloading = true;
      this._downloadProgress = 0;
      this._notifyStatusChange();

      const sizeBytes = model.sizeMB * 1024 * 1024;

      console.log(`[GemmaService] Downloading ${model.name} (${model.sizeMB}MB)...`);

      const downloadResult = RNFS.downloadFile({
        fromUrl: model.url,
        toFile: modelPath,
        background: true,
        discretionary: false,
        cacheable: false,
        progressDivider: 1,
        begin: (res: any) => {
          console.log(`[GemmaService] Download started, size: ${res.contentLength}`);
        },
        progress: (res: any) => {
          const progress = Math.round((res.bytesWritten / sizeBytes) * 100);
          this._downloadProgress = Math.min(progress, 99);
          onProgress?.(this._downloadProgress);
          this._notifyStatusChange();
        },
      });

      this._downloadJobId = downloadResult.jobId;
      const result = await downloadResult.promise;

      if (result.statusCode === 200) {
        this._downloadProgress = 100;
        onProgress?.(100);
        this._activeModelId = modelId;
        console.log(`[GemmaService] ${model.name} download complete!`);
        this._isDownloading = false;
        this._notifyStatusChange();
        return true;
      } else {
        console.error(`[GemmaService] Download failed: ${result.statusCode}`);
        await this._cleanupFile(modelPath);
        this._isDownloading = false;
        this._notifyStatusChange();
        return false;
      }
    } catch (error) {
      console.error('[GemmaService] Download error:', error);
      await this._cleanupFile(modelPath);
      this._isDownloading = false;
      this._notifyStatusChange();
      return false;
    }
  }

  /**
   * Cancel active download
   */
  cancelDownload(): void {
    if (this._downloadJobId !== null) {
      RNFS.stopDownload(this._downloadJobId);
      this._downloadJobId = null;
      this._isDownloading = false;
      this._downloadProgress = 0;
      // Clean up partial files
      this._deleteAllModels();
      this._notifyStatusChange();
    }
  }

  /**
   * Delete all downloaded models
   */
  async deleteModel(): Promise<void> {
    await this.release();
    await this._deleteAllModels();
    this._activeModelId = null;
    this._notifyStatusChange();
  }

  private async _deleteAllModels(): Promise<void> {
    for (const model of Object.values(GEMMA_MODELS)) {
      await this._cleanupFile(`${MODEL_DIR}/${model.filename}`);
    }
  }

  private async _cleanupFile(path: string): Promise<void> {
    try {
      if (await RNFS.exists(path)) {
        await RNFS.unlink(path);
      }
    } catch {}
  }

  // ----------------------------------------------------------
  // Initialization & Inference
  // ----------------------------------------------------------

  /**
   * Initialize the LLM context for a specific model
   */
  async initialize(modelId?: GemmaModelId): Promise<boolean> {
    if (this._isInitialized && llamaContext) {
      console.log('[GemmaService] Already initialized');
      return true;
    }

    // Mutex: if already initializing, wait for the existing promise
    if (this._initPromise) {
      console.log('[GemmaService] Init already in progress, waiting...');
      return this._initPromise;
    }

    this._initPromise = this._doInitialize(modelId);
    try {
      return await this._initPromise;
    } finally {
      this._initPromise = null;
    }
  }

  private async _doInitialize(modelId?: GemmaModelId): Promise<boolean> {
    // Find which model to load
    let targetId = modelId;
    if (!targetId) {
      for (const id of Object.keys(GEMMA_MODELS) as GemmaModelId[]) {
        if (await this._isModelFileExists(id)) {
          targetId = id;
          break;
        }
      }
    }

    if (!targetId) {
      console.error('[GemmaService] No model file found on disk');
      return false;
    }

    const model = GEMMA_MODELS[targetId];
    const modelPath = `${MODEL_DIR}/${model.filename}`;

    if (!(await RNFS.exists(modelPath))) {
      console.error(`[GemmaService] Model file missing: ${modelPath}`);
      return false;
    }

    // Validate file size to detect corrupt/partial downloads
    try {
      const stat = await RNFS.stat(modelPath);
      const fileSizeMB = Number(stat.size) / (1024 * 1024);
      const expectedMinMB = model.sizeMB * 0.8; // allow 20% tolerance
      console.log(`[GemmaService] File size: ${fileSizeMB.toFixed(0)}MB, expected ~${model.sizeMB}MB`);
      if (fileSizeMB < expectedMinMB) {
        console.error(`[GemmaService] File too small (${fileSizeMB.toFixed(0)}MB < ${expectedMinMB.toFixed(0)}MB) — likely corrupt, deleting`);
        await this._cleanupFile(modelPath);
        return false;
      }
    } catch (statErr: any) {
      console.error('[GemmaService] Cannot stat model file:', statErr?.message);
      return false;
    }

    // Attempt 1: full GPU offloading
    const initConfigs = [
      { n_ctx: 512, n_gpu_layers: 99, n_threads: 4, use_mlock: true, label: 'GPU+mlock' },
      { n_ctx: 512, n_gpu_layers: 99, n_threads: 4, use_mlock: false, label: 'GPU' },
      { n_ctx: 256, n_gpu_layers: 0, n_threads: 2, use_mlock: false, label: 'CPU-only' },
    ];

    for (const config of initConfigs) {
      try {
        console.log(`[GemmaService] Trying ${config.label}: ${model.name}...`);
        const startTime = Date.now();

        llamaContext = await initLlama({
          model: modelPath,
          n_ctx: config.n_ctx,
          n_gpu_layers: config.n_gpu_layers,
          n_threads: config.n_threads,
          use_mlock: config.use_mlock,
        });

        const elapsed = Date.now() - startTime;
        console.log(`[GemmaService] ${model.name} initialized (${config.label}) in ${elapsed}ms`);
        this._isInitialized = true;
        this._activeModelId = targetId;
        return true;
      } catch (error: any) {
        const errMsg = error?.message || String(error);
        console.warn(`[GemmaService] ${config.label} failed: ${errMsg}`);
        llamaContext = null;
      }
    }

    console.error('[GemmaService] All init attempts failed for', model.name);
    this._isInitialized = false;
    return false;
  }

  /**
   * Translate a single German word
   */
  async translateWord(
    word: string,
    context?: string,
    targetLang: string = 'vi'
  ): Promise<GemmaTranslationResult> {
    const startTime = Date.now();

    if (!this.isReady()) {
      return { translation: '', source: 'error', latencyMs: Date.now() - startTime };
    }

    try {
      const langName = targetLang === 'vi' ? 'Vietnamese' :
                        targetLang === 'en' ? 'English' : 'German';

      // Use appropriate prompt format based on active model
      let prompt: string;
      if (this._activeModelId === 'gemma-4b') {
        // Gemma 4 format with system role
        prompt = `<start_of_turn>system\nYou are a precise German-${langName} translator. Reply only with the translation.\n<end_of_turn>\n<start_of_turn>user\nTranslate "${word}" to ${langName}.`;
        if (context) prompt += ` Context: "${context}"`;
        prompt += `\n<end_of_turn>\n<start_of_turn>model\n`;
      } else {
        // Gemma 2 format
        prompt = `<start_of_turn>user\nTranslate the German word "${word}" to ${langName}.`;
        if (context) prompt += ` Context: "${context}"`;
        prompt += `\nOnly reply with the translation, nothing else.\n<end_of_turn>\n<start_of_turn>model\n`;
      }

      const result = await llamaContext!.completion({
        prompt,
        n_predict: 64,
        temperature: 0.1,
        top_k: 10,
        top_p: 0.9,
        stop: ['\n', '<end_of_turn>', '<start_of_turn>'],
        seed: 42,
      });

      const translation = this._cleanTranslation(result.text, word);
      const latencyMs = Date.now() - startTime;

      console.log(`[GemmaService] "${word}" → "${translation}" (${latencyMs}ms, ${this._activeModelId})`);

      return { translation, source: 'offline', latencyMs };
    } catch (error) {
      console.error('[GemmaService] Translation error:', error);
      return { translation: '', source: 'error', latencyMs: Date.now() - startTime };
    }
  }

  private _cleanTranslation(raw: string, originalWord: string): string {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/<end_of_turn>/g, '');
    cleaned = cleaned.replace(/<start_of_turn>/g, '');
    cleaned = cleaned.replace(/^(The translation is|Translation:|Meaning:)\s*/i, '');
    cleaned = cleaned.replace(/^["']|["']$/g, '');
    cleaned = cleaned.replace(/\.$/, '');
    if (cleaned.length > 100) {
      cleaned = cleaned.split('\n')[0].substring(0, 100);
    }
    return cleaned || originalWord;
  }

  /**
   * Release the LLM context and free memory
   */
  async release(): Promise<void> {
    try {
      if (llamaContext) {
        await llamaContext.release();
        console.log('[GemmaService] Context released');
      }
    } catch (error) {
      console.error('[GemmaService] Error releasing context:', error);
    } finally {
      llamaContext = null;
      this._isInitialized = false;
    }
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const gemmaService = new GemmaService();
export default gemmaService;
