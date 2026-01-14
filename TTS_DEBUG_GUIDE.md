# 🔊 TTS (Text-to-Speech) Debug Guide

**Ngày:** 2026-01-14  
**Issue:** TTS không hoạt động khi click vào từ hoặc nút speaker trong popup

---

## 🔧 Đã Fix

### 1. ✅ Thêm TTS initialization
- Init TTS khi component mount
- Check available voices
- Set default language, rate, pitch

### 2. ✅ Thêm event listeners để debug
- `tts-start` - khi bắt đầu nói
- `tts-finish` - khi nói xong
- `tts-cancel` - khi bị cancel

**Lưu ý:** `tts-error` KHÔNG TỒN TẠI! Các events được support:
- `tts-start`, `tts-finish`, `tts-pause`, `tts-resume`, `tts-progress`, `tts-cancel`

### 3. ✅ Thêm error handling đầy đủ
- Try-catch cho mọi TTS call
- Console.log chi tiết để debug
- Tts.stop() trước khi speak mới

### 4. ✅ Thêm cleanup
- Remove listeners khi component unmount

---

## 🔍 Cách test và debug

### Bước 1: Xem console logs
Khi bạn click vào từ hoặc nút loa, bạn sẽ thấy các logs sau trong Metro bundler hoặc Xcode console:

```
[WordTranslatePopup] Initializing TTS...
[WordTranslatePopup] Available TTS voices: XX
[WordTranslatePopup] TTS initialized successfully
[WordTranslatePopup] Auto-speaking word: hello
[WordTranslatePopup] Calling Tts.speak() for auto-speak...
[WordTranslatePopup] TTS started: {...}
[WordTranslatePopup] Auto-speak called successfully
[WordTranslatePopup] TTS finished: {...}
```

### 📝 **Nếu vẫn không đọc được, hãy kiểm tra:**

1. **Xem console logs** trong React Native Debugger hoặc Metro bundler:
   - Xem có log `[WordTranslatePopup] Initializing TTS...`?
   - Có bao nhiêu voices available?
   - Có error nào không?

2. **Kiểm tra device settings:**
   - iOS Settings → Accessibility → Spoken Content → Speaking Rate
   - Đảm bảo volume không bị tắt
   - Kiểm tra silent mode switch trên iPhone

3. **Test thử command này** để xem logs:
   ```bash
   # Xem logs realtime từ iOS simulator/device
   npx react-native log-ios
   ```

Bạn có thể chạy app và xem logs trong console để debug. Các log quan trọng:
- `[WordTranslatePopup] Initializing TTS...`
- `[WordTranslatePopup] Available TTS voices: X`
- `[WordTranslatePopup] TTS started:` (khi bắt đầu speak)
- `[WordTranslatePopup] TTS finished:` (khi speak xong)

Nếu vẫn không có âm thanh, có thể là:
1. Simulator iOS có thể không support TTS tốt - cần test trên device thật
2. Volume/mute switch trên device/simulator
