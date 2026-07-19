"use client";

import { useAppContext } from "@/context/AppContext";
import type { QuizItem } from "@/data/types";

export default function Result() {
  const { setScreen, sessionResult, setRetryQueue } = useAppContext();

  if (!sessionResult) return null;

  const { correct, total, time, mistakes } = sessionResult;
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  let emoji = "💪";
  let title = "あと一歩！";
  if (acc === 100) { emoji = "🏆"; title = "パーフェクト！"; }
  else if (acc >= 80) { emoji = "🌟"; title = "素晴らしい！"; }

  const min = Math.floor(time / 60);
  const sec = time % 60;

  const retryWrong = () => {
    // Replay exactly the items missed this session (not a mastery-based filter),
    // so a just-missed item is always retried regardless of past accuracy.
    setRetryQueue(mistakes.map(m => m.item));
    setScreen("quiz");
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl animate-[fadeIn_0.3s_ease] text-center">
      <div className="py-8">
        <div className="text-5xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-extrabold mb-2">{title}</h2>
        <div className="text-6xl font-extrabold bg-gradient-to-br from-[var(--green)] to-[var(--accent-light)] bg-clip-text text-transparent mb-2">
          {acc}%
        </div>
        <p className="text-[var(--text-secondary)] mb-8">{total}問中 {correct}問正解</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-2xl font-bold text-[var(--green)]">{correct}</div>
            <div className="text-xs text-[var(--text-secondary)]">正解</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-[var(--red)]">{mistakes.length}</div>
            <div className="text-xs text-[var(--text-secondary)]">不正解</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold">{min}:{sec.toString().padStart(2, '0')}</div>
            <div className="text-xs text-[var(--text-secondary)]">タイム</div>
          </div>
        </div>
      </div>

      {mistakes.length > 0 && (
        <div className="text-left mb-8">
          <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-4">📌 間違えた問題（復習用）</h3>
          <div className="space-y-2">
            {mistakes.map((m: { item: QuizItem }, i: number) => {
              const it = m.item;
              const isSent = it.type === "fillin" || it.type === "rearrange";
              let displayTitle = "hanzi" in it ? it.hanzi : it.answer;
              if (it.type === "fillin") displayTitle = it.sentence.replace("___", `[${it.answer}]`);
              else if (it.type === "rearrange") displayTitle = it.answer;

              return (
                <div key={i} className="flex items-center gap-4 p-4 card">
                  <div className={`font-bold font-['Noto_Sans_SC'] ${isSent ? 'text-lg' : 'text-2xl w-12'}`}>{displayTitle}</div>
                  <div className="flex-1">
                    <div className="text-sm text-[var(--accent-light)] font-bold">
                      {isSent ? (it.type === "fillin" ? "空欄選択" : "並び替え") : ("pinyin" in it ? it.pinyin : "")}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">{it.meaning}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <button className="btn btn-primary btn-lg" onClick={() => setScreen("quiz")}>🔄 もう一度</button>
        {mistakes.length > 0 && (
          <button className="btn btn-secondary" onClick={retryWrong}>❌ 間違いだけ再挑戦</button>
        )}
        <button className="btn btn-secondary" onClick={() => setScreen("home")}>🏠 ホームへ</button>
      </div>
    </div>
  );
}
