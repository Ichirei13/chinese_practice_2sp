"use client";

import { useMemo } from "react";
import { shuffle } from "@/utils/shuffle";

type Props = {
  options: string[];
  onSelect: (opt: string) => void;
};

export default function Fillin({ options, onSelect }: Props) {
  // Shuffle so the correct choice isn't predictable from its position in the
  // data. Re-shuffles only when the option set changes (i.e. per question).
  const shuffled = useMemo(() => shuffle(options), [options]);

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {shuffled.map((opt, i) => (
        <button
          key={i}
          className="px-6 py-3 border-2 border-[var(--border-main)] bg-[var(--bg-elevated)] rounded-xl hover:border-[var(--accent)] hover:-translate-y-0.5 transition-all"
          onClick={() => onSelect(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
