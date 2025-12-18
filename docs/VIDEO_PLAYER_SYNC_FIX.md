# Video Player State Synchronization Fix

## Vấn Đề Ban Đầu

Khi người dùng click nút play/pause, có hiện tượng **mất đồng bộ** giữa:
- Icon nút (▶/⏸)
- Trạng thái video thực tế (playing/paused)
- Transcript sync (polling chạy/dừng)

### Root Cause: Race Condition

```
User clicks Play button
  → togglePlayPause() sets isPlaying=true
  → VideoPlayer renders with play={true}
  → YouTube iframe starts playing (50-200ms delay)
  → YouTube fires 'playing' event
  → handleStateChange('playing') calls setIsPlaying(true)
  ✅ Everything in sync

User quickly clicks Pause
  → togglePlayPause() sets isPlaying=false
  → VideoPlayer renders with play={false}
  → YouTube iframe starts pausing (50-200ms delay)
  
  ❌ BUT if user clicks Play again before YouTube confirms pause:
  → togglePlayPause() sets isPlaying=true (button shows ⏸)
  → YouTube 'paused' event arrives LATE
  → handleStateChange('paused') calls setIsPlaying(false)
  → ❌ CONFLICT: Button shows ⏸ but video is paused!
```

## Giải Pháp: Debounced State Updates

### 1. Thêm Timestamp Tracking

```typescript
// useVideoPlayer.ts
const lastUserActionTime = useRef<number>(0);
const DEBOUNCE_MS = 300; // 300ms debounce window
```

### 2. Separate Handlers

```typescript
// User-initiated actions (instant update)
const togglePlayPause = useCallback(() => {
  lastUserActionTime.current = Date.now();
  setIsPlaying(prev => !prev);
}, [isPlaying]);

// YouTube event handler (debounced)
const setIsPlayingFromYouTube = useCallback((playing: boolean) => {
  const timeSinceUserAction = Date.now() - lastUserActionTime.current;
  
  if (timeSinceUserAction < DEBOUNCE_MS) {
    return; // Ignore stale YouTube events
  }
  
  setIsPlaying(playing);
}, []);
```

### 3. Update Event Handler

```typescript
// LessonScreen.tsx
const handleStateChange = useCallback((state: string) => {
  if (state === 'playing') {
    setIsPlayingFromYouTube(true); // Uses debounced handler
  } else if (state === 'paused') {
    setIsPlayingFromYouTube(false);
  }
}, [setIsPlayingFromYouTube]);
```

## Kết Quả

### Trước Fix
- ❌ Rapid clicks gây mất đồng bộ
- ❌ Button state không phản ánh video thực tế
- ❌ Transcript polling start/stop không chính xác

### Sau Fix
- ✅ User actions luôn được ưu tiên
- ✅ YouTube events muộn bị ignore (trong 300ms window)
- ✅ Button state đồng bộ với video player
- ✅ Transcript polling chạy đúng khi video playing
- ✅ Console logs hiển thị state transitions rõ ràng

## Luồng Hoạt Động Mới

```
1. User clicks Play
   → togglePlayPause() 
   → lastUserActionTime = now
   → setIsPlaying(true)
   → Button shows ⏸
   → VideoPlayer receives play={true}
   → useTranscriptSync starts polling
   
2. (50-200ms later) YouTube event 'playing'
   → handleStateChange('playing')
   → setIsPlayingFromYouTube(true)
   → Checks: (now - lastUserActionTime) < 300ms?
   → YES → Ignores event (user already handled it)
   
3. User clicks Pause (within 300ms)
   → togglePlayPause()
   → lastUserActionTime = now
   → setIsPlaying(false)
   → Button shows ▶
   → VideoPlayer receives play={false}
   → useTranscriptSync stops polling
   
4. Previous 'playing' event arrives late
   → setIsPlayingFromYouTube(true)
   → Checks: (now - lastUserActionTime) < 300ms?
   → YES → Ignores event
   → ✅ State remains false (correct!)
```

## Debug Logs

Enable console logs để theo dõi:

```typescript
// useVideoPlayer.ts
console.log('[useVideoPlayer] User toggled play/pause:', !isPlaying);
console.log('[useVideoPlayer] Ignoring YouTube event (too soon):', playing);
console.log('[useVideoPlayer] YouTube state changed:', playing);

// useTranscriptSync.ts
console.log('[useTranscriptSync] Starting/Stopping polling');
console.log('[useTranscriptSync] Active sentence changed:', { index, time, text });

// LessonScreen.tsx
console.log('[LessonScreen] Player state changed:', state);
```

## Testing Scenarios

### ✅ Test 1: Single Play/Pause
1. Click Play → Video plays, transcript syncs
2. Wait 2 seconds
3. Click Pause → Video pauses, polling stops
4. Verify: Button state matches video state

### ✅ Test 2: Rapid Clicks
1. Click Play
2. Immediately click Pause (< 100ms)
3. Immediately click Play again (< 100ms)
4. Verify: No state conflicts, final state is playing

### ✅ Test 3: Sentence Navigation
1. Click Play
2. Click on a transcript sentence
3. Verify: Video seeks, auto-plays, transcript highlights correct sentence

### ✅ Test 4: Speed Change During Playback
1. Click Play
2. Change speed to 1.5x
3. Verify: Video continues playing at new speed, transcript sync accurate

## Performance Impact

- **Debounce window**: 300ms (negligible user impact)
- **Memory**: +1 ref for timestamp tracking (~8 bytes)
- **CPU**: +1 Date.now() call per user action (~0.001ms)
- **Overall**: ✅ Zero noticeable performance impact

## Related Files

- `/src/hooks/useVideoPlayer.ts` - State management with debounce
- `/src/hooks/useTranscriptSync.ts` - Polling logic tied to isPlaying
- `/src/screens/LessonScreen.tsx` - Event handlers
- `/src/components/player/VideoPlayer.tsx` - YouTube iframe wrapper
- `/src/components/player/PlaybackControls.tsx` - Play/Pause button UI
