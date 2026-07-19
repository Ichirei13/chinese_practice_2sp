export const ACCENTED_CHARS: Record<string, string> = {
  "ā":"a", "á":"a", "ǎ":"a", "à":"a",
  "ē":"e", "é":"e", "ě":"e", "è":"e",
  "ī":"i", "í":"i", "ǐ":"i", "ì":"i",
  "ō":"o", "ó":"o", "ǒ":"o", "ò":"o",
  "ū":"u", "ú":"u", "ǔ":"u", "ù":"u",
  "ǖ":"ü", "ǘ":"ü", "ǚ":"ü", "ǜ":"ü",
};

export const BASE_TO_TONES: Record<string, string[]> = {
  "a": ["ā", "á", "ǎ", "à"],
  "e": ["ē", "é", "ě", "è"],
  "i": ["ī", "í", "ǐ", "ì"],
  "o": ["ō", "ó", "ǒ", "ò"],
  "u": ["ū", "ú", "ǔ", "ù"],
  "ü": ["ǖ", "ǘ", "ǚ", "ǜ"],
};

export function generateToneDistractors(correctDisplay: string): string[] {
  const chars = correctDisplay.split("");

  // Positions that can carry a tone: either already tone-marked, or a plain
  // base vowel (covers neutral-tone / numberless pinyin like "zhīdao").
  const tonable: { index: number; base: string }[] = [];
  chars.forEach((ch, index) => {
    const base = ACCENTED_CHARS[ch] ?? (BASE_TO_TONES[ch.toLowerCase()] ? ch.toLowerCase() : null);
    if (base) tonable.push({ index, base });
  });

  const distractors = new Set<string>();

  const applyTones = (tones: number[]): string => {
    const out = [...chars];
    tonable.forEach(({ index, base }, i) => {
      out[index] = BASE_TO_TONES[base][tones[i]];
    });
    return out.join("");
  };

  // 1. Random combinations
  let attempts = 60;
  while (distractors.size < 3 && attempts-- > 0 && tonable.length > 0) {
    const tones = tonable.map(() => Math.floor(Math.random() * 4));
    const candidate = applyTones(tones);
    if (candidate !== correctDisplay) distractors.add(candidate);
  }

  // 2. Deterministic single-position tone shifts (guarantees enough options
  //    for short syllables where random combos are exhausted quickly).
  for (let p = 0; p < tonable.length && distractors.size < 3; p++) {
    for (let t = 0; t < 4 && distractors.size < 3; t++) {
      const tones = tonable.map(({ index, base }) => {
        const current = BASE_TO_TONES[base].indexOf(chars[index]);
        return current >= 0 ? current : 0;
      });
      tones[p] = t;
      const candidate = applyTones(tones);
      if (candidate !== correctDisplay) distractors.add(candidate);
    }
  }

  return Array.from(distractors).slice(0, 3);
}
