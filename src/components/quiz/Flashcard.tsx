"use client";

import type { WordItem } from "@/data/types";

type Props = {
  item: WordItem;
  currentIndex: number;
  queueLength: number;
  showAnswer: boolean;
  onShowAnswer: () => void;
  /** called with true=覚えた / false=もう一度 */
  onResult: (correct: boolean) => void;
  onExit: () => void;
  playAudio: (text: string) => void;
};

export default function Flashcard({
  item,
  currentIndex,
  queueLength,
  showAnswer,
  onShowAnswer,
  onResult,
  onExit,
  playAudio,
}: Props) {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-lg">
      <div className="flex justify-between items-center mb-6">
        <button className="btn btn-ghost btn-sm" onClick={onExit}>← 終了</button>
        <div className="text-sm font-bold text-[var(--text-secondary)]">
          {currentIndex + 1} / {queueLength}
        </div>
      </div>

      <div
        className="card text-center py-20 cursor-pointer min-h-[300px] flex flex-col justify-center items-center"
        onClick={onShowAnswer}
      >
        <div className="chinese-char mb-4">{item.hanzi}</div>
        {showAnswer ? (
          <div className="animate-[fadeIn_0.3s_ease]">
            <div className="text-xl text-[var(--accent-light)] font-medium mb-2">{item.pinyin}</div>
            <div className="text-base text-[var(--text-secondary)]">{item.meaning}</div>
            <button
              className="mt-4 px-4 py-2 bg-[var(--bg-elevated)] rounded-full text-sm border border-[var(--border-main)] hover:border-[var(--accent)] transition-colors"
              onClick={e => { e.stopPropagation(); playAudio(item.hanzi); }}
            >
              🔊 聞く
            </button>
          </div>
        ) : (
          <div className="text-[var(--text-muted)] text-sm mt-4">タップして答えを見る</div>
        )}
      </div>

      {showAnswer && (
        <div className="flex gap-4 mt-8">
          <button
            className="btn flex-1 bg-[rgba(255,95,95,0.12)] text-[var(--red)] border border-[var(--red)] py-4"
            onClick={() => onResult(false)}
          >
            ❌ もう一度
          </button>
          <button
            className="btn flex-1 bg-[rgba(34,216,122,0.12)] text-[var(--green)] border border-[var(--green)] py-4"
            onClick={() => onResult(true)}
          >
            ✅ 覚えた
          </button>
        </div>
      )}
    </div>
  );
}
