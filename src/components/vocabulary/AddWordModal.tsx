import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { colors, spacing } from '../../styles/theme';
import {
  vocabularyService,
  VocabularyItem,
  DictionaryResult,
} from '../../services/vocabulary.service';

interface AddWordModalProps {
  visible: boolean;
  onClose: () => void;
  onWordAdded: (word: VocabularyItem) => void;
  pendingReviewCount?: number;
}

const EMPTY_FORM = {
  word: '',
  translation: '',
  example: '',
  notes: '',
  gender: '',
  plural: '',
  pronunciation: '',
  partOfSpeech: '',
  grammar: '',
  baseForm: '',
};

const AddWordModal: React.FC<AddWordModalProps> = ({
  visible,
  onClose,
  onWordAdded,
  pendingReviewCount = 0,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [lookupResult, setLookupResult] = useState<DictionaryResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Dictionary lookup
  const handleLookup = useCallback(async () => {
    if (!form.word.trim()) return;
    setLookupLoading(true);
    try {
      const data = await vocabularyService.lookupDictionary(form.word);
      setLookupResult(data);
      // Auto-fill fields
      const displayWord = data.gender
        ? form.word.trim().charAt(0).toUpperCase() + form.word.trim().slice(1)
        : form.word.trim();
      setForm(prev => ({
        ...prev,
        word: displayWord,
        translation: data.translation || prev.translation,
        example: data.examples?.[0]
          ? (typeof data.examples[0] === 'string' ? data.examples[0] : (data.examples[0] as any).de || '')
          : prev.example,
        notes: data.explanation || prev.notes,
        gender: data.gender || '',
        plural: data.plural || '',
        pronunciation: data.pronunciation || '',
        partOfSpeech: data.partOfSpeech || '',
        grammar: data.grammar || '',
        baseForm: data.baseForm || '',
      }));
    } catch (error) {
      console.error('Dictionary lookup failed:', error);
      Alert.alert('Lỗi', 'Không thể tra từ điển');
    } finally {
      setLookupLoading(false);
    }
  }, [form.word]);

  // Save word
  const handleSave = useCallback(async () => {
    if (!form.word.trim() || !form.translation.trim()) return;
    setSaving(true);
    try {
      let wordData = { ...form };

      // Auto-enrich if missing key fields
      if (!wordData.pronunciation || !wordData.partOfSpeech || !wordData.grammar || !wordData.baseForm) {
        try {
          const ai = await vocabularyService.lookupDictionary(wordData.word);
          if (ai.translation && !wordData.translation) wordData.translation = ai.translation;
          if (ai.gender) wordData.gender = ai.gender;
          if (ai.plural) wordData.plural = ai.plural;
          if (ai.pronunciation) wordData.pronunciation = ai.pronunciation;
          if (ai.partOfSpeech) wordData.partOfSpeech = ai.partOfSpeech;
          if (ai.grammar) wordData.grammar = ai.grammar;
          if (ai.baseForm) wordData.baseForm = ai.baseForm;
          if (ai.explanation && !wordData.notes) wordData.notes = ai.explanation;
          if (!wordData.example && ai.examples?.[0]) {
            const ex = ai.examples[0];
            wordData.example = typeof ex === 'string' ? ex : (ex as any).de || '';
          }
          if (ai.gender) {
            wordData.word = wordData.word.trim().charAt(0).toUpperCase() + wordData.word.trim().slice(1);
          }
        } catch {
          // Continue saving without enrichment
        }
      }

      const saved = await vocabularyService.saveVocabulary({
        word: wordData.word.trim(),
        translation: wordData.translation.trim(),
        example: (wordData.example || '').trim(),
        notes: (wordData.notes || '').trim(),
        gender: wordData.gender || '',
        plural: wordData.plural || '',
        pronunciation: wordData.pronunciation || '',
        partOfSpeech: wordData.partOfSpeech || '',
        grammar: wordData.grammar || '',
        baseForm: wordData.baseForm || '',
        status: 'new',
      });

      onWordAdded({ ...saved, ...wordData, id: saved.id, createdAt: saved.createdAt } as VocabularyItem);
      setForm(EMPTY_FORM);
      setLookupResult(null);
      onClose();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu từ vựng');
    } finally {
      setSaving(false);
    }
  }, [form, onWordAdded, onClose]);

  const handleSpeakWord = (text: string) => {
    try {
      const cleanW = text.replace(/[.,!?;:"""''„-]/g, '').trim();
      if (!cleanW) return;
      Tts.stop().catch(() => {});
      Tts.setDefaultLanguage('de-DE').then(() => Tts.speak(cleanW));
    } catch {}
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setLookupResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>➕ Thêm từ vựng mới</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Icon name="close" size={24} color={colors.retroDark} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Pending review warning */}
          {pendingReviewCount > 0 && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ⚠️ Bạn còn <Text style={styles.warningBold}>{pendingReviewCount} từ</Text> chưa ôn hôm nay
              </Text>
            </View>
          )}

          {/* German word + Lookup */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Từ tiếng Đức *</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="z.B. Schmetterling"
                placeholderTextColor={colors.textMuted}
                value={form.word}
                onChangeText={v => updateField('word', v)}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleLookup}
              />
              <TouchableOpacity
                style={[styles.lookupBtn, (!form.word.trim() || lookupLoading) && styles.btnDisabled]}
                onPress={handleLookup}
                disabled={!form.word.trim() || lookupLoading}
              >
                {lookupLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="search" size={16} color="#fff" />
                    <Text style={styles.lookupBtnText}>Tra từ</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Lookup Result */}
          {lookupResult && (
            <View style={styles.lookupCard}>
              <TouchableOpacity
                style={styles.lookupWordRow}
                onPress={() => handleSpeakWord(lookupResult.word)}
              >
                <Icon name="volume-high" size={18} color={colors.retroCyan} />
                <Text style={styles.lookupWordText}>
                  {lookupResult.gender ? `${lookupResult.gender} ` : ''}{lookupResult.word}
                </Text>
                {lookupResult.partOfSpeech && (
                  <View style={styles.posBadge}>
                    <Text style={styles.posText}>{lookupResult.partOfSpeech}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {lookupResult.pronunciation && (
                <Text style={styles.lookupIPA}>{lookupResult.pronunciation}</Text>
              )}

              <View style={styles.lookupMetaRow}>
                {lookupResult.translation && (
                  <Text style={styles.lookupMeta}>
                    <Text style={styles.lookupMetaLabel}>Nghĩa: </Text>
                    {lookupResult.translation}
                  </Text>
                )}
                {lookupResult.plural && (
                  <Text style={styles.lookupMeta}>
                    <Text style={styles.lookupMetaLabel}>Số nhiều: </Text>
                    {lookupResult.plural}
                  </Text>
                )}
              </View>

              {lookupResult.grammar && (
                <Text style={styles.lookupGrammar}>📝 {lookupResult.grammar}</Text>
              )}

              {lookupResult.explanation && (
                <Text style={styles.lookupExplanation}>{lookupResult.explanation}</Text>
              )}

              {lookupResult.examples && lookupResult.examples.length > 0 && (
                <View style={styles.lookupExamples}>
                  <Text style={styles.lookupExamplesTitle}>Ví dụ:</Text>
                  {lookupResult.examples.slice(0, 3).map((ex, i) => {
                    const text = typeof ex === 'string' ? ex : (ex as any).de;
                    const trans = typeof ex === 'object' ? (ex as any).translation : null;
                    return (
                      <View key={i} style={styles.exampleItem}>
                        <TouchableOpacity onPress={() => handleSpeakWord(text)}>
                          <Text style={styles.exampleDe}>🔊 {text}</Text>
                        </TouchableOpacity>
                        {trans && <Text style={styles.exampleTrans}>{trans}</Text>}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Translation */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nghĩa / Dịch *</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. con bướm"
              placeholderTextColor={colors.textMuted}
              value={form.translation}
              onChangeText={v => updateField('translation', v)}
            />
          </View>

          {/* Example */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ví dụ</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Der Schmetterling fliegt."
              placeholderTextColor={colors.textMuted}
              value={form.example}
              onChangeText={v => updateField('example', v)}
            />
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ghi chú (cách nhớ, ngữ pháp...)"
              placeholderTextColor={colors.textMuted}
              value={form.notes}
              onChangeText={v => updateField('notes', v)}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelBtnText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, (!form.word.trim() || !form.translation.trim() || saving) && styles.btnDisabled]}
            onPress={handleSave}
            disabled={!form.word.trim() || !form.translation.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>💾 Lưu từ vựng</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.retroCream,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.retroDark,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  warningBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 10,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
  },
  warningBold: {
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.retroDark,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  lookupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroCyan,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: 6,
  },
  lookupBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  // Lookup result card
  lookupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.retroCyan,
  },
  lookupWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  lookupWordText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.retroDark,
  },
  posBadge: {
    backgroundColor: colors.retroPurple + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  posText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.retroPurple,
  },
  lookupIPA: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  lookupMetaRow: {
    gap: 4,
    marginBottom: 6,
  },
  lookupMeta: {
    fontSize: 13,
    color: colors.retroDark,
  },
  lookupMetaLabel: {
    fontWeight: '700',
  },
  lookupGrammar: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  lookupExplanation: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  lookupExamples: {
    borderTopWidth: 1,
    borderTopColor: colors.retroBorder + '40',
    paddingTop: 8,
  },
  lookupExamplesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 6,
  },
  exampleItem: {
    marginBottom: 6,
  },
  exampleDe: {
    fontSize: 13,
    color: colors.retroDark,
    fontWeight: '500',
  },
  exampleTrans: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 22,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: 12,
    backgroundColor: colors.retroCream,
    borderTopWidth: 2,
    borderTopColor: colors.retroBorder,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.retroDark,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.retroPurple,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default AddWordModal;
