# Offline Playback Integration Guide (T103)

This guide explains how to integrate offline playback functionality into the existing `LessonScreen.tsx`.

## Required Imports

Add these imports to `LessonScreen.tsx`:

```typescript
import useOfflineDownloads from '../hooks/useOfflineDownloads';
import useNetworkStatus from '../hooks/useNetworkStatus';
import OfflineIndicator from '../components/offline/OfflineIndicator';
import DownloadButton from '../components/offline/DownloadButton';
```

## Add Hooks to Component

Inside the `LessonScreen` component:

```typescript
// Offline downloads
const {
  isLessonDownloaded,
  getDownload,
  downloadLesson,
  deleteDownload,
  downloadProgress,
} = useOfflineDownloads();

// Network status
const { isOffline } = useNetworkStatus();

// Check if lesson is downloaded
const isDownloaded = isLessonDownloaded(lesson.id);
const download = getDownload(lesson.id);
```

## Add Offline Indicator

At the top of the screen (before other content):

```typescript
<OfflineIndicator isVisible={isOffline} />
```

## Modify Video Player

Update the video player to use local file when available:

```typescript
// Determine video source
const videoSource = isDownloaded && download
  ? { uri: `file://${download.videoFilePath}` }
  : { uri: lesson.youtubeUrl };

// Pass to YouTube player or video player
<YoutubePlayer
  videoId={isDownloaded ? undefined : extractVideoId(lesson.youtubeUrl)}
  // ... other props
/>

// OR for local video player:
<Video
  source={videoSource}
  // ... other props
/>
```

## Add Download Button

Add download button to lesson header or controls:

```typescript
<DownloadButton
  isDownloaded={isDownloaded}
  onDownload={() => downloadLesson(lesson)}
  onDelete={() => deleteDownload(lesson.id)}
  downloadProgress={downloadProgress[lesson.id]}
  disabled={isDownloading}
/>
```

## Handle Offline Transcript

Transcript should load from local storage when offline:

```typescript
const loadTranscript = async () => {
  if (isDownloaded && download) {
    // Load transcript from local file
    // const transcriptData = await RNFS.readFile(download.transcriptFilePath);
    // const transcript = JSON.parse(transcriptData);
    // setTranscript(transcript);
  } else {
    // Load from API (existing logic)
    const data = await lessonService.fetchLessonById(lesson.id);
    setTranscript(data.transcript);
  }
};
```

## Update Last Accessed Time

When lesson is played offline:

```typescript
useEffect(() => {
  if (isDownloaded && isOffline) {
    offlineService.updateLastAccessed(lesson.id);
  }
}, [isDownloaded, isOffline, lesson.id]);
```

## Complete Integration Example

```typescript
const LessonScreen: React.FC<LessonScreenProps> = ({ route, navigation }) => {
  const { lesson } = route.params;
  
  // Offline hooks
  const {
    isLessonDownloaded,
    getDownload,
    downloadLesson,
    deleteDownload,
    downloadProgress,
  } = useOfflineDownloads();
  
  const { isOffline } = useNetworkStatus();
  
  // Check download status
  const isDownloaded = isLessonDownloaded(lesson.id);
  const download = getDownload(lesson.id);
  const isDownloading = !!downloadProgress[lesson.id];

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline indicator */}
      <OfflineIndicator isVisible={isOffline} />
      
      <ScrollView>
        {/* Video Player */}
        <VideoPlayer
          videoId={isDownloaded ? undefined : lesson.videoId}
          localPath={download?.videoFilePath}
          // ... other props
        />
        
        {/* Download Button */}
        <DownloadButton
          isDownloaded={isDownloaded}
          onDownload={() => downloadLesson(lesson)}
          onDelete={() => deleteDownload(lesson.id)}
          downloadProgress={downloadProgress[lesson.id]}
          disabled={isDownloading}
        />
        
        {/* Transcript */}
        <TranscriptView
          transcript={lesson.transcript}
          // ... other props
        />
      </ScrollView>
    </SafeAreaView>
  );
};
```

## Testing Offline Mode

1. Download a lesson using the Download button
2. Turn off WiFi and cellular data on device
3. Verify OfflineIndicator appears
4. Navigate to downloaded lesson
5. Verify video plays from local storage
6. Verify transcript displays correctly

## Notes

- Actual file download requires `react-native-fs` package
- YouTube videos cannot be played offline (use local video player with downloaded files)
- Transcript is stored as JSON file in offline storage
- Update last accessed time for LRU cleanup
