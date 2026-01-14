import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import PhraseCard from '../components/phrase/PhraseCard';
import ExplanationView from '../components/phrase/ExplanationView';
import { DailyPhrase } from '../types/phrase.types';
import {
  getTodaysPhrase,
  getPhraseForOffset,
  formatPhraseDate,
} from '../utils/phraseUtils';
import phraseService from '../services/phrase.service';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

/**
 * DailyPhraseScreen
 * Displays daily German phrase with navigation to previous/next/today
 */
const DailyPhraseScreen: React.FC = () => {
  const [currentOffset, setCurrentOffset] = useState(0); // 0 = today
  const [currentPhrase, setCurrentPhrase] = useState<DailyPhrase>(getTodaysPhrase());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [nativeLanguage] = useState<'vi' | 'en' | 'de'>('vi');

  // Update phrase when offset changes
  useEffect(() => {
    const phrase = getPhraseForOffset(currentOffset);
    setCurrentPhrase(phrase);
    
    const date = new Date();
    date.setDate(date.getDate() + currentOffset);
    setCurrentDate(date);
  }, [currentOffset]);

  // Handle previous day navigation
  const handlePreviousDay = () => {
    setCurrentOffset(currentOffset - 1);
  };

  // Handle next day navigation
  const handleNextDay = () => {
    setCurrentOffset(currentOffset + 1);
  };

  // Handle return to today
  const handleToday = () => {
    setCurrentOffset(0);
  };

  // Handle explanation request
  const handleRequestExplanation = async () => {
    if (loadingExplanation) return;

    setLoadingExplanation(true);
    try {
      const explanation = await phraseService.fetchPhraseExplanation({
        phrase: currentPhrase.phrase,
        meaning: currentPhrase.meaning,
        example: currentPhrase.example,
        targetLang: nativeLanguage,
      });

      // Update current phrase with fetched explanation
      setCurrentPhrase({
        ...currentPhrase,
        explanation: {
          ...currentPhrase.explanation,
          [nativeLanguage]: explanation,
        },
      });
    } catch (error) {
      console.error('Failed to fetch explanation:', error);
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Get explanation for current language
  const currentExplanation = currentPhrase.explanation?.[nativeLanguage as 'en' | 'vi'];

  // Determine if "Next Day" button should be disabled (can't go to future)
  const isFuture = currentOffset > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily German Phrase</Text>
          <Text style={styles.dateText}>
            {formatPhraseDate(currentDate)}
          </Text>
        </View>

        {/* Navigation Controls */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePreviousDay}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonText}>← Previous Day</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.todayButton, currentOffset === 0 && styles.todayButtonActive]}
            onPress={handleToday}
            disabled={currentOffset === 0}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.todayButtonText,
              currentOffset === 0 && styles.todayButtonTextActive
            ]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, isFuture && styles.navButtonDisabled]}
            onPress={handleNextDay}
            disabled={isFuture}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.navButtonText,
              isFuture && styles.navButtonTextDisabled
            ]}>
              Next Day →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Phrase Card */}
        <PhraseCard phrase={currentPhrase} _nativeLanguage={nativeLanguage} />

        {/* Detailed Explanation */}
        <ExplanationView
          explanation={currentExplanation}
          loading={loadingExplanation}
          onRequestExplanation={handleRequestExplanation}
          collapsed={!currentExplanation}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.retroCyan,
    borderBottomWidth: 4,
    borderBottomColor: colors.retroBorder,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.retroDark,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.retroDark,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.retroCream,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    alignItems: 'center',
    ...shadows.sm,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  todayButton: {
    backgroundColor: colors.retroYellow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.small,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    ...shadows.sm,
  },
  todayButtonActive: {
    backgroundColor: colors.retroCoral,
    borderColor: colors.retroBorder,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
  },
  todayButtonTextActive: {
    color: colors.retroCream,
  },
});

export default DailyPhraseScreen;
