import React, { useState } from 'react';
import {
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import useOfflineDownloads from '../hooks/useOfflineDownloads';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';
import { OfflineDownload } from '../types/offline.types';

/**
 * DownloadManagerScreen
 * Lists all downloaded lessons with storage management
 */
const DownloadManagerScreen: React.FC = () => {
  const {
    downloads,
    loading,
    error,
    storageInfo,
    deleteDownload,
    clearAllDownloads,
    refresh,
    refreshStorageInfo,
  } = useOfflineDownloads();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Handle delete download
   */
  const handleDelete = async (download: OfflineDownload) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete this lesson? This will free up ${formatFileSize(download.fileSize)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(download.lessonId);
              await deleteDownload(download.lessonId);
              await refreshStorageInfo();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete download');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle clear all downloads
   */
  const handleClearAll = () => {
    if (downloads.length === 0) return;

    Alert.alert(
      'Clear All Downloads',
      `Are you sure you want to delete all ${downloads.length} downloaded lessons? This will free up ${formatFileSize(storageInfo?.usedSpace || 0)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllDownloads();
              await refreshStorageInfo();
            } catch (err) {
              Alert.alert('Error', 'Failed to clear downloads');
            }
          },
        },
      ]
    );
  };

  /**
   * Render download item
   */
  const renderDownloadItem = ({ item }: { item: OfflineDownload }) => {
    const isDeleting = deletingId === item.lessonId;

    return (
      <View style={styles.downloadItem}>
        <View style={styles.downloadInfo}>
          <Text style={styles.lessonId} numberOfLines={1}>
            Lesson ID: {item.lessonId}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Size: {formatFileSize(item.fileSize)}
            </Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>
              Downloaded: {formatDate(item.downloadedAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={() => handleDelete(item)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={styles.deleteIcon}>🗑️</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>No Downloaded Lessons</Text>
      <Text style={styles.emptyText}>
        Download lessons for offline access from the home screen.
      </Text>
    </View>
  );

  /**
   * Render storage info header
   */
  const renderStorageInfo = () => {
    if (!storageInfo) return null;

    const usedPercentage = (storageInfo.usedSpace / storageInfo.totalSpace) * 100;

    return (
      <View style={styles.storageCard}>
        <Text style={styles.storageTitle}>Storage Usage</Text>
        
        <View style={styles.storageStatsRow}>
          <View style={styles.storageStat}>
            <Text style={styles.storageValue}>{formatFileSize(storageInfo.usedSpace)}</Text>
            <Text style={styles.storageLabel}>Used</Text>
          </View>
          
          <View style={styles.storageStat}>
            <Text style={styles.storageValue}>{formatFileSize(storageInfo.availableSpace)}</Text>
            <Text style={styles.storageLabel}>Available</Text>
          </View>
          
          <View style={styles.storageStat}>
            <Text style={styles.storageValue}>{storageInfo.downloadCount}</Text>
            <Text style={styles.storageLabel}>Downloads</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, usedPercentage)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{usedPercentage.toFixed(1)}% of total storage</Text>

        {downloads.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearAllText}>Clear All Downloads</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={styles.loadingText}>Loading downloads...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Download Manager</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            refresh();
            refreshStorageInfo();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={downloads}
        renderItem={renderDownloadItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderStorageInfo}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 20,
  },
  listContent: {
    padding: spacing.lg,
  },
  storageCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  storageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  storageStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  storageStat: {
    alignItems: 'center',
  },
  storageValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accentBlue,
    marginBottom: spacing.xs,
  },
  storageLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    marginBottom: spacing.sm,
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
    marginBottom: spacing.md,
  },
  clearAllButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    ...shadows.sm,
  },
  downloadInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  lessonId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaSeparator: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteIcon: {
    fontSize: 20,
  },
  separator: {
    height: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
  errorBanner: {
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});

export default DownloadManagerScreen;
