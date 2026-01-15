# iOS - Tính năng Lock/Unlock Bài học

## Tổng quan

Dự án iOS hiện tại **chưa có** tính năng lock/unlock bài học như đã triển khai trên Next.js web app. Cần triển khai các tính năng sau:

- 1 bài Free (admin chọn) - ai cũng xem được kể cả guest
- User mới đăng ký được 2 lần unlock miễn phí
- Unlock thêm tốn 100 points/bài
- Bài locked hiển thị đen trắng + icon khóa
- Không thể lock lại bài đã unlock

## So sánh Next.js vs iOS

| Tính năng | Next.js | iOS |
|-----------|---------|-----|
| `Lesson.isLocked` field | ✅ Có | ❌ Chưa có |
| `Lesson.isFreeLesson` field | ✅ Có | ❌ Chưa có |
| API `/api/lessons/[id]/unlock` | ✅ Có | ❌ Chưa gọi |
| `userUnlockInfo` trong homepage API | ✅ Có | ❌ Chưa parse |
| LessonCard grayscale + lock icon | ✅ Có | ❌ Chưa có |
| UnlockModal popup | ✅ Có | ❌ Chưa có |
| LockedLessonOverlay trên lesson page | ✅ Có | ❌ Chưa có |

---

## Checklist triển khai

### 1. Types - Cập nhật kiểu dữ liệu ✅

- [x] Cập nhật `src/types/lesson.types.ts`:
  - Thêm `isLocked?: boolean` vào interface `Lesson`
  - Thêm `isFreeLesson?: boolean` vào interface `Lesson`
  
- [x] Tạo mới `src/types/unlock.types.ts`:
  ```typescript
  export interface UserUnlockInfo {
    freeUnlocksRemaining: number;
    unlockedCount: number;
    points: number;
  }
  
  export interface UnlockResponse {
    success: boolean;
    usedFreeUnlock?: boolean;
    freeUnlocksRemaining?: number;
    pointsDeducted?: number;
    remainingPoints?: number;
    error?: string;
    required?: number;
    current?: number;
  }
  ```

---

### 2. Services - Cập nhật API calls

- [ ] Cập nhật `src/services/homepage.service.ts`:
  - Thêm `userUnlockInfo: UserUnlockInfo | null` vào `HomepageDataResponse`
  - Parse và trả về `userUnlockInfo` từ API response

- [ ] Tạo mới `src/services/unlock.service.ts`:
  ```typescript
  // POST /api/lessons/:id/unlock
  export const unlockLesson = async (lessonId: string): Promise<UnlockResponse>
  ```

- [ ] Cập nhật `src/services/lesson.service.ts`:
  - Đảm bảo `fetchLessonById` xử lý trường hợp bài bị locked (API trả về 403)

---

### 3. Components - Tạo/cập nhật UI

- [ ] Cập nhật `src/components/lesson/LessonCard.tsx`:
  - Thêm prop `isLocked` vào `LessonCardProps`
  - Thêm hiển thị grayscale filter khi `isLocked === true`
  - Thêm lock icon overlay trên thumbnail
  - Sử dụng style: `opacity: 0.7`, grayscale filter

- [ ] Tạo mới `src/components/lesson/UnlockModal.tsx`:
  - Props: `lesson`, `userUnlockInfo`, `onConfirm`, `onClose`, `isLoading`
  - Hiển thị chi phí unlock (miễn phí hoặc 100 points)
  - Hiển thị số points hiện tại của user
  - Nút xác nhận và hủy
  - Loading state khi đang xử lý

- [ ] Tạo mới `src/components/lesson/LockedLessonOverlay.tsx`:
  - Full-screen overlay cho lesson page bị locked
  - Nút "Mở khóa" để trigger unlock flow
  - Hiển thị thông tin chi phí

---

### 4. Screens - Tích hợp lock/unlock flow

- [ ] Cập nhật `src/screens/HomeScreen.tsx`:
  - Lưu `userUnlockInfo` từ homepage API response
  - Truyền `isLocked` prop xuống `LessonCard`
  - Xử lý click vào bài locked → hiện `UnlockModal`
  - Sau khi unlock thành công → refresh data và navigate đến bài học

