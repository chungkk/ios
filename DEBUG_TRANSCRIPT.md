# Debug Transcript Loading Issue

## Status: INVESTIGATING

### Issue
Transcript text is not displaying in the TranscriptView component.

### Checklist

#### 1. Verify API Returns Transcript ✅
```bash
# Test lesson metadata endpoint
curl -s http://localhost:3000/api/lessons/deutsch-lernen-a1-lektion-14-dialoge-mter-und-behrden-umzug | python3 -m json.tool | grep -A2 "json"

# Expected: Should show "json": "/text/lesson-name.json"
```

#### 2. Verify Transcript File Exists ✅
```bash
# Test transcript file endpoint
curl -s http://localhost:3000/text/deutsch-lernen-a1-lektion-14-dialoge-mter-und-behrden-umzug.json | python3 -m json.tool | head -50

# Expected: Should return array of sentences with text, start, end, translations
```

#### 3. Check Console Logs in iOS Simulator
Look for these logs:
- `[LessonService] Fetching lesson from API: <lessonId>`
- `[LessonService] Fetching transcript from: <json path>`
- `[LessonService] Transcript loaded, sentences: <count>`
- `[LessonScreen] Rendering with transcript length: <count>`
- `[TranscriptView] Rendering with <count> sentences`
- `[TranscriptView] First sentence: <text>`

### Possible Issues

#### Issue A: Transcript Fetch Fails (Network/CORS)
**Symptoms:**
- Console shows: `[LessonService] Error fetching transcript`
- TranscriptView shows: "No transcript available"

**Solution:**
1. Check network connectivity from iOS simulator
2. Verify backend is running on port 3000
3. Check CORS settings in Next.js backend

#### Issue B: Data Transformation Error
**Symptoms:**
- Transcript array is empty `[]`
- Console shows transcript loaded but length is 0

**Solution:**
1. Check if transformation logic in `lesson.service.ts` is correct
2. Verify API response format matches expected format

#### Issue C: Component Rendering Issue
**Symptoms:**
- Transcript data exists but text doesn't display
- FlatList not rendering items

**Solution:**
1. Check SentenceItem component receives data
2. Verify styles are not hiding content
3. Check if FlatList has proper layout (flex: 1)

### Debug Steps

#### Step 1: Add More Logging
```typescript
// In lesson.service.ts
console.log('[LessonService] Raw transcript response:', transcriptResponse.data?.slice(0, 2));
console.log('[LessonService] Transformed sample:', transformedTranscript?.slice(0, 2));
```

#### Step 2: Test Direct API Call from Simulator
Open Safari on iOS Simulator and navigate to:
```
http://localhost:3000/api/lessons/deutsch-lernen-a1-lektion-14-dialoge-mter-und-behrden-umzug
```

Then navigate to the transcript file URL from the response.

#### Step 3: Verify React Native Debugger
Enable React Native debugger:
1. Shake device (Cmd+D in simulator)
2. Select "Debug"
3. Open Chrome DevTools
4. Check Network tab for API calls

### Recent Changes

✅ **Fixed:** Updated `lesson.service.ts` to fetch transcript from JSON file
✅ **Fixed:** Updated `Sentence` type to include both `start/end` and `startTime/endTime`
✅ **Fixed:** Added transcript transformation to normalize field names
✅ **Fixed:** Updated `SentenceItem.tsx` to display translation as string
✅ **Added:** Debug logs in LessonScreen and TranscriptView
✅ **Added:** Empty state for TranscriptView

### Next Steps

1. Check iOS simulator console logs
2. Verify transcript data reaches TranscriptView
3. If transcript is empty, check network requests in debugger
4. If transcript exists but doesn't display, check FlatList rendering
