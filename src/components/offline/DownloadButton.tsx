import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { DownloadProgress } from '../../types/offline.types';

interface DownloadButtonProps {
  isDownloaded: boolean;
  onDownload: () => void;
  onDelete?: () => void;
  downloadProgress?: DownloadProgress;
  disabled?: boolean;
}

/**
 * DownloadButton Component
 * Shows download/delete button with progress indicator
 */
const DownloadButton: React.FC<DownloadButtonProps> = ({
  isDownloaded,
  onDownload,
  onDelete,
  downloadProgress,
  disabled = false,
}) => {
  const isDownloading = downloadProgress?.status === 'downloading';

  if (isDownloading && downloadProgress) {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${downloadProgress.progress}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(downloadProgress.progress)}%</Text>
      </View>
    );
  }

  if (isDownloaded) {
    return (
      <View style={styles.downloadedContainer}>
        <View style={styles.downloadedBadge}>
          <Icon name="checkmark" size={16} color={colors.textPrimary} />
          <Text style={styles.downloadedText}>Downloaded</Text>
        </View>
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Icon name="trash" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.downloadButton, disabled && styles.downloadButtonDisabled]}
      onPress={onDownload}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Icon name="download" size={16} color={colors.textPrimary} />
      <Text style={styles.downloadText}>Download</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentBlue,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    gap: spacing.xs,
  },
  downloadButtonDisabled: {
    opacity: 0.3,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentBlue,
    borderRadius: borderRadius.round,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  downloadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    gap: spacing.xs,
  },
  downloadedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DownloadButton;
