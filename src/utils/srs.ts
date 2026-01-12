/**
 * Spaced Repetition System (SRS) - Anki-style SM-2 Algorithm
 */

export const SRS_CONFIG = {
  LEARNING_STEPS: [1, 10], // minutes
  GRADUATING_INTERVAL: 1, // days
  EASY_INTERVAL: 4, // days
  RELEARNING_STEPS: [10], // minutes
  STARTING_EASE: 2.5,
  MIN_EASE: 1.3,
  EASE_AGAIN: -0.2,
  EASE_HARD: -0.15,
  EASE_EASY: 0.15,
  HARD_INTERVAL: 1.2,
  MAX_INTERVAL: 36500,
};

export enum CardState {
  NEW = 'new',
  LEARNING = 'learning',
  REVIEW = 'review',
  RELEARNING = 'relearning',
}

export enum Rating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4,
}

export interface SRSCard {
  id: string;
  word: string;
  translation: string;
  context?: string;
  state: CardState;
  ease: number;
  interval: number;
  stepIndex: number;
  due: Date;
  reviews: number;
  lapses: number;
  lastReview: Date | null;
}

export function createNewCard(vocab: { id: string; word: string; translation: string; context?: string }): SRSCard {
  return {
    id: vocab.id,
    word: vocab.word,
    translation: vocab.translation,
    context: vocab.context,
    state: CardState.NEW,
    ease: SRS_CONFIG.STARTING_EASE,
    interval: 0,
    stepIndex: 0,
    due: new Date(),
    reviews: 0,
    lapses: 0,
    lastReview: null,
  };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculateNextReview(card: SRSCard, rating: Rating): SRSCard {
  const now = new Date();
  const updatedCard = { ...card };
  updatedCard.reviews += 1;
  updatedCard.lastReview = now;

  switch (card.state) {
    case CardState.NEW:
    case CardState.LEARNING:
      return handleLearningCard(updatedCard, rating);
    case CardState.REVIEW:
      return handleReviewCard(updatedCard, rating);
    case CardState.RELEARNING:
      return handleRelearningCard(updatedCard, rating);
    default:
      return handleLearningCard(updatedCard, rating);
  }
}

function handleLearningCard(card: SRSCard, rating: Rating): SRSCard {
  const now = new Date();
  const steps = SRS_CONFIG.LEARNING_STEPS;

  switch (rating) {
    case Rating.AGAIN:
      card.stepIndex = 0;
      card.state = CardState.LEARNING;
      card.due = addMinutes(now, steps[0]);
      break;
    case Rating.HARD:
      card.state = CardState.LEARNING;
      const currentStep = steps[Math.min(card.stepIndex, steps.length - 1)];
      card.due = addMinutes(now, currentStep);
      break;
    case Rating.GOOD:
      if (card.stepIndex >= steps.length - 1) {
        card.state = CardState.REVIEW;
        card.interval = SRS_CONFIG.GRADUATING_INTERVAL;
        card.due = addDays(now, card.interval);
      } else {
        card.stepIndex += 1;
        card.state = CardState.LEARNING;
        card.due = addMinutes(now, steps[card.stepIndex]);
      }
      break;
    case Rating.EASY:
      card.state = CardState.REVIEW;
      card.interval = SRS_CONFIG.EASY_INTERVAL;
      card.ease = Math.min(card.ease + SRS_CONFIG.EASE_EASY, 3.0);
      card.due = addDays(now, card.interval);
      break;
  }

  return card;
}

function handleReviewCard(card: SRSCard, rating: Rating): SRSCard {
  const now = new Date();

  switch (rating) {
    case Rating.AGAIN:
      card.lapses += 1;
      card.state = CardState.RELEARNING;
      card.stepIndex = 0;
      card.ease = Math.max(card.ease + SRS_CONFIG.EASE_AGAIN, SRS_CONFIG.MIN_EASE);
      card.due = addMinutes(now, SRS_CONFIG.RELEARNING_STEPS[0]);
      break;
    case Rating.HARD:
      card.ease = Math.max(card.ease + SRS_CONFIG.EASE_HARD, SRS_CONFIG.MIN_EASE);
      card.interval = Math.max(card.interval + 1, Math.round(card.interval * SRS_CONFIG.HARD_INTERVAL));
      card.interval = Math.min(card.interval, SRS_CONFIG.MAX_INTERVAL);
      card.due = addDays(now, card.interval);
      break;
    case Rating.GOOD:
      card.interval = Math.round(card.interval * card.ease);
      card.interval = Math.min(card.interval, SRS_CONFIG.MAX_INTERVAL);
      card.due = addDays(now, card.interval);
      break;
    case Rating.EASY:
      card.ease = Math.min(card.ease + SRS_CONFIG.EASE_EASY, 3.0);
      card.interval = Math.round(card.interval * card.ease * 1.3);
      card.interval = Math.min(card.interval, SRS_CONFIG.MAX_INTERVAL);
      card.due = addDays(now, card.interval);
      break;
  }

  return card;
}

function handleRelearningCard(card: SRSCard, rating: Rating): SRSCard {
  const now = new Date();
  const steps = SRS_CONFIG.RELEARNING_STEPS;

  switch (rating) {
    case Rating.AGAIN:
      card.stepIndex = 0;
      card.due = addMinutes(now, steps[0]);
      break;
    case Rating.HARD:
      const currentStep = steps[Math.min(card.stepIndex, steps.length - 1)];
      card.due = addMinutes(now, currentStep);
      break;
    case Rating.GOOD:
      if (card.stepIndex >= steps.length - 1) {
        card.state = CardState.REVIEW;
        card.interval = Math.max(1, Math.round(card.interval * 0.5));
        card.due = addDays(now, card.interval);
      } else {
        card.stepIndex += 1;
        card.due = addMinutes(now, steps[card.stepIndex]);
      }
      break;
    case Rating.EASY:
      card.state = CardState.REVIEW;
      card.interval = Math.max(1, Math.round(card.interval * 0.7));
      card.due = addDays(now, card.interval);
      break;
  }

  return card;
}

export function getNextReviewText(card: SRSCard, rating: Rating): string {
  const tempCard = calculateNextReview({ ...card }, rating);
  const now = new Date();
  const due = new Date(tempCard.due);

  const diffMs = due.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffMins < 1440) {
    const hours = Math.round(diffMins / 60);
    return `${hours}h`;
  } else if (diffDays < 30) {
    return `${diffDays}d`;
  } else if (diffDays < 365) {
    const months = Math.round(diffDays / 30);
    return `${months}mo`;
  } else {
    const years = (diffDays / 365).toFixed(1);
    return `${years}y`;
  }
}

