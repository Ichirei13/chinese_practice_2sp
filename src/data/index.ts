import rawWords2sp from "./2sp/words.json";
import rawSentences2sp from "./2sp/sentences.json";
import rawWords2fall from "./2fall/words.json";
import rawSentences2fall from "./2fall/sentences.json";
import type { WordItem, SentenceItem, QuizItem } from "./types";

/** 学期レジストリ。新しい学期はデータフォルダを足してここに 1 行加える。 */
export type SemesterId = "2sp" | "2fall";
export const SEMESTER_IDS: readonly SemesterId[] = ["2sp", "2fall"];
/** `/` で配信される学期。既存ユーザーの保存キー（サフィックスなし）もこの学期のもの。 */
export const DEFAULT_SEMESTER: SemesterId = "2sp";

export function isSemesterId(s: string): s is SemesterId {
  return (SEMESTER_IDS as readonly string[]).includes(s);
}

export type SemesterData = {
  words: WordItem[];
  sentences: SentenceItem[];
  /** All unique tags present in the sentence data, in insertion order */
  sentenceTags: string[];
  /**
   * Lookup from mastery key → current item. Word items are keyed by hanzi and
   * sentence items by id (these never collide). Used so Dashboard/Result always
   * show the *current* data even if a stored mastery record predates a fix.
   */
  itemByKey: Record<string, QuizItem>;
};

type RawWordEntry = { pinyin: string; display_pinyin: string; meaning: string };

const RAW: Record<SemesterId, { words: unknown; sentences: unknown }> = {
  "2sp": { words: rawWords2sp, sentences: rawSentences2sp },
  "2fall": { words: rawWords2fall, sentences: rawSentences2fall },
};

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

function buildSemesterData(id: SemesterId): SemesterData {
  const raw = RAW[id];

  const words: WordItem[] = Object.entries(raw.words as Record<string, RawWordEntry>).map(
    ([hanzi, data]) => ({
      hanzi,
      pinyin: data.display_pinyin || data.pinyin,
      meaning: data.meaning,
      type: "word" as const,
    })
  );

  const rawSentenceList = raw.sentences as unknown[];
  const sentences: SentenceItem[] = rawSentenceList.filter(isValidSentence);

  if (process.env.NODE_ENV !== "production" && sentences.length !== rawSentenceList.length) {
    console.warn(
      `[data:${id}] ${rawSentenceList.length - sentences.length} sentence record(s) dropped by validation.`
    );
  }

  const sentenceTags = Array.from(new Set(sentences.flatMap((s) => s.tags)));

  const itemByKey: Record<string, QuizItem> = {};
  for (const wItem of words) itemByKey[wItem.hanzi] = wItem;
  for (const sItem of sentences) itemByKey[sItem.id] = sItem;

  return { words, sentences, sentenceTags, itemByKey };
}

const cache = new Map<SemesterId, SemesterData>();

/** 学期の教材を返す。変換と検証は学期ごとに 1 回だけ行う。 */
export function getSemesterData(id: SemesterId): SemesterData {
  let data = cache.get(id);
  if (!data) {
    data = buildSemesterData(id);
    cache.set(id, data);
  }
  return data;
}

// --- 一時的な後方互換エクスポート（Task 2 で削除） ---
const defaultData = getSemesterData(DEFAULT_SEMESTER);
export const words = defaultData.words;
export const sentences = defaultData.sentences;
export const SENTENCE_TAGS = defaultData.sentenceTags;
export const itemByKey = defaultData.itemByKey;
