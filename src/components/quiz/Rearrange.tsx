"use client";

type Chip = { id: number; text: string };

type Props = {
  zone: Chip[];
  bank: Chip[];
  isAnswered: boolean;
  onMove: (id: number, to: "zone" | "bank") => void;
  onSubmit: () => void;
};

export default function Rearrange({ zone, bank, isAnswered, onMove, onSubmit }: Props) {
  return (
    <div className="mb-6">
      {/* Answer zone */}
      <div className="min-h-[60px] p-4 border-2 border-[var(--border-main)] rounded-xl flex flex-wrap justify-center gap-2 mb-4 bg-[rgba(255,255,255,0.02)]">
        {zone.map(w => (
          <div
            key={w.id}
            className="px-4 py-2 border border-[var(--accent)] bg-[rgba(108,99,255,0.15)] text-[var(--accent-light)] rounded-lg cursor-pointer"
            onClick={() => onMove(w.id, "bank")}
          >
            {w.text}
          </div>
        ))}
      </div>

      {!isAnswered && (
        <>
          {/* Word bank */}
          <div className="min-h-[60px] p-4 border-2 border-dashed border-[var(--border-main)] rounded-xl flex flex-wrap justify-center gap-2">
            {bank.map(w => (
              <div
                key={w.id}
                className="px-4 py-2 border border-[var(--border-main)] bg-[var(--bg-elevated)] rounded-lg cursor-pointer hover:border-[var(--accent)] hover:-translate-y-0.5 transition-all"
                onClick={() => onMove(w.id, "zone")}
              >
                {w.text}
              </div>
            ))}
          </div>
          <button className="btn btn-primary w-full mt-6" onClick={onSubmit}>
            確認
          </button>
        </>
      )}
    </div>
  );
}
