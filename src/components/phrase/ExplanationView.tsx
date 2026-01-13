import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';

interface ExplanationViewProps {
  explanation?: string;
  loading?: boolean;
  onRequestExplanation?: () => void;
  collapsed?: boolean;
}

/**
 * ExplanationView Component
 * Displays expandable detailed explanation for a phrase
 * Supports loading state and on-demand fetching
 */
const ExplanationView: React.FC<ExplanationViewProps> = ({
  explanation,
  loading = false,
  onRequestExplanation,
  collapsed = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  const handleToggle = () => {
    if (!isExpanded && !explanation && onRequestExplanation) {
      onRequestExplanation();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Collapse/Expand Button */}
      <TouchableOpacity
        style={styles.headerButton}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>
          {isExpanded ? '▼' : '►'} Detailed Explanation
        </Text>
      </TouchableOpacity>

      {/* Explanation Content */}
      {isExpanded && (
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accentBlue} />
              <Text style={styles.loadingText}>Loading explanation...</Text>
            </View>
          ) : explanation ? (
            <Text style={styles.explanationText}>{explanation}</Text>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No explanation available yet.
              </Text>
              {onRequestExplanation && (
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={onRequestExplanation}
                  activeOpacity={0.7}
                >
                  <Text style={styles.requestButtonText}>
                    Generate Explanation
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.retroCream,
    borderRadius: borderRadius.medium,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 4,
    borderColor: colors.retroBorder,
    ...shadows.md,
  },
  headerButton: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroPink,
    borderRadius: borderRadius.small,
    margin: spacing.sm,
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.retroDark,
    textTransform: 'uppercase',
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.retroDark,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  explanationText: {
    fontSize: 15,
    color: colors.retroDark,
    lineHeight: 24,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.retroDark,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  requestButton: {
    backgroundColor: colors.retroCyan,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.small,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    ...shadows.sm,
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
    textTransform: 'uppercase',
  },
});

export default ExplanationView;
