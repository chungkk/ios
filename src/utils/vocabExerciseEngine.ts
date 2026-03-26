// Offline exercise generator - ported from website
// No AI needed for basic exercises

import { VocabularyItem } from '../services/vocabulary.service';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Clean translation: take only the core meaning, strip noise
function cleanTranslation(text: string): string {
  if (!text) return '';
  let clean = text.trim();
  clean = clean.replace(/[""].+?[""].*?(là|nghĩa|:)\s*/gi, '');
  const parts = clean.split(',').map(s => s.trim());
  if (parts.length > 2) return parts.slice(0, 2).join(', ');
  return clean;
}

// Pick distractors that are similar in length, deduplicated
function pickDistractors(correct: string, allOptions: string[], count: number): string[] {
  const correctLen = correct.length;
  const seen = new Set([correct]);
  const candidates = allOptions
    .filter(x => {
      if (!x || x.length === 0 || seen.has(x)) return false;
      seen.add(x);
      return true;
    })
    .map(x => ({ text: x, diff: Math.abs(x.length - correctLen) }))
    .sort((a, b) => a.diff - b.diff);
  const pool = candidates.slice(0, Math.max(count * 3, 8));
  return shuffle(pool).slice(0, count).map(x => x.text);
}

export interface Exercise {
  type: 'meaning' | 'reverse' | 'fill' | 'listen';
  question: string;
  word: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  speakWord?: string;
}

// Generate meaning quiz: given German word, pick correct Vietnamese translation
function generateMeaningQuiz(vocab: VocabularyItem, allVocab: VocabularyItem[]): Exercise | null {
  const correct = cleanTranslation(vocab.translation);
  const pool = allVocab
    .filter(v => v.word !== vocab.word)
    .map(v => cleanTranslation(v.translation))
    .filter(t => t && t !== correct);
  if (pool.length < 3) return null;
  const wrong = pickDistractors(correct, pool, 3);
  const options = shuffle([correct, ...wrong]);
  return {
    type: 'meaning',
    question: `"${vocab.word}" nghĩa là gì?`,
    word: vocab.word,
    options,
    correctIndex: options.indexOf(correct),
  };
}

// Generate reverse quiz: given Vietnamese, pick correct German word
function generateReverseQuiz(vocab: VocabularyItem, allVocab: VocabularyItem[]): Exercise | null {
  const pool = allVocab
    .filter(v => v.word !== vocab.word)
    .map(v => v.word);
  if (pool.length < 3) return null;
  const wrong = pickDistractors(vocab.word, pool, 3);
  const options = shuffle([vocab.word, ...wrong]);
  return {
    type: 'reverse',
    question: `Từ tiếng Đức nào có nghĩa "${cleanTranslation(vocab.translation)}"?`,
    word: vocab.word,
    options,
    correctIndex: options.indexOf(vocab.word),
  };
}

