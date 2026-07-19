import { words, sentences } from "@/data";
import { shuffle } from "@/utils/shuffle";
import { ACCENTED_CHARS } from "@/utils/tones";
import type { SessionConfig, MasteryData, QuizItem } from "@/data/types";

/**
 * Single source of truth for the "weak" (苦手) criterion, shared by buildQueue,
 * Home and Dashboard so the three never disagree.
 */
export const isWeak = (m: MasteryData): boolean =>
  m.total > 0 && m.correct < m.total && m.correct / m.total < 0.8;

/**
 * Pure function: builds a shuffled, filtered quiz queue from the given config
 * and mastery state. Returns [] if no items match (caller handles empty case).
 */
export function buildQueue(
  config: SessionConfig,
  mastery: Record<string, MasteryData>
): QuizItem[] {
  const isSentence = ["rearrange", "fillin"].includes(config.mode);

  // 1. mode → pool 選択（word vs sentence）
  let pool: QuizItem[] = isSentence
    ? sentences
        .filter(q => config.tag === "all" || q.tags.includes(config.tag))
        .filter(q => q.type === config.mode)
    : words.filter(w => {
        if (config.range === "all") return true;
        // pinyin may start with a tone-marked vowel (e.g. "ài"); map it back to
        // the base latin letter before range-comparing, else those words fall
        // outside every A–Z bucket and only ever show under "すべて".
        const first = w.pinyin.charAt(0);
        const c = (ACCENTED_CHARS[first] || first).toLowerCase();
        if (config.range === "a-f") return c >= "a" && c <= "f";
        if (config.range === "g-l") return c >= "g" && c <= "l";
        if (config.range === "m-r") return c >= "m" && c <= "r";
        if (config.range === "s-z") return c >= "s" && c <= "z";
        return true;
      });

  // 2. reviewMode / weakOnly フィルタ
  const getId = (q: QuizItem) => ("id" in q ? q.id : q.hanzi);

  if (config.reviewMode) {
    const today = new Date().toISOString();
    pool = pool.filter(q => {
      const m = mastery[getId(q)];
      return m?.nextReviewDate && m.nextReviewDate <= today;
    });
  } else if (config.weakOnly) {
    pool = pool.filter(q => {
      const m = mastery[getId(q)];
      return m ? isWeak(m) : false;
    });
  }

  // 3. 空プールは [] を返す（呼び元でハンドリング）
  if (pool.length === 0) return [];

  // 4. shuffle + count 切り出し
  const shuffled = shuffle(pool);
  const count = config.count === "all" ? pool.length : parseInt(config.count);
  return shuffled.slice(0, count);
}
