export type WordItem = {
  hanzi: string;
  pinyin: string;
  meaning: string;
  type: "word";
};

export type RearrangeItem = {
  id: string;
  type: "rearrange";
  tags: string[];
  words: string[];
  answer: string;
  /** Alternative word orders that are also accepted as correct */
  accept?: string[];
  meaning: string;
  /** Optional grammar note */
  explanation?: string;
};

export type FillinItem = {
  id: string;
  type: "fillin";
  tags: string[];
  sentence: string;
  options: string[];
  answer: string;
  meaning: string;
  /** Optional grammar note */
  explanation?: string;
};

export type SentenceItem = RearrangeItem | FillinItem;
export type QuizItem = WordItem | SentenceItem;

/** All selectable quiz modes (word modes + sentence modes) */
export type QuizMode =
  | "pinyin"
  | "meaning"
  | "hanzi"
  | "tones"
  | "listening"
  | "vocab_full"
  | "flashcard"
  | "time_attack"
  | "rearrange"
  | "fillin"
  | "fillin";

export type SessionConfig = {
  mode: QuizMode;
  count: string;
  weakOnly: boolean;
  reviewMode: boolean;
  range: string;
  tag: string;
  promptType: string;
};

export type SessionResult = {
  correct: number;
  total: number;
  time: number;
  mistakes: { item: QuizItem }[];
};

export type MasteryData = {
  correct: number;
  total: number;
  /**
   * Snapshot of the item. Optional: newer records store only id + score and
   * resolve the item from current data at display time (see data/index.ts).
   * Legacy records may still carry a stale copy, used only as a fallback.
   */
  item?: QuizItem;
  interval?: number;
  easeFactor?: number;
  nextReviewDate?: string;
};
