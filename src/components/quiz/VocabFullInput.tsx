"use client";

import React from "react";
import type { WordItem } from "@/data/types";

const normalizePinyin = (p: string) => p.toLowerCase().replace(/\s+/g, "").trim();

type Props = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  pinyinValue: string;
  hanziValue: string;
  onPinyinChange: (val: string) => void;
  onHanziChange: (val: string) => void;
  onSubmit: () => void;
  onDontKnow: () => void;
  isAnswered: boolean;
  currentItem: WordItem;
  promptType: string;
};

export default function VocabFullInput({
  inputRef,
  pinyinValue,
  hanziValue,
  onPinyinChange,
  onHanziChange,
  onSubmit,
  onDontKnow,
  isAnswered,
  currentItem,
  promptType,
}: Props) {
  return (
    <div className="answer-area flex flex-col gap-3">
      {promptType !== "pinyin" && (
        <input
          ref={inputRef}
          className={`input ${
            isAnswered
              ? normalizePinyin(pinyinValue) === normalizePinyin(currentItem.pinyin)
                ? "correct"
                : "wrong"
              : ""
          }`}
          type="text"
          placeholder="ピンインを入力"
          value={pinyinValue}
          onChange={e => onPinyinChange(e.target.value)}
          disabled={isAnswered}
        />
      )}
      <input
        className={`input ${
          isAnswered
            ? hanziValue.trim() === currentItem.hanzi
              ? "correct"
              : "wrong"
            : ""
        }`}
        type="text"
        placeholder="漢字を入力"
        value={hanziValue}
        onChange={e => onHanziChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSubmit()}
        disabled={isAnswered}
        ref={promptType === "pinyin" ? inputRef : undefined}
      />
      {!isAnswered && (
        <div className="flex gap-2">
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