- [ ] Cập nhật `src/screens/CategoryScreen.tsx`:
  - Tương tự như HomeScreen
  - Truyền `isLocked` prop xuống `LessonCard`
  - Xử lý unlock flow

- [ ] Cập nhật `src/screens/LessonScreen.tsx`:
  - Kiểm tra `isLocked` từ lesson data
  - Nếu locked → hiển thị `LockedLessonOverlay`
  - Xử lý unlock từ overlay

---

### 5. Contexts/Hooks (Optional nhưng khuyến nghị)

- [ ] Tạo mới `src/hooks/useUnlock.ts`:
  - Hook để quản lý unlock state
  - Xử lý logic unlock (kiểm tra free unlock, points)
  - Return: `{ unlockLesson, isUnlocking, canUnlock }`

- [ ] Cập nhật Context nếu cần lưu userUnlockInfo globally

---

### 6. Styles

- [ ] Thêm styles cho locked state trong `LessonCard`:
  ```typescript
  lockedCard: {
    opacity: 0.7,
  },
  lockIconContainer: {
    position: 'absolute',
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  lockIcon: {
    width: 40,
    height: 40,
    tintColor: '#ffffff',
  },
  ```

- [ ] Tạo styles cho `UnlockModal` (modal center screen, neo-retro design)

- [ ] Tạo styles cho `LockedLessonOverlay`

---

### 7. Localization

- [ ] Cập nhật `src/assets/locales/vi.json`:
  ```json
  "unlock": {
    "title": "Mở khóa bài học",
    "free": "Miễn phí!",
    "freeRemaining": "Còn {{count}} lượt miễn phí",
    "cost": "Chi phí",
    "balance": "Số dư của bạn",
    "confirm": "Mở khóa",
    "confirmFree": "Mở khóa miễn phí",
    "cancel": "Hủy",
    "notEnoughPoints": "Không đủ points để mở khóa",
    "learnMore": "Học thêm để kiếm points!",
    "processing": "Đang xử lý..."
  }
  ```

- [ ] Cập nhật `src/assets/locales/en.json`
- [ ] Cập nhật `src/assets/locales/de.json`

---

## Files cần tạo mới

| File | Mô tả |
|------|-------|
| `src/types/unlock.types.ts` | Types cho unlock feature |
| `src/services/unlock.service.ts` | API calls cho unlock |
| `src/components/lesson/UnlockModal.tsx` | Modal xác nhận unlock |
| `src/components/lesson/LockedLessonOverlay.tsx` | Overlay cho lesson bị locked |
| `src/hooks/useUnlock.ts` | Hook quản lý unlock logic |

## Files cần cập nhật

| File | Thay đổi |
|------|----------|
| `src/types/lesson.types.ts` | Thêm `isLocked`, `isFreeLesson` |
| `src/services/homepage.service.ts` | Parse `userUnlockInfo` |
| `src/services/lesson.service.ts` | Xử lý 403 locked response |
| `src/components/lesson/LessonCard.tsx` | UI locked state |
| `src/screens/HomeScreen.tsx` | Tích hợp unlock flow |
| `src/screens/CategoryScreen.tsx` | Tích hợp unlock flow |
| `src/screens/LessonScreen.tsx` | Locked overlay |
| `src/assets/locales/*.json` | i18n strings |

---

## Tham khảo Next.js implementation

- Spec: [`ppgeil-1/specs/lesson-unlock-feature.md`](file:///Users/chungkk/Code/app-ppgeil/ppgeil-1/specs/lesson-unlock-feature.md)
- API: [`ppgeil-1/pages/api/lessons/[id]/unlock.js`](file:///Users/chungkk/Code/app-ppgeil/ppgeil-1/pages/api/lessons/%5Bid%5D/unlock.js)
- Component: [`ppgeil-1/components/UnlockModal.js`](file:///Users/chungkk/Code/app-ppgeil/ppgeil-1/components/UnlockModal.js)
- LessonCard: [`ppgeil-1/components/LessonCard.js`](file:///Users/chungkk/Code/app-ppgeil/ppgeil-1/components/LessonCard.js)
- Homepage data API: [`ppgeil-1/pages/api/homepage-data.js`](file:///Users/chungkk/Code/app-ppgeil/ppgeil-1/pages/api/homepage-data.js)