export function getAllNextReviewTexts(card: SRSCard): Record<string, string> {
  return {
    again: getNextReviewText(card, Rating.AGAIN),
    hard: getNextReviewText(card, Rating.HARD),
    good: getNextReviewText(card, Rating.GOOD),
    easy: getNextReviewText(card, Rating.EASY),
  };
}

export function buildStudyQueue(cards: SRSCard[]) {
  const now = new Date();
  const newCards: SRSCard[] = [];
  const learningCards: SRSCard[] = [];
  const reviewCards: SRSCard[] = [];

  cards.forEach(card => {
    if (card.state === CardState.NEW && card.reviews === 0) {
      newCards.push(card);
    } else if (card.state === CardState.LEARNING || card.state === CardState.RELEARNING) {
      if (new Date(card.due) <= now) {
        learningCards.push(card);
      }
    } else if (card.state === CardState.REVIEW) {
      if (new Date(card.due) <= now) {
        reviewCards.push(card);
      }
    }
  });

  learningCards.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
  reviewCards.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

  // Shuffle new cards
  for (let i = newCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
  }

  return {
    newCards: newCards.slice(0, 20),
    learningCards,
    reviewCards: reviewCards.slice(0, 200),
    counts: {
      new: Math.min(newCards.length, 20),
      learning: learningCards.length,
      review: Math.min(reviewCards.length, 200),
    },
  };
}
