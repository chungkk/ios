# Bugfix: "Lesson Not Found" Error

## Problem
iOS app showed "Lesson Not Found" error when clicking on lessons from the HomeScreen.

## Root Cause Analysis

### Issue 1: Missing Transcript Data
The iOS app was expecting the lesson API endpoint (`/api/lessons/:id`) to return a `transcript` field directly, but the Next.js backend only returns:
- Lesson metadata (title, youtubeUrl, level, category, etc.)
- A `json` field pointing to the transcript file path (e.g., `/text/lesson-name.json`)

### Issue 2: API Data Structure Mismatch
The transcript JSON files use different field names than what the iOS app expected:
- API uses: `start`, `end`, `translationEn`, `translationVi`
- iOS app expected: `startTime`, `endTime`, `translation: { en, vi }`

## Solution

### 1. Updated Lesson Service (`src/services/lesson.service.ts`)

**Before:**
```typescript
const response = await api.get<LessonDetailResponse>(`/api/lessons/${lessonId}`);
return response.data.lesson;
```

**After:**
```typescript
// Fetch lesson metadata
const response = await api.get<any>(`/api/lessons/${lessonId}`);
const lessonData = response.data;

// Fetch transcript from JSON file
if (lessonData.json) {
  const transcriptResponse = await api.get<any[]>(lessonData.json);
  
  // Transform transcript to match app's expected format
  const transformedTranscript = transcriptResponse.data.map((item: any) => ({
    text: item.text,
    start: item.start,
    end: item.end,
    startTime: item.start,
    endTime: item.end,
    wordTimings: item.wordTimings || [],
    translation: item.translationVi || '',
    translationEn: item.translationEn,
    translationVi: item.translationVi,
  }));
  
  lessonData.transcript = transformedTranscript;
}

return lessonData;
```

### 2. Updated TypeScript Types (`src/types/lesson.types.ts`)

Added support for both API format and app format:

```typescript
export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface Sentence {
  text: string;
  start: number;              // Raw from API
  end: number;                // Raw from API
  startTime: number;          // Normalized for app
  endTime: number;            // Normalized for app
  wordTimings?: WordTiming[];
  translation?: string;       // Selected by user's language
  translationEn?: string;
  translationVi?: string;
}
```

## How It Works Now

1. **User taps lesson card** → Navigate to LessonScreen with `lessonId`
2. **useLessonData hook** calls `lessonService.fetchLessonById(lessonId)`
3. **Lesson service:**
   - Fetches lesson metadata from `/api/lessons/:id`
   - Checks if lesson has `json` field
   - Fetches transcript from `lesson.json` path (e.g., `/text/lesson-name.json`)
   - Transforms transcript data to match app's expected format
   - Caches complete lesson with transcript for 1 hour
4. **LessonScreen** receives lesson with populated `transcript` array
5. **Video plays** with synchronized transcript highlighting

## Testing

### Manual Test Steps
1. ✅ Launch iOS app
2. ✅ Browse lessons on HomeScreen
3. ✅ Tap a lesson card
4. ✅ Verify lesson loads without "Lesson Not Found" error
5. ✅ Verify video player displays
6. ✅ Verify transcript displays below video
7. ✅ Play video and verify transcript highlights current sentence

### API Verification
```bash
# Test lesson metadata endpoint
curl http://localhost:3000/api/lessons/deutsch-lernen-a1-lektion-14-dialoge-mter-und-behrden-umzug

# Test transcript file
curl http://localhost:3000/text/deutsch-lernen-a1-lektion-14-dialoge-mter-und-behrden-umzug.json
```

## Environment Configuration

### Current Setup
- **Backend (Next.js)**: Running on `http://localhost:3000`
- **iOS App**: Configured to use `API_BASE_URL=http://localhost:3000` (`.env`)
- **iOS Simulator**: Can access localhost on macOS (same machine)

### Alternative Configuration (If Needed)
If iOS simulator cannot reach localhost, update `.env`:
```bash
API_BASE_URL=http://192.168.2.222:3000  # Use your machine's IP
```

## Related Files Changed
- `src/services/lesson.service.ts` - Added transcript fetching logic
- `src/types/lesson.types.ts` - Updated Sentence interface
- This document

## Status
✅ **RESOLVED** - Lesson playback and transcript display working correctly on iOS simulator

### Verification
Tested with lesson "Peppa Wutz-Geschichten" - all features working:
- ✅ Video loads and plays
- ✅ Transcript sentences display in German
- ✅ Vietnamese translations display below each sentence
- ✅ Play controls functional

## Next Steps
- Test on physical iOS device
- Verify caching works properly (1-hour TTL)
- Test with different lessons
- Test offline lesson playback (Phase 8 - US6)
