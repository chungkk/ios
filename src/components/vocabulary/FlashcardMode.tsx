import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { useSettings } from '../../contexts/SettingsContext';
import { colors, spacing } from '../../styles/theme';
import { VocabularyItem } from '../../services/vocabulary.service';
import {
  SRSCard,
  CardState,
  Rating,
  SRS_CONFIG,
  createNewCard,
  calculateNextReview,
  getAllNextReviewTexts,
  buildStudyQueue,
} from '../../utils/srs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlashcardModeProps {
  vocabulary: VocabularyItem[];
  onClose: () => void;
  onUpdateCard?: (card: SRSCard) => void;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ vocabulary, onClose, onUpdateCard }) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [cards, setCards] = useState<SRSCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyQueue, setStudyQueue] = useState<ReturnType<typeof buildStudyQueue> | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [autoTtsEnabled, setAutoTtsEnabled] = useState(true);
  const lastRatedRef = useRef<{ card: SRSCard; prevCards: SRSCard[]; prevIndex: number; prevStats: typeof sessionStats } | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  // Initialize cards from vocabulary - restore SRS state if exists
  useEffect(() => {
    const srsCards = vocabulary.map(v => {
      // If vocabulary has persisted SRS data, restore it
      if (v.srsState && v.srsDue) {
        return {
          id: v.id,
          word: v.word,
          translation: v.translation,
          context: v.context,
          example: v.example ?? undefined,
          grammar: v.grammar ?? undefined,
          partOfSpeech: v.partOfSpeech ?? undefined,
          baseForm: v.baseForm ?? undefined,
          IPA: v.pronunciation ?? undefined,
          state: v.srsState as CardState,
          ease: v.srsEase ?? SRS_CONFIG.STARTING_EASE,
          interval: v.srsInterval ?? 0,
          stepIndex: v.srsStepIndex ?? 0,
          due: new Date(v.srsDue),
          reviews: v.srsReviews ?? 0,
          lapses: v.srsLapses ?? 0,
          lastReview: v.srsLastReview ? new Date(v.srsLastReview) : null,
        } as SRSCard;
      }
      // Otherwise create new card
      return createNewCard({
        id: v.id,
        word: v.word,
        translation: v.translation,
        context: v.context,
        example: v.example ?? undefined,
        grammar: v.grammar ?? undefined,
        partOfSpeech: v.partOfSpeech ?? undefined,
        baseForm: v.baseForm ?? undefined,
        IPA: v.pronunciation ?? undefined,
      });
    });
    setCards(srsCards);
    setStudyQueue(buildStudyQueue(srsCards));
  }, [vocabulary]);

  const currentCard = studyQueue ? [
    ...studyQueue.learningCards,
    ...studyQueue.reviewCards,
    ...studyQueue.newCards,
  ][currentIndex] : null;

  const totalCards = studyQueue
    ? studyQueue.learningCards.length + studyQueue.reviewCards.length + studyQueue.newCards.length
    : 0;

  const vibrate = useCallback((pattern: number | number[]) => {
    if (settings.hapticEnabled) {
      Vibration.vibrate(pattern);
    }
  }, [settings.hapticEnabled]);

  const handleSpeak = useCallback((text: string) => {
    try {
      const clean = text.replace(/[.,!?;:"""''\u201E-]/g, '').trim();
      if (!clean) return;
      Tts.stop().catch(() => {});
      Tts.setDefaultLanguage('de-DE').then(() => Tts.speak(clean));
    } catch {}
  }, []);

  const flipCard = useCallback(() => {
    vibrate(20);
    const willFlip = !isFlipped;
    setIsFlipped(willFlip);
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    // Auto TTS when flipping to back
    if (willFlip && currentCard && autoTtsEnabled) {
      handleSpeak(currentCard.word);
    }
  }, [isFlipped, flipAnim, vibrate, currentCard, handleSpeak, autoTtsEnabled]);

  const handleRating = useCallback((rating: Rating) => {
    if (!currentCard) return;

    // Save undo state
    lastRatedRef.current = {
      card: { ...currentCard },
      prevCards: [...cards],
      prevIndex: currentIndex,
      prevStats: { ...sessionStats },
    };
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 4000); // Hide undo after 4s

    // Vibrate based on rating
    switch (rating) {
      case Rating.AGAIN:
        vibrate([0, 50, 50, 50]);
        break;
      case Rating.HARD:
        vibrate(40);
        break;
      case Rating.GOOD:
        vibrate(30);
        break;
      case Rating.EASY:
        vibrate(50);
        break;
    }

    // Update stats
    setSessionStats(prev => ({
      ...prev,
      [rating === Rating.AGAIN ? 'again' : rating === Rating.HARD ? 'hard' : rating === Rating.GOOD ? 'good' : 'easy']: prev[rating === Rating.AGAIN ? 'again' : rating === Rating.HARD ? 'hard' : rating === Rating.GOOD ? 'good' : 'easy'] + 1,
    }));

    // Calculate next review
    const updatedCard = calculateNextReview(currentCard, rating);
    onUpdateCard?.(updatedCard);

    // Update cards
    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));

    // Animate slide out
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Reset for next card
      setIsFlipped(false);
      flipAnim.setValue(0);
      slideAnim.setValue(0);
      setCompletedCount(prev => prev + 1);

      if (currentIndex < totalCards - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Session complete - rebuild queue
        const newQueue = buildStudyQueue(cards);
        if (newQueue.learningCards.length + newQueue.reviewCards.length + newQueue.newCards.length > 0) {
          setStudyQueue(newQueue);
          setCurrentIndex(0);
        }
      }
    });
  }, [currentCard, currentIndex, totalCards, cards, flipAnim, slideAnim, onUpdateCard, vibrate, sessionStats]);

  const undoLastRating = useCallback(() => {
    if (!lastRatedRef.current) return;
    const { prevCards, prevIndex, prevStats, card } = lastRatedRef.current;
    setCards(prevCards);
    setCurrentIndex(prevIndex);
    setSessionStats(prevStats);
    setCompletedCount(prev => Math.max(0, prev - 1));
    setIsFlipped(false);
    flipAnim.setValue(0);
    slideAnim.setValue(0);
    onUpdateCard?.(card); // restore original card state
    lastRatedRef.current = null;
    setShowUndo(false);
  }, [flipAnim, slideAnim, onUpdateCard]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [
      { rotateY: frontInterpolate },
      { translateX: slideAnim },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      { rotateY: backInterpolate },
      { translateX: slideAnim },
    ],
  };

  const reviewTexts = currentCard ? getAllNextReviewTexts(currentCard) : null;

  // Session complete screen
  if (totalCards === 0 || currentIndex >= totalCards) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completeContainer}>
          <View style={styles.completeCard}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={styles.completeTitle}>{t('vocabulary.flashcardComplete')}</Text>
            <Text style={styles.completeSubtitle}>
              {t('vocabulary.flashcardCompleteMsg', { count: completedCount })}
            </Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: '#ffebee' }]}>
                <Text style={styles.statValue}>{sessionStats.again}</Text>
                <Text style={styles.statLabel}>{t('vocabulary.forgot')}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#fff3e0' }]}>
                <Text style={styles.statValue}>{sessionStats.hard}</Text>
                <Text style={styles.statLabel}>{t('vocabulary.hard')}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#e8f5e9' }]}>
                <Text style={styles.statValue}>{sessionStats.good}</Text>
                <Text style={styles.statLabel}>{t('vocabulary.good')}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#e3f2fd' }]}>
                <Text style={styles.statValue}>{sessionStats.easy}</Text>
                <Text style={styles.statLabel}>{t('vocabulary.easy')}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{t('vocabulary.back')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Icon name="close" size={24} color={colors.retroDark} />
        </TouchableOpacity>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {totalCards}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentIndex + 1) / totalCards) * 100}%` }]} />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.ttsToggle, !autoTtsEnabled && styles.ttsToggleOff]}
          onPress={() => setAutoTtsEnabled(prev => !prev)}
        >
          <Icon name={autoTtsEnabled ? 'volume-high' : 'volume-mute'} size={18} color={autoTtsEnabled ? colors.retroCyan : colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.queueInfo}>
          <Text style={styles.queueText}>
            🆕{studyQueue?.counts.new} 📖{studyQueue?.counts.learning} 🔄{studyQueue?.counts.review}
          </Text>
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <TouchableOpacity activeOpacity={0.9} onPress={flipCard} style={styles.cardTouchable}>
          {/* Front */}
          <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
            <View style={styles.cardTopBar} />
            <View style={styles.cardContent}>
              <Text style={styles.cardWord}>{currentCard?.word}</Text>
              <Text style={styles.cardHint}>{t('vocabulary.tapToFlip')}</Text>
            </View>
            <View style={styles.cardStateTag}>
              <Text style={styles.cardStateText}>
                {currentCard?.state === CardState.NEW ? `🆕 ${t('vocabulary.filterNew')}` :
                  currentCard?.state === CardState.LEARNING ? `📖 ${t('vocabulary.filterLearning')}` :
                    currentCard?.state === CardState.REVIEW ? `🔄 ${t('vocabulary.filterMastered')}` : `📝 ${t('vocabulary.filterLearning')}`}
              </Text>
            </View>
          </Animated.View>

          {/* Back */}
          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
            <View style={[styles.cardTopBar, { backgroundColor: colors.retroCyan }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardBackHeader}>
                <Text style={styles.cardWord}>{currentCard?.word}</Text>
                <TouchableOpacity style={styles.speakButton} onPress={() => currentCard && handleSpeak(currentCard.word)}>
                  <Icon name="volume-high" size={20} color={colors.retroCyan} />
                </TouchableOpacity>
              </View>
              {currentCard?.IPA && (
                <Text style={styles.cardIPA}>[{currentCard.IPA}]</Text>
              )}
              {currentCard?.partOfSpeech && (
                <View style={styles.posBadgeBack}>
                  <Text style={styles.posBadgeBackText}>{currentCard.partOfSpeech}</Text>
                  {currentCard.baseForm && currentCard.baseForm !== currentCard.word && (
                    <Text style={styles.baseFormText}> → {currentCard.baseForm}</Text>
                  )}
                </View>
              )}
              <View style={styles.divider} />
              <Text style={styles.cardTranslation}>{currentCard?.translation}</Text>
              {currentCard?.example && (
                <TouchableOpacity style={styles.exampleRow} onPress={() => currentCard.example && handleSpeak(currentCard.example)}>
                  <Icon name="chatbubble-ellipses-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.cardExample}>{currentCard.example}</Text>
                </TouchableOpacity>
              )}
              {currentCard?.grammar && (
                <View style={styles.grammarRow}>
                  <Icon name="book-outline" size={14} color={colors.retroPurple} />
                  <Text style={styles.cardGrammar}>{currentCard.grammar}</Text>
                </View>
              )}
              {currentCard?.context && (
                <Text style={styles.cardContext}>"{currentCard.context}"</Text>
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Rating Buttons - Only show when flipped */}
      {isFlipped && reviewTexts && (
        <View style={styles.ratingContainer}>
          <TouchableOpacity
            style={[styles.ratingButton, styles.ratingAgain]}
            onPress={() => handleRating(Rating.AGAIN)}
          >
            <Text style={styles.ratingTime}>{reviewTexts.again}</Text>
            <Text style={styles.ratingLabel}>{t('vocabulary.forgot')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ratingButton, styles.ratingHard]}
            onPress={() => handleRating(Rating.HARD)}
          >
            <Text style={styles.ratingTime}>{reviewTexts.hard}</Text>
            <Text style={styles.ratingLabel}>{t('vocabulary.hard')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ratingButton, styles.ratingGood]}
            onPress={() => handleRating(Rating.GOOD)}
          >
            <Text style={styles.ratingTime}>{reviewTexts.good}</Text>
            <Text style={styles.ratingLabel}>{t('vocabulary.good')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ratingButton, styles.ratingEasy]}
            onPress={() => handleRating(Rating.EASY)}
          >
            <Text style={styles.ratingTime}>{reviewTexts.easy}</Text>
            <Text style={styles.ratingLabel}>{t('vocabulary.easy')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tap hint when not flipped */}
      {!isFlipped && (
        <View style={styles.tapHintContainer}>
          <Text style={styles.tapHint}>👆 {t('vocabulary.tapToFlip')}</Text>
        </View>
      )}

      {/* Undo button */}
      {showUndo && lastRatedRef.current && (
        <TouchableOpacity style={styles.undoBtn} onPress={undoLastRating}>
          <Icon name="arrow-undo" size={16} color="#fff" />
          <Text style={styles.undoBtnText}>Undo</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.retroCream,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  ttsToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  ttsToggleOff: {
    backgroundColor: '#f0f0f0',
  },
  progressInfo: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.retroCyan,
    borderRadius: 3,
  },
  queueInfo: {
    backgroundColor: colors.retroYellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  queueText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.retroDark,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardTouchable: {
    width: SCREEN_WIDTH - 48,
    height: 340,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 5,
    overflow: 'hidden',
  },
  cardFront: {},
  cardBack: {},
  cardTopBar: {
    height: 6,
    backgroundColor: colors.retroPurple,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  cardWord: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.retroDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 16,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: colors.retroCyan,
    borderRadius: 2,
    marginVertical: 16,
  },
  cardTranslation: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.retroCyan,
    textAlign: 'center',
  },
  cardContext: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  cardBackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  speakButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIPA: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  posBadgeBack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  posBadgeBackText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.retroPurple,
  },
  baseFormText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  cardExample: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  grammarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  cardGrammar: {
    fontSize: 12,
    color: colors.retroPurple,
    flex: 1,
  },
  cardStateTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.retroCream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  cardStateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.retroDark,
  },
  ratingContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  ratingAgain: {
    backgroundColor: '#ffcdd2',
  },
  ratingHard: {
    backgroundColor: '#ffe0b2',
  },
  ratingGood: {
    backgroundColor: '#c8e6c9',
  },
  ratingEasy: {
    backgroundColor: '#bbdefb',
  },
  ratingTime: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.retroDark,
    marginBottom: 2,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.retroDark,
  },
  tapHintContainer: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 14,
    color: colors.textMuted,
  },
  // Complete screen
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  completeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 5,
    width: '100%',
  },
  completeEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.retroDark,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statBox: {
    flex: 1,
    minWidth: '40%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.retroDark,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: colors.retroPurple,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  undoBtn: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#555',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  undoBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default FlashcardMode;