// Generate fill-in-the-blank using example sentence
function generateFillBlank(vocab: VocabularyItem, allVocab: VocabularyItem[]): Exercise | null {
  const sentence = vocab.example || null;
  if (!sentence || !sentence.toLowerCase().includes(vocab.word.toLowerCase())) {
    return null;
  }
  const regex = new RegExp(vocab.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const blanked = sentence.replace(regex, '___');
  const pool = allVocab
    .filter(v => v.word !== vocab.word)
    .map(v => v.word);
  if (pool.length < 3) return null;
  const wrong = pickDistractors(vocab.word, pool, 3);
  const options = shuffle([vocab.word, ...wrong]);
  return {
    type: 'fill',
    question: blanked,
    hint: cleanTranslation(vocab.translation),
    word: vocab.word,
    options,
    correctIndex: options.indexOf(vocab.word),
  };
}

// Generate listen quiz: given translation, pick the German word you'd hear
function generateListenQuiz(vocab: VocabularyItem, allVocab: VocabularyItem[]): Exercise | null {
  const pool = allVocab
    .filter(v => v.word !== vocab.word)
    .map(v => v.word);
  if (pool.length < 3) return null;
  const wrong = pickDistractors(vocab.word, pool, 3);
  const options = shuffle([vocab.word, ...wrong]);
  return {
    type: 'listen',
    question: `Nghe và chọn từ có nghĩa "${cleanTranslation(vocab.translation)}":`,
    word: vocab.word,
    options,
    correctIndex: options.indexOf(vocab.word),
    speakWord: vocab.word,
  };
}

// Main: generate a full exercise set from vocabulary
export function generateExercises(vocabulary: VocabularyItem[]): { exercises: Exercise[] } {
  if (!vocabulary || vocabulary.length < 2) return { exercises: [] };

  const exercises: Exercise[] = [];
  const words = shuffle([...vocabulary]);

  for (const vocab of words) {
    if (vocabulary.length >= 4) {
      const meaning = generateMeaningQuiz(vocab, vocabulary);
      if (meaning) exercises.push(meaning);

      const reverse = generateReverseQuiz(vocab, vocabulary);
      if (reverse) exercises.push(reverse);
    }

    const fill = generateFillBlank(vocab, vocabulary);
    if (fill) exercises.push(fill);

    const listen = generateListenQuiz(vocab, vocabulary);
    if (listen) exercises.push(listen);
  }

  const shuffled = shuffle(exercises);
  const limited = shuffled.slice(0, Math.min(shuffled.length, 15));

  return { exercises: limited };
}

export interface WordResult {
  correct: number;
  wrong: number;
}

export interface EvaluationResult {
  strong: Array<{ word: string; translation: string; ratio: number; correct: number; total: number }>;
  weak: Array<{ word: string; translation: string; ratio: number; correct: number; total: number }>;
  notTested: Array<{ word: string; translation: string }>;
  overallScore: string;
  totalCorrect: number;
  totalAll: number;
}

// Evaluate results purely with algorithm
export function evaluateResults(
  wordResults: Record<string, WordResult>,
  vocabulary: VocabularyItem[],
): EvaluationResult {
  const strong: EvaluationResult['strong'] = [];
  const weak: EvaluationResult['weak'] = [];
  const notTested: EvaluationResult['notTested'] = [];

  for (const vocab of vocabulary) {
    const r = wordResults[vocab.word];
    if (!r || (r.correct === 0 && r.wrong === 0)) {
      notTested.push({ word: vocab.word, translation: vocab.translation });
    } else {
      const total = r.correct + r.wrong;
      const ratio = r.correct / total;
      if (ratio >= 0.7) {
        strong.push({ word: vocab.word, translation: vocab.translation, ratio, correct: r.correct, total });
      } else {
        weak.push({ word: vocab.word, translation: vocab.translation, ratio, correct: r.correct, total });
      }
    }
  }

  const totalCorrect = Object.values(wordResults).reduce((s, r) => s + r.correct, 0);
  const totalWrong = Object.values(wordResults).reduce((s, r) => s + r.wrong, 0);
  const totalAll = totalCorrect + totalWrong;
  const overallRatio = totalAll > 0 ? totalCorrect / totalAll : 0;

  let overallScore = 'D';
  if (overallRatio >= 0.85) overallScore = 'A';
  else if (overallRatio >= 0.7) overallScore = 'B';
  else if (overallRatio >= 0.5) overallScore = 'C';

  return { strong, weak, notTested, overallScore, totalCorrect, totalAll };
}

// Leitner box intervals (in days)
const LEITNER_INTERVALS = [0, 1, 3, 7, 14];

export function calculateNextReviewLeitner(box: number, correct: boolean) {
  const newBox = correct ? Math.min(box + 1, 4) : Math.max(box - 1, 0);
  const intervalDays = LEITNER_INTERVALS[newBox];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);
  return { newBox, nextReview };
}

export function getWordsForReview(vocabulary: VocabularyItem[]): VocabularyItem[] {
  const now = new Date();
  return vocabulary.filter(v => {
    if (!v.nextReviewAt) return true;
    return new Date(v.nextReviewAt) <= now;
  });
}
