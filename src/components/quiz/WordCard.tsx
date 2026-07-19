"use client";

import type { QuizItem, WordItem } from "@/data/types";

const isWordItem = (item: QuizItem): item is WordItem => item.type === "word";

type Props = {
  currentItem: QuizItem;
  mode: string;
  promptType: string;
  isAnswered: boolean;
  fillinSelected: string | null;
  playAudio: (text: string) => void;
};

export default function WordCard({
  currentItem,
  mode,
  promptType,
  isAnswered,
  fillinSelected,
  playAudio,
}: Props) {
  const hideHanzi = ["vocab_full", "listening", "hanzi"].includes(mode) && !isAnswered;
  const hideMeaning = ["meaning", "time_attack"].includes(mode) && !isAnswered;

  return (
    <div className="word-card">
      {/* Word display — shown for all non-rearrange / non-fillin modes */}
      {mode !== "rearrange" && mode !== "fillin" && isWordItem(currentItem) && (
        <>
          <div className="chinese-char">{hideHanzi ? "???" : currentItem.hanzi}</div>
          <div className="word-meaning">
            {hideMeaning
              ? "意味はどれ？"
              : mode === "listening" && !isAnswered
              ? "音声を聞いて答える"
              : promptType === "pinyin"
              ? currentItem.pinyin
              : currentItem.meaning}
          </div>
          <div className="word-pinyin-hint">
            {isAnswered || mode === "hanzi" || promptType === "pinyin"
              ? promptType === "pinyin" && !isAnswered
                ? currentItem.meaning
                : currentItem.pinyin
              : ""}
          </div>
        </>
      )}

      {/* Fillin sentence display */}
      {mode === "fillin" && currentItem.type === "fillin" && (
        <>
          <div
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "var(--font-noto-sc, sans-serif)" }}
          >
            {currentItem.sentence.split("___")[0]}
            <span
              className={`inline-block border-b-2 px-2 mx-1 ${
                isAnswered
                  ? fillinSelected === currentItem.answer
                    ? "border-[var(--green)] text-[var(--green)]"
                    : "border-[var(--red)] text-[var(--red)]"
                  : "border-[var(--accent)] text-[var(--accent)]"
              }`}
            >
              {fillinSelected || "　　"}
            </span>
            {currentItem.sentence.split("___")[1]}
          </div>
          {/* Japanese translation as a hint so the blank has a unique answer */}
          <div className="text-sm text-[var(--text-secondary)] mb-4">
            {currentItem.meaning}
          </div>
        </>
      )}

      {/* Audio button — word items only, shown after answer */}
      {isAnswered && currentItem.type === "word" && (
        <button className="btn-listen" onClick={() => playAudio(currentItem.hanzi)}>
          🔊 発音を聞く
        </button>
      )}
    </div>
  );
}
