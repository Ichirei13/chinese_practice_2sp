import rawWords from "./exam_words.json";
import rawSentences from "./exam_sentences.json";
import type { WordItem, SentenceItem, QuizItem } from "./types";

type RawWordEntry = { pinyin: string; display_pinyin: string; meaning: string };

export const words: WordItem[] = Object.entries(rawWords as Record<string, RawWordEntry>).map(
  ([hanzi, data]) => ({
    hanzi,
    pinyin: data.display_pinyin || data.pinyin,
    meaning: data.meaning,
    type: "word" as const,
  })
);

/**
 * Runtime validation: drop any sentence record that doesn't satisfy its type's
 * required shape, so malformed data can never reach the quiz UI and crash it
 * (e.g. a rearrange without `answer`, or a fillin without a single `___`).
 */
function isValidSentence(s: unknown): s is SentenceItem {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  if (typeof o.id !== "string" || !Array.isArray(o.tags) || typeof o.meaning !== "string") return false;
  if (o.type === "rearrange") {
    return Array.isArray(o.words) && o.words.length > 0 && typeof o.answer === "string" && o.answer.length > 0;
  }
  if (o.type === "fillin") {
    return (
      typeof o.sentence === "string" &&
      o.sentence.split("___").length === 2 &&
      Array.isArray(o.options) &&
      typeof o.answer === "string" &&
      (o.options as unknown[]).includes(o.answer)
    );
  }
  return false;
}

const rawSentenceList = rawSentences as unknown[];
export const sentences: SentenceItem[] = rawSentenceList.filter(isValidSentence);

if (process.env.NODE_ENV !== "production" && sentences.length !== rawSentenceList.length) {
  console.warn(
    `[data] ${rawSentenceList.length - sentences.length} sentence record(s) dropped by validation.`
  );
}

/** All unique tags present in the sentence data, in insertion order */
export const SENTENCE_TAGS: string[] = Array.from(
  new Set(sentences.flatMap((s) => s.tags))
);

/**
 * Lookup from mastery key → current item. Word items are keyed by hanzi and
 * sentence items by id (these never collide). Used so Dashboard/Result always
 * show the *current* data even if a stored mastery record predates a fix.
 */
export const itemByKey: Record<string, QuizItem> = {};
for (const wItem of words) itemByKey[wItem.hanzi] = wItem;
for (const sItem of sentences) itemByKey[sItem.id] = sItem;
