import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { colors, spacing } from '../../styles/theme';
import {
  VocabularyItem,
  vocabularyService,
  CheckResult,
  SentenceExercise,
} from '../../services/vocabulary.service';
import {
  evaluateResults,
  getWordsForReview,
  WordResult,
  EvaluationResult,
} from '../../utils/vocabExerciseEngine';
import {
  SRSCard,
  CardState,
  Rating,
  SRS_CONFIG,
  calculateNextReview,
} from '../../utils/srs';

interface LearnModeProps {
  visible: boolean;
  vocabulary: VocabularyItem[];
  onClose: () => void;
  onUpdateVocabulary: (updated: VocabularyItem) => void;
  onSessionComplete?: (wordsReviewed: number, wordsCorrect: number) => void;
  skipQuickReview?: boolean;
}

const LearnMode: React.FC<LearnModeProps> = ({
  visible,
  vocabulary,
  onClose,
  onUpdateVocabulary,
  onSessionComplete,
  skipQuickReview = false,
}) => {
  // Steps: 0=Quick Review (meanings), 1=Active Recall (type word), 2=Production (write sentence), 3=Production (translate)
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [wordResults, setWordResults] = useState<Record<string, WordResult>>({});
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});

  // Vocab set for this session
  const [vocabSet, setVocabSet] = useState<VocabularyItem[]>([]);

  // Step 0: Meaning review
  const [meaningIdx, setMeaningIdx] = useState(0);

  // Step 1: Type German word
  const [typeWords, setTypeWords] = useState<VocabularyItem[]>([]);
  const [typeIdx, setTypeIdx] = useState(0);
  const [typeInput, setTypeInput] = useState('');
  const [typeResult, setTypeResult] = useState<{ correct: boolean; answer: string; explanation?: string } | null>(null);
  const [typeChecking, setTypeChecking] = useState(false);

  // Step 2: Write sentence
  const [transWords, setTransWords] = useState<VocabularyItem[]>([]);
  const [transIdx, setTransIdx] = useState(0);
  const [transInput, setTransInput] = useState('');
  const [transResult, setTransResult] = useState<CheckResult | null>(null);
  const [transChecking, setTransChecking] = useState(false);

  // Step 3: Translate Vietnamese → German
  const [sentences, setSentences] = useState<SentenceExercise[]>([]);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [sentenceInput, setSentenceInput] = useState('');
  const [sentenceResult, setSentenceResult] = useState<CheckResult | null>(null);
  const [sentenceChecking, setSentenceChecking] = useState(false);
  const [sentenceLoading, setSentenceLoading] = useState(false);

  // Pending review words
  const pendingReview = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return vocabulary.filter(v => {
      if (v.status === 'mastered') return false;
      const created = new Date(v.createdAt);
      const isToday = created >= todayStart;
      const isDue = !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date();
      return isToday || isDue;
    });
  }, [vocabulary]);

  // Initialize learning session
  const startLearn = useCallback(() => {
    if (vocabulary.length < 2) return;
    const wordsForReview = getWordsForReview(vocabulary);
    const pool = pendingReview.length >= 2
      ? pendingReview.slice(0, 30)
      : wordsForReview.length >= 2
        ? wordsForReview.slice(0, 30)
        : vocabulary.slice(0, 30);

    // Sort by SRS priority: overdue-mastered > learning > new > non-overdue mastered
    const now = new Date();
    const sorted = [...pool].sort((a, b) => {
      const getUrgency = (v: VocabularyItem): number => {
        const isDue = !v.nextReviewAt || new Date(v.nextReviewAt) <= now;
        if (v.status === 'mastered' && isDue) return 0;  // overdue mastered — highest priority
        if (v.status === 'learning') return 1;
        if (v.status === 'new') return 2;
        return 3; // non-overdue mastered
      };
      const diff = getUrgency(a) - getUrgency(b);
      if (diff !== 0) return diff;
      const da = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
      const db = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
      return da - db;
    });

    const transPool = sorted.filter(v => v.word && v.translation).slice(0, 3);
    // Full pool for typing — shuffle for random order
    const typePool = [...sorted.filter(v => v.word && v.translation)];
    for (let i = typePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [typePool[i], typePool[j]] = [typePool[j], typePool[i]];
    }

    setVocabSet(sorted);
    setTransWords(transPool);
    setTransIdx(0);
    setTransInput('');
    setTransResult(null);
    setTypeWords(typePool);
    setTypeIdx(0);
    setTypeInput('');
    setTypeResult(null);
    setSentences([]);
    setSentenceIdx(0);
    setSentenceInput('');
    setSentenceResult(null);
    setMeaningIdx(0);
    setStep(skipQuickReview ? 1 : 0);
    setFinished(false);
    setWordResults({});
    setEvaluation(null);
    setRetryCount({});
  }, [vocabulary, pendingReview]);

  // Start when modal opens
  React.useEffect(() => {
    if (visible) startLearn();
  }, [visible, startLearn]);

  const trackWordResult = (word: string, correct: boolean) => {
    setWordResults(prev => {
      const existing = prev[word] || { correct: 0, wrong: 0 };
      return {
        ...prev,
        [word]: {
          correct: existing.correct + (correct ? 1 : 0),
          wrong: existing.wrong + (correct ? 0 : 1),
        },
      };
    });
  };

  const handleSpeak = (text: string) => {
    try {
      const clean = text.replace(/[.,!?;:"""''„-]/g, '').trim();
      if (!clean) return;
      Tts.stop().catch(() => {});
      Tts.setDefaultLanguage('de-DE').then(() => Tts.speak(clean));
    } catch {}
  };

  // Step 1: Check typed word
  const checkTypedWord = async () => {
    const word = typeWords[typeIdx];
    if (!typeInput.trim() || !word) return;
    setTypeChecking(true);

    const normalize = (s: string) =>
      s.toLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').trim();

    // Local check: accept exact match, baseForm, or stem/conjugation match
    const isLocalMatch = (input: string, expected: string, baseForm?: string | null): boolean => {
      const ni = normalize(input);
      const ne = normalize(expected);
      // Exact match
      if (ni === ne) return true;
      // BaseForm match (e.g. "belasten" for "belastende")
      if (baseForm && normalize(baseForm) === ni) return true;
      // Input is the base/stem of expected (e.g. "belasten" → "belastende")
      if (ne.startsWith(ni) && ni.length >= 3 && (ne.length - ni.length) <= 4) return true;
      // Expected is the base/stem of input
      if (ni.startsWith(ne) && ne.length >= 3 && (ni.length - ne.length) <= 4) return true;
      return false;
    };

    try {
      const data = await vocabularyService.checkTypedWord(
        typeInput,
        word.word,
        word.translation,
        word.partOfSpeech,
        word.baseForm,
      );
      // Override AI if local stem match but AI says wrong
      const localMatch = isLocalMatch(typeInput, word.word, word.baseForm);
      const isCorrect = data.isCorrect || localMatch;
      setTypeResult({ correct: isCorrect, answer: word.word, explanation: data.explanation });
      trackWordResult(word.word, isCorrect);
    } catch {
      const correct = isLocalMatch(typeInput, word.word, word.baseForm);
      setTypeResult({ correct, answer: word.word });
      trackWordResult(word.word, correct);
    } finally {
      setTypeChecking(false);
    }
  };

  // Skip word — user doesn't know it
  const skipTypeWord = () => {
    const word = typeWords[typeIdx];
    if (!word) return;
    // Mark as wrong + show correct answer
    setTypeResult({ correct: false, answer: word.word, explanation: 'Bạn đã bỏ qua từ này. Từ sẽ được lặp lại sau.' });
    trackWordResult(word.word, false);
  };

  const nextTypeWord = () => {
    // Retry: if wrong, interleave retry 3-5 positions ahead (not at end)
    if (typeResult && !typeResult.correct) {
      const word = typeWords[typeIdx];
      const currentRetries = retryCount[word.word] || 0;
      if (currentRetries < 3) {
        setRetryCount(prev => ({ ...prev, [word.word]: currentRetries + 1 }));
        // Insert 3-5 positions ahead for spacing effect, not at end
        const insertPos = Math.min(typeIdx + 3 + Math.floor(Math.random() * 3), typeWords.length);
        setTypeWords(prev => {
          const next = [...prev];
          next.splice(insertPos, 0, word);
          return next;
        });
      }
    }

    if (typeIdx + 1 >= typeWords.length) {
      if (transWords.length > 0) {
        setStep(2);
        setTransIdx(0);
        setTransInput('');
        setTransResult(null);
      } else {
        setStep(3);
        generateSentenceExercises();
      }
    } else {
      setTypeIdx(prev => prev + 1);
      setTypeInput('');
      setTypeResult(null);
    }
  };

  // Step 2: Check sentence
  const checkTranslation = async () => {
    const word = transWords[transIdx];
    if (!transInput.trim() || !word) return;
    setTransChecking(true);
    try {
      const data = await vocabularyService.checkSentence(transInput, word.word);
      const isGood = data.isCorrect || (data.grammarScore && data.grammarScore >= 7);
      setTransResult(data);
      trackWordResult(word.word, !!isGood);
    } catch (error) {
      console.error('Check sentence failed:', error);
    } finally {
      setTransChecking(false);
    }
  };

  const nextTranslation = () => {
    if (transIdx + 1 >= transWords.length) {
      setStep(3);
      generateSentenceExercises();
    } else {
      setTransIdx(prev => prev + 1);
      setTransInput('');
      setTransResult(null);
    }
  };

  // Step 3: Generate exercises
  const generateSentenceExercises = async () => {
    setSentenceLoading(true);
    try {
      const words = (transWords.length > 0 ? transWords : typeWords)
        .slice(0, 5)
        .map(v => ({ word: v.word, translation: v.translation }));

      if (words.length === 0) {
        setSentenceLoading(false);
        finishLearn();
        return;
      }

      const exercises = await vocabularyService.generateSentenceExercises(words);
      setSentences(exercises);
    } catch {
      // Failed to generate, finish
    } finally {
      setSentenceLoading(false);
    }
  };

  const checkSentenceTranslation = async () => {
    const exercise = sentences[sentenceIdx];
    if (!sentenceInput.trim() || !exercise) return;
    setSentenceChecking(true);
    try {
      const data = await vocabularyService.checkSentenceTranslation(
        exercise.vietnameseSentence,
        sentenceInput,
        exercise.expectedGerman,
        exercise.word,
      );
      const isGood = data.grammarScore && data.grammarScore >= 7;
      setSentenceResult(data);
      trackWordResult(exercise.word, !!isGood);
    } catch {
      // ignore
    } finally {
      setSentenceChecking(false);
    }
  };

  const nextSentenceExercise = () => {
    if (sentenceIdx + 1 >= sentences.length) {
      finishLearn();
    } else {
      setSentenceIdx(prev => prev + 1);
      setSentenceInput('');
      setSentenceResult(null);
    }
  };

  // Finish and evaluate
  const finishLearn = async () => {
    setFinished(true);
    const eval_ = evaluateResults(wordResults, vocabSet);
    setEvaluation(eval_);

    // Update SRS (unified SM-2) for each word
    for (const vocab of vocabSet) {
      const r = wordResults[vocab.word];
      if (!r || (r.correct === 0 && r.wrong === 0)) continue;
      const total = r.correct + r.wrong;
      const ratio = r.correct / total;

      // Build SRS card from vocab state
      const card: SRSCard = {
        id: vocab.id,
        word: vocab.word,
        translation: vocab.translation,
        state: (vocab.srsState as CardState) || CardState.NEW,
        ease: vocab.srsEase ?? SRS_CONFIG.STARTING_EASE,
        interval: vocab.srsInterval ?? 0,
        stepIndex: vocab.srsStepIndex ?? 0,
        due: vocab.srsDue ? new Date(vocab.srsDue) : new Date(),
        reviews: vocab.srsReviews ?? 0,
        lapses: vocab.srsLapses ?? 0,
        lastReview: vocab.srsLastReview ? new Date(vocab.srsLastReview) : null,
      };

      // Map score to SRS rating
      const rating = ratio >= 0.85 ? Rating.EASY
        : ratio >= 0.7 ? Rating.GOOD
        : ratio >= 0.4 ? Rating.HARD
        : Rating.AGAIN;

      const updated = calculateNextReview(card, rating);

      // Derive status from SRS state
      let newStatus = vocab.status;
      if (updated.state === CardState.REVIEW && updated.interval >= SRS_CONFIG.MASTERY_THRESHOLD) newStatus = 'mastered';
      else if (updated.state === CardState.NEW && total > 0) newStatus = 'learning';
      else if (updated.state === CardState.LEARNING || updated.state === CardState.RELEARNING) newStatus = 'learning';

      try {
        await vocabularyService.updateVocabulary({
          id: vocab.id,
          status: newStatus,
          reviewCount: (vocab.reviewCount || 0) + 1,
          srsState: updated.state,
          srsEase: updated.ease,
          srsInterval: updated.interval,
          srsStepIndex: updated.stepIndex,
          srsDue: updated.due.toISOString(),
          srsReviews: updated.reviews,
          srsLapses: updated.lapses,
          srsLastReview: updated.lastReview?.toISOString() ?? null,
          nextReviewAt: updated.due.toISOString(),
        });
        onUpdateVocabulary({
          ...vocab,
          status: newStatus,
          reviewCount: (vocab.reviewCount || 0) + 1,
          srsState: updated.state,
          srsEase: updated.ease,
          srsInterval: updated.interval,
          srsStepIndex: updated.stepIndex,
          srsDue: updated.due.toISOString(),
          srsReviews: updated.reviews,
          srsLapses: updated.lapses,
          srsLastReview: updated.lastReview?.toISOString() ?? null,
          nextReviewAt: updated.due.toISOString(),
        });
      } catch {}
    }

    // Report session completion to parent
    const totalWords = Object.keys(wordResults).length;
    const correctWords = Object.values(wordResults).filter(r => r.correct > r.wrong).length;
    onSessionComplete?.(totalWords, correctWords);
  };

  const resetLearn = () => {
    setStep(0);
    setFinished(false);
    setWordResults({});
    setEvaluation(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header — 3 Phases */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={resetLearn}>
            <Icon name="close" size={22} color={colors.retroDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🎯 Smart Study</Text>
          <View style={styles.phaseRow}>
            {[
              { label: '📖 Quick Review', active: step >= 0 },
              { label: '✍️ Active Recall', active: step >= 1 },
              { label: '💬 Production', active: step >= 2 },
            ].map((phase, i) => (
              <React.Fragment key={i}>
                <View style={[styles.phaseChip, phase.active && styles.phaseChipActive]}>
                  <Text style={[styles.phaseChipText, phase.active && styles.phaseChipTextActive]}>
                    {phase.label}
                  </Text>
                </View>
                {i < 2 && <View style={[styles.stepLine, step > i && styles.stepLineActive]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {!finished ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Step 0: Quick Review */}
              {step === 0 && vocabSet.length > 0 && (
                <>
                  <Text style={styles.stepLabel}>📖 Quick Review — Ôn nghĩa từ</Text>
                  <Text style={styles.progressText}>{meaningIdx + 1} / {vocabSet.length}</Text>

                  <View style={styles.meaningCard}>
                    <TouchableOpacity
                      style={styles.meaningWordRow}
                      onPress={() => handleSpeak(vocabSet[meaningIdx].word)}
                    >
                      <Icon name="volume-high" size={20} color={colors.retroCyan} />
                      <Text style={styles.meaningWord}>{vocabSet[meaningIdx].word}</Text>
                    </TouchableOpacity>
                    <Text style={styles.meaningTranslation}>{vocabSet[meaningIdx].translation}</Text>

                    {vocabSet[meaningIdx].notes && (
                      <Text style={styles.meaningTip}>💡 {vocabSet[meaningIdx].notes}</Text>
                    )}
                    {vocabSet[meaningIdx].example && (
                      <TouchableOpacity onPress={() => handleSpeak(vocabSet[meaningIdx].example!)}>
                        <Text style={styles.meaningExample}>🔊 {vocabSet[meaningIdx].example}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.navRow}>
                    <TouchableOpacity
                      style={[styles.navBtn, meaningIdx === 0 && styles.btnDisabled]}
                      onPress={() => setMeaningIdx(p => p - 1)}
                      disabled={meaningIdx === 0}
                    >
                      <Text style={styles.navBtnText}>← Trước</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.skipBtn}
                      onPress={() => setStep(1)}
                    >
                      <Text style={styles.skipBtnText}>Luyện tập ngay ⚡</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.navBtnPrimary}
                      onPress={() => {
                        if (meaningIdx + 1 < vocabSet.length) {
                          setMeaningIdx(p => p + 1);
                        } else {
                          setStep(1);
                        }
                      }}
                    >
                      <Text style={styles.navBtnPrimaryText}>
                        {meaningIdx + 1 < vocabSet.length ? 'Tiếp →' : 'Bắt đầu →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 1: Active Recall — Type German word */}
              {step === 1 && typeWords.length > 0 && (
                <>
                  <Text style={styles.stepLabel}>✍️ Active Recall — Gõ từ tiếng Đức</Text>
                  <Text style={styles.progressText}>
                    {typeIdx + 1} / {typeWords.length}
                    {(retryCount[typeWords[typeIdx]?.word] || 0) > 0 ? ' 🔄 Ôn lại' : ''}
                  </Text>

                  <View style={styles.exerciseCard}>
                    <Text style={styles.exercisePrompt}>{typeWords[typeIdx].translation}</Text>
                    {typeWords[typeIdx].partOfSpeech && (
                      <Text style={styles.exerciseHint}>
                        Loại từ: {typeWords[typeIdx].partOfSpeech}
                        {typeWords[typeIdx].gender ? ` | Giống: ${typeWords[typeIdx].gender}` : ''}
                      </Text>
                    )}

                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.exerciseInput, styles.inputFlex]}
                        placeholder="Gõ từ tiếng Đức..."
                        placeholderTextColor={colors.textMuted}
                        value={typeInput}
                        onChangeText={setTypeInput}
                        editable={!typeResult && !typeChecking}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          if (!typeResult && !typeChecking) checkTypedWord();
                        }}
                        autoFocus
                      />
                      {!typeResult && (
                        <TouchableOpacity
                          style={[styles.checkBtn, (!typeInput.trim() || typeChecking) && styles.btnDisabled]}
                          onPress={checkTypedWord}
                          disabled={!typeInput.trim() || typeChecking}
                        >
                          {typeChecking ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.checkBtnText}>Kiểm tra</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Skip buttons — visible when no result yet */}
                    {!typeResult && !typeChecking && (
                      <View style={styles.skipRow}>
                        <TouchableOpacity style={styles.skipBtnForgot} onPress={skipTypeWord}>
                          <Text style={styles.skipBtnText}>😵 Đã quên</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.skipBtnWeak} onPress={skipTypeWord}>
                          <Text style={styles.skipBtnText}>🤔 Chưa thuộc</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {typeResult && (
                      <View style={styles.resultBox}>
                        <View style={[styles.resultBadge, typeResult.correct ? styles.resultGood : styles.resultBad]}>
                          <Text style={styles.resultBadgeText}>
                            {typeResult.correct
                              ? '✅ Chính xác!'
                              : `❌ Sai. Đáp án: ${typeResult.answer}`}
                          </Text>
                        </View>
                        {typeResult.explanation && (
                          <Text style={styles.resultExplanation}>{typeResult.explanation}</Text>
                        )}
                        {!typeResult.correct && (
                          <TouchableOpacity
                            style={styles.speakResultBtn}
                            onPress={() => handleSpeak(typeResult.answer)}
                          >
                            <Icon name="volume-high" size={16} color={colors.retroCyan} />
                            <Text style={styles.speakResultText}>Nghe phát âm</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.nextBtn} onPress={nextTypeWord}>
                          <Text style={styles.nextBtnText}>
                            {typeIdx + 1 < typeWords.length
                              ? 'Từ tiếp →'
                              : transWords.length > 0
                                ? 'Đặt câu (AI) →'
                                : 'Dịch câu Việt-Đức →'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* Step 2: Production — Write German sentence */}
              {step === 2 && transWords.length > 0 && (
                <>
                  <Text style={styles.stepLabel}>💬 Production — Viết câu tiếng Đức</Text>
                  <TouchableOpacity style={styles.skipBtn} onPress={() => finishLearn()}>
                    <Text style={styles.skipBtnText}>Bỏ qua → Kết quả</Text>
                  </TouchableOpacity>
                  <Text style={styles.progressText}>{transIdx + 1} / {transWords.length}</Text>

                  <View style={styles.exerciseCard}>
                    <Text style={styles.exercisePrompt}>
                      Viết câu tiếng Đức dùng từ: <Text style={styles.exerciseBold}>{transWords[transIdx].word}</Text>
                    </Text>
                    <Text style={styles.exerciseHint}>Nghĩa: {transWords[transIdx].translation}</Text>

                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.exerciseInput, styles.inputFlex]}
                        placeholder="Gõ câu tiếng Đức..."
                        placeholderTextColor={colors.textMuted}
                        value={transInput}
                        onChangeText={setTransInput}
                        editable={!transResult}
                        autoCapitalize="none"
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          if (!transResult) checkTranslation();
                        }}
                      />
                      {!transResult && (
                        <TouchableOpacity
                          style={[styles.checkBtn, (!transInput.trim() || transChecking) && styles.btnDisabled]}
                          onPress={checkTranslation}
                          disabled={!transInput.trim() || transChecking}
                        >
                          {transChecking ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.checkBtnText}>Kiểm tra</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {transResult && (
                      <View style={styles.resultBox}>
                        <View style={[styles.resultBadge, (transResult.grammarScore ?? 0) >= 7 ? styles.resultGood : styles.resultBad]}>
                          <Text style={styles.resultBadgeText}>
                            {(transResult.grammarScore ?? 0) >= 7 ? '✅' : '❌'} Điểm: {transResult.grammarScore}/10
                          </Text>
                        </View>
                        {transResult.corrections && (
                          <Text style={styles.resultCorrection}>
                            <Text style={styles.resultCorrectionLabel}>Sửa lại: </Text>
                            {transResult.corrections}
                          </Text>
                        )}
                        {transResult.explanation && (
                          <Text style={styles.resultExplanation}>{transResult.explanation}</Text>
                        )}
                        {transResult.suggestion && (
                          <TouchableOpacity onPress={() => handleSpeak(transResult.suggestion!)}>
                            <Text style={styles.resultSuggestion}>
                              <Text style={styles.resultCorrectionLabel}>Gợi ý: </Text>
                              🔊 {transResult.suggestion}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.nextBtn} onPress={nextTranslation}>
                          <Text style={styles.nextBtnText}>
                            {transIdx + 1 < transWords.length ? 'Câu tiếp →' : 'Dịch câu Việt-Đức →'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* Step 3: Production — Translate Vietnamese → German */}
              {step === 3 && (
                <>
                  <Text style={styles.stepLabel}>🌐 Production — Dịch câu sang tiếng Đức</Text>
                  <TouchableOpacity style={styles.skipBtn} onPress={() => finishLearn()}>
                    <Text style={styles.skipBtnText}>Bỏ qua → Kết quả</Text>
                  </TouchableOpacity>

                  {sentenceLoading ? (
                    <View style={styles.loadingBox}>
                      <ActivityIndicator size="large" color={colors.retroCyan} />
                      <Text style={styles.loadingText}>Đang tạo bài tập dịch...</Text>
                    </View>
                  ) : sentences.length > 0 ? (
                    <>
                      <Text style={styles.progressText}>{sentenceIdx + 1} / {sentences.length}</Text>
                      <View style={styles.exerciseCard}>
                        <Text style={styles.exercisePrompt}>{sentences[sentenceIdx].vietnameseSentence}</Text>
                        <Text style={styles.exerciseHint}>
                          Từ vựng liên quan: {sentences[sentenceIdx].word}
                        </Text>

                        <View style={styles.inputRow}>
                          <TextInput
                            style={[styles.exerciseInput, styles.inputFlex]}
                            placeholder="Gõ bản dịch tiếng Đức..."
                            placeholderTextColor={colors.textMuted}
                            value={sentenceInput}
                            onChangeText={setSentenceInput}
                            editable={!sentenceResult}
                            autoCapitalize="none"
                            returnKeyType="done"
                            onSubmitEditing={() => {
                              if (!sentenceResult) checkSentenceTranslation();
                            }}
                            autoFocus
                          />
                          {!sentenceResult && (
                            <TouchableOpacity
                              style={[styles.checkBtn, (!sentenceInput.trim() || sentenceChecking) && styles.btnDisabled]}
                              onPress={checkSentenceTranslation}
                              disabled={!sentenceInput.trim() || sentenceChecking}
                            >
                              {sentenceChecking ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={styles.checkBtnText}>Kiểm tra</Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>

                        {sentenceResult && (
                          <View style={styles.resultBox}>
                            <View style={[styles.resultBadge, (sentenceResult.grammarScore ?? 0) >= 7 ? styles.resultGood : styles.resultBad]}>
                              <Text style={styles.resultBadgeText}>
                                {(sentenceResult.grammarScore ?? 0) >= 7 ? '✅' : '❌'} Điểm: {sentenceResult.grammarScore}/10
                              </Text>
                            </View>
                            {sentenceResult.corrections && (
                              <Text style={styles.resultCorrection}>
                                <Text style={styles.resultCorrectionLabel}>Sửa lại: </Text>
                                {sentenceResult.corrections}
                              </Text>
                            )}
                            {sentenceResult.explanation && (
                              <Text style={styles.resultExplanation}>{sentenceResult.explanation}</Text>
                            )}
                            {sentenceResult.suggestion && (
                              <TouchableOpacity onPress={() => handleSpeak(sentenceResult.suggestion!)}>
                                <Text style={styles.resultSuggestion}>
                                  <Text style={styles.resultCorrectionLabel}>Gợi ý: </Text>
                                  🔊 {sentenceResult.suggestion}
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.nextBtn} onPress={nextSentenceExercise}>
                              <Text style={styles.nextBtnText}>
                                {sentenceIdx + 1 < sentences.length ? 'Câu tiếp →' : 'Xem kết quả →'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </>
                  ) : (
                    <View style={styles.loadingBox}>
                      <Text style={styles.loadingText}>Không thể tạo bài tập dịch.</Text>
                      <TouchableOpacity style={styles.nextBtn} onPress={() => finishLearn()}>
                        <Text style={styles.nextBtnText}>Xem kết quả →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          ) : (
            /* Evaluation Screen */
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.evalCard}>
                <View style={styles.evalHeader}>
                  <View style={styles.evalGradeBadge}>
                    <Text style={styles.evalGrade}>{evaluation?.overallScore || '-'}</Text>
                  </View>
                  <View style={styles.evalScoreSummary}>
                    <Text style={styles.evalScoreText}>
                      Đúng: <Text style={styles.evalScoreBold}>{evaluation?.totalCorrect || 0}</Text>/{evaluation?.totalAll || 0}
                    </Text>
                  </View>
                </View>

                {/* Strong words */}
                {evaluation && evaluation.strong.length > 0 && (
                  <View style={styles.evalSection}>
                    <Text style={styles.evalSectionTitle}>✅ Đã nắm vững</Text>
                    {evaluation.strong.map((w, i) => (
                      <TouchableOpacity key={i} style={[styles.evalWordRow, styles.evalStrong]} onPress={() => handleSpeak(w.word)}>
                        <Text style={styles.evalWord}>🔊 {w.word}</Text>
                        <Text style={styles.evalWordMeta}>{w.translation} — {w.correct}/{w.total} đúng</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Weak words */}
                {evaluation && evaluation.weak.length > 0 && (
                  <View style={styles.evalSection}>
                    <Text style={styles.evalSectionTitle}>⚠️ Cần ôn thêm</Text>
                    {evaluation.weak.map((w, i) => (
                      <TouchableOpacity key={i} style={[styles.evalWordRow, styles.evalWeak]} onPress={() => handleSpeak(w.word)}>
                        <Text style={styles.evalWord}>🔊 {w.word}</Text>
                        <Text style={styles.evalWordMeta}>{w.translation} — {w.correct}/{w.total} đúng</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Not tested */}
                {evaluation && evaluation.notTested.length > 0 && (
                  <View style={styles.evalSection}>
                    <Text style={styles.evalSectionTitle}>📝 Chưa kiểm tra</Text>
                    {evaluation.notTested.map((w, i) => (
                      <TouchableOpacity key={i} style={styles.evalWordRow} onPress={() => handleSpeak(w.word)}>
                        <Text style={styles.evalWord}>🔊 {w.word}</Text>
                        <Text style={styles.evalWordMeta}>{w.translation}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.evalLeitnerNote}>
                  <Text style={styles.evalLeitnerText}>
                    📊 <Text style={{ fontWeight: '700' }}>Đã kiểm tra:</Text>{' '}
                    {evaluation ? (evaluation.strong.length + evaluation.weak.length) : 0}/{vocabSet.length} từ
                  </Text>
                  <Text style={[styles.evalLeitnerText, { marginTop: 4 }]}>
                    📌 <Text style={{ fontWeight: '700' }}>SRS:</Text> Từ đúng sẽ được ôn ít hơn. Từ sai sẽ quay lại ôn sớm hơn.
                    {evaluation && evaluation.weak.length > 0 ? ` Hãy ôn lại ${evaluation.weak.length} từ yếu sớm nhé!` : ''}
                  </Text>
                </View>

                <View style={styles.evalActions}>
                  <TouchableOpacity style={styles.retryBtn} onPress={() => { resetLearn(); setTimeout(() => onClose(), 50); setTimeout(() => startLearn(), 100); }}>
                    <Text style={styles.retryBtnText}>🔄 Học lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeBtnFinal} onPress={resetLearn}>
                    <Text style={styles.closeBtnFinalText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.retroCream,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.retroDark,
    flex: 1,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 2,
  },
  phaseChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
  phaseChipActive: {
    backgroundColor: colors.retroCyan,
  },
  phaseChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  phaseChipTextActive: {
    color: '#fff',
  },
  stepsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  stepDotActive: {
    backgroundColor: colors.retroCyan,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepDotTextActive: {
    color: '#fff',
  },
  stepLine: {
    width: 16,
    height: 3,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 2,
  },
  stepLineActive: {
    backgroundColor: colors.retroCyan,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.retroDark,
    marginBottom: 8,
    backgroundColor: colors.retroCream,
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  // Meaning card
  meaningCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    marginBottom: 16,
  },
  meaningWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  meaningWord: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.retroDark,
  },
  meaningTranslation: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.retroCyan,
    marginBottom: 10,
  },
  meaningTip: {
    fontSize: 13,
    color: colors.textSecondary,
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  meaningExample: {
    fontSize: 14,
    color: colors.retroDark,
    fontStyle: 'italic',
    padding: 8,
    backgroundColor: colors.retroCream,
    borderRadius: 8,
  },
  // Navigation
  navRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  navBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.retroDark,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.retroYellow,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.retroDark,
  },
  navBtnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.retroCyan,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  navBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // Exercise card
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    marginBottom: 24,
  },
  exercisePrompt: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 6,
  },
  exerciseBold: {
    color: colors.retroCyan,
    fontWeight: '800',
  },
  exerciseHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  exerciseInput: {
    backgroundColor: colors.retroCream,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.retroDark,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  checkBtn: {
    backgroundColor: colors.retroPurple,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
  },
  checkBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  // Result
  resultBox: {
    marginTop: 14,
  },
  resultBadge: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultGood: {
    backgroundColor: '#E8F5E9',
  },
  resultBad: {
    backgroundColor: '#FFEBEE',
  },
  resultBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.retroDark,
  },
  resultExplanation: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  resultCorrection: {
    fontSize: 13,
    color: colors.retroDark,
    marginBottom: 6,
  },
  resultCorrectionLabel: {
    fontWeight: '700',
  },
  resultSuggestion: {
    fontSize: 13,
    color: colors.retroCyan,
    marginBottom: 10,
    fontWeight: '500',
  },
  speakResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  speakResultText: {
    fontSize: 13,
    color: colors.retroCyan,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: colors.retroCyan,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // Loading
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  // Evaluation
  evalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    marginBottom: 24,
  },
  evalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  evalGradeBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.retroCyan,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  evalGrade: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  evalScoreSummary: {
    flex: 1,
  },
  evalScoreText: {
    fontSize: 16,
    color: colors.retroDark,
  },
  evalScoreBold: {
    fontWeight: '800',
    fontSize: 20,
  },
  evalSection: {
    marginBottom: 16,
  },
  evalSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 8,
  },
  evalWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: colors.retroCream,
  },
  evalStrong: {
    backgroundColor: '#E8F5E9',
  },
  evalWeak: {
    backgroundColor: '#FFF3E0',
  },
  evalWord: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
  },
  evalWordMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  evalLeitnerNote: {
    backgroundColor: colors.retroCream,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  evalLeitnerText: {
    fontSize: 13,
    color: colors.retroDark,
    lineHeight: 18,
  },
  evalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.retroYellow,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.retroDark,
  },
  closeBtnFinal: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    alignItems: 'center',
  },
  closeBtnFinalText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.retroDark,
  },
  skipRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  skipBtnForgot: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
    borderWidth: 1.5,
    borderColor: '#EF9A9A',
    alignItems: 'center',
  },
  skipBtnWeak: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    borderWidth: 1.5,
    borderColor: '#FFB74D',
    alignItems: 'center',
  },
});

export default LearnMode;
