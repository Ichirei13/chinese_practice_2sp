"use client";

import type { WordItem } from "@/data/types";

type Props = {
  choices: WordItem[];
  currentItem: WordItem;
  mode: string;
  isAnswered: boolean;
  dontKnowSelected: boolean;
  onChoice: (idx: number) => void;
  onDontKnow: () => void;
};

export default function MultipleChoice({
  choices,
  currentItem,
  mode,
  isAnswered,
  dontKnowSelected,
  onChoice,
  onDontKnow,
}: Props) {
  return (
    <>
      <div className="choices-grid">
        {choices.map((opt, i) => {
          const isCorrectOpt = opt.hanzi === currentItem.hanzi;
          let statusClass = "";
          if (isAnswered) {
            statusClass = isCorrectOpt
              ? "border-[var(--green)] bg-[rgba(34,216,122,0.1)]"
              : "opacity-50";
          }
          return (
            <button
              key={i}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 border-[var(--border-main)] bg-[var(--bg-elevated)] transition-all ${statusClass} ${
                !isAnswered ? "hover:border-[var(--accent)] hover:bg-[rgba(108,99,255,0.1)]" : ""
              }`}
              onClick={() => onChoice(i)}
              disabled={isAnswered}
            >
              <span className="w-6 h-6 rounded bg-[var(--bg-card)] text-xs font-bold flex items-center justify-center text-[var(--text-muted)] shrink-0">
                {["A", "B", "C", "D"][i]}
              </span>
              <div className={`text-left font-bold ${mode === "tones" ? "text-xl" : "text-sm"}`}>
                {["meaning", "time_attack"].includes(mode)
                  ? opt.meaning
                  : mode === "tones"
                  ? opt.pinyin
                  : opt.hanzi}
              </div>
            </button>
          );
        })}
      </div>

      {/* わからない — 5th choice, always wrong */}
      {!isAnswered && (
        <button
          className="btn-dont-know w-full mt-1"
          onClick={onDontKnow}
          disabled={isAnswered}
        >
          わからない
        </button>
      )}
      {isAnswered && dontKnowSelected && (
        <div className="btn-dont-know-answered w-full mt-1">
          わからない（正解は上に表示されています）
        </div>
      )}
    </>
  );
}
