# Hide Navigation Bar Update

**Date**: 2025-12-18  
**Status**: ✅ Complete

---

## Changes

### ✅ Full-Screen LessonScreen

Ẩn navigation header và bottom tab bar để có trải nghiệm toàn màn hình khi xem video.

**Before**:
```
┌─────────────────────────────────┐
│ < Back      Lesson Title        │ <- Navigation header
├─────────────────────────────────┤
│         Video Player            │
├─────────────────────────────────┤
│         Transcript              │
├─────────────────────────────────┤
│  Home  Phrase  Profile  More    │ <- Bottom tab bar
└─────────────────────────────────┘
```

**After**:
```
┌─────────────────────────────────┐
│ ←                               │ <- Floating back button
│         Video Player            │
├─────────────────────────────────┤
│                                 │
│         Transcript              │
│        (More Space!)            │
│                                 │
└─────────────────────────────────┘ <- No tab bar!
```

---

## Implementation

### 1. Hide Navigation Header & Bottom Tabs
```typescript
import { useLayoutEffect } from 'react';

useLayoutEffect(() => {
  // Hide header
  navigation.setOptions({
    headerShown: false,
  });

  // Hide bottom tab bar
  const parent = navigation.getParent();
  if (parent) {
    parent.setOptions({
      tabBarStyle: { display: 'none' },
    });
  }

  // Restore bottom tab bar when leaving screen
  return () => {
    if (parent) {
      parent.setOptions({
        tabBarStyle: undefined,
      });
    }
  };
}, [navigation]);
```

### 2. Add Floating Back Button
```typescript
<TouchableOpacity 
  style={styles.backButton}
  onPress={() => navigation.goBack()}
>
  <Text style={styles.backIcon}>←</Text>
</TouchableOpacity>
```

**Styling**:
- Position: Absolute (top-left)
- Size: 40x40px
- Background: `rgba(0, 0, 0, 0.6)` (translucent black)
- Top: 50px (below status bar)
- Left: 16px
- Z-index: 10 (floats above video)
- Shadow for depth

---

## Benefits

✅ **Maximum screen space** - Transcript list gets ~100px more height  
✅ **No distractions** - Hide both header and bottom tabs  
✅ **Better focus** - Focus on video and learning  
✅ **Modern design** - Floating back button (Instagram/YouTube style)  
✅ **Easy exit** - Tap back button or swipe gesture  
✅ **Auto-restore** - Bottom tabs reappear when leaving screen

---

## Files Modified

```
src/screens/LessonScreen.tsx
  - Added useLayoutEffect import
  - Hide header with navigation.setOptions()
  - Hide bottom tabs with parent.setOptions()
  - Auto-restore tabs in cleanup function
  - Added floating back button component
  - Added backButton + backIcon styles
```

---

## Testing

```bash
cd AwesomeProject
npm run ios

# 1. From HomeScreen, tap a lesson card
# 2. Verify navigation header is hidden
# 3. Verify bottom tab bar is hidden
# 4. Verify back button visible at top-left
# 5. Verify transcript has more space (~100px)
# 6. Tap back button → should return to HomeScreen
# 7. Verify bottom tabs reappear on HomeScreen
# 8. Try swipe-back gesture → tabs also restore
```

---

## Visual Result

```
Full Screen Layout (iPhone):
┌───────────────────────────────────┐
│  ←                                │ <- Floating back (no header)
│        YouTube Video              │
│          (280px)                  │
├───────────────────────────────────┤
│  #1 / 54                    ⚙️    │
├───────────────────────────────────┤
│  ▶  Peppa Geschichten –           │
│      Câu chuyện của Peppa –       │
├───────────────────────────────────┤
│  ▶  Uns springen! Es tut beim...  │
│      Chúng ta nhảy! Nó đau...     │
│  ▶  Heute spielen Peppa und...    │ <- More transcript visible!
│      Hôm nay Peppa và các bạn...  │
├───────────────────────────────────┤
│   ‹    ▶    🎤    ›    N          │ <- Playback controls
└───────────────────────────────────┘ <- No bottom tabs!

Space gained: ~100px (from hidden tab bar)
Total transcript height: ~450px (vs ~350px before)
```

---

**Completed**: ✅  
**Ready for**: Production
