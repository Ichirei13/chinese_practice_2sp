"use client";

import React from "react";

type Props = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onDontKnow: () => void;
  isAnswered: boolean;
  isCorrect: boolean | null;
};

export default function PinyinInput({
  inputRef,
  value,
  onChange,
  onSubmit,
  onDontKnow,
  isAnswered,
  isCorrect,
}: Props) {
  return (
    <div className="answer-area">
      <input
        ref={inputRef}
        className={`input ${isAnswered ? (isCorrect ? "correct" : "wrong") : ""}`}
        type="text"
        placeholder="ピンインを入力"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSubmit()}
        disabled={isAnswered}
      />
      {!isAnswered && (
        <div className="flex gap-2 mt-3">
          <button className="btn btn-primary flex-1" onClick={onSubmit}>
            確認
          </button>
          <button className="btn-dont-know" onClick={onDontKnow}>
            わからない
          </button>
        </div>
      )}
    </div>
  );
}
