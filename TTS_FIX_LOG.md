# 🔧 TTS Fix Log - Event Error Issue

**Ngày:** 2026-01-14  
**Issue:** App crash với error `tts-error is not a supported event type`

---

## ❌ Lỗi ban đầu

```
`tts-error` is not a supported event type for TextToSpeech. 
Supported events are: `tts-start`, `tts-finish`, `tts-pause`, 
`tts-resume`, `tts-progress`, `tts-cancel`
```

**Root cause:** Tôi đã dùng event listener `tts-error` nhưng event này không tồn tại trong `react-native-tts`.

---

## ✅ Fix đã thực hiện

### Changed in: `src/components/common/WordTranslatePopup.tsx`

**BEFORE (SAI):**
```typescript
Tts.addEventListener('tts-error', (event) => {
  console.error('[WordTranslatePopup] TTS error event:', event);
});

// ...cleanup
Tts.removeAllListeners('tts-error');
```

**AFTER (ĐÚNG):**
```typescript
Tts.addEventListener('tts-cancel', (event) => {
  console.log('[WordTranslatePopup] TTS cancelled:', event);
});

// ...cleanup
Tts.removeAllListeners('tts-cancel');
```

---

## 📋 TTS Events được support

Theo documentation của `react-native-tts`:

✅ **Supported events:**
1. `tts-start` - TTS bắt đầu nói
2. `tts-finish` - TTS nói xong
3. `tts-pause` - TTS bị pause
4. `tts-resume` - TTS resume sau pause
5. `tts-progress` - Progress của TTS (đang nói đến đâu)
6. `tts-cancel` - TTS bị cancel

❌ **NOT supported:**
- `tts-error` - KHÔNG TỒN TẠI!

---

## 🧪 Testing

Sau khi fix:
- ✅ App không còn crash
- ✅ ESLint pass (0 errors, chỉ warnings không liên quan)
- ✅ TypeScript pass

**Bước tiếp theo:** User cần test TTS xem có đọc được không.

---

## 📚 Tài liệu tham khảo

- [react-native-tts documentation](https://github.com/ak1394/react-native-tts)
- Events list: Xem trong error message hoặc source code của library
