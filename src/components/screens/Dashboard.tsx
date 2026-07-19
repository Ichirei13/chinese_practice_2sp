"use client";

import { useAppContext } from "@/context/AppContext";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ConfirmDialog } from "@/components/ui/Modal";
import { itemByKey } from "@/data";
import { isWeak } from "@/lib/buildQueue";
import type { MasteryData, QuizItem } from "@/data/types";

export default function Dashboard() {
  const { stats, mastery, resetData } = useAppContext();
  const [filter, setFilter] = useState<"all" | "weak" | "mastered">("all");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  // Resolve each mastery record to the *current* item (falling back to any
  // stale snapshot in legacy records), dropping records we can't resolve.
  type Row = { key: string; m: MasteryData; item: QuizItem };
  let rows: Row[] = Object.entries(mastery)
    .map(([key, m]): Row | null => {
      const item = itemByKey[key] ?? m.item ?? null;
      return item ? { key, m, item } : null;
    })
    .filter((r): r is Row => r !== null);

  if (filter === "weak") rows = rows.filter(r => isWeak(r.m));
  if (filter === "mastered") rows = rows.filter(r => r.m.total > 0 && (r.m.correct / r.m.total) >= 0.8 && r.m.total >= 3);

  rows = [...rows].sort((a, b) => (a.m.correct / a.m.total) - (b.m.correct / b.m.total));

  // Calculate memory levels based on SRS intervals
  const levels = {
    l1: rows.filter(r => (r.m.interval || 0) <= 1).length,
    l2: rows.filter(r => (r.m.interval || 0) > 1 && (r.m.interval || 0) <= 6).length,
    l3: rows.filter(r => (r.m.interval || 0) > 6 && (r.m.interval || 0) <= 15).length,
    l4: rows.filter(r => (r.m.interval || 0) > 15).length,
  };

  const chartData = [
    { name: "Lv1: 学習中 (間隔1日以下)", value: levels.l1, color: "#ef4444" },
    { name: "Lv2: 定着中 (間隔2〜6日)", value: levels.l2, color: "#f59e0b" },
    { name: "Lv3: 記憶定着 (間隔7〜15日)", value: levels.l3, color: "#3b82f6" },
    { name: "Lv4: マスター (間隔16日以上)", value: levels.l4, color: "#10b981" },
  ].filter(d => d.value > 0);

  const handleReset = () => setShowResetConfirm(true);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl animate-[fadeIn_0.3s_ease]">
      <h2 className="text-2xl font-bold mb-1">📊 学習ダッシュボード</h2>
      <p className="text-[var(--text-secondary)] text-sm mb-8">あなたの学習状況の詳細です</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-4xl font-extrabold text-[var(--accent-light)] mb-2">{acc > 0 ? `${acc}%` : '—'}</div>
          <div className="text-sm font-medium text-[var(--text-secondary)] mb-4">総合正答率</div>
          <div className="progress-bar">
            <div className="progress-fill green" style={{ width: `${acc}%` }}></div>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl font-extrabold text-[var(--yellow)]">{stats.streak}</div>
            <div>
              <div className="font-bold text-lg">日連続</div>
              <div className="text-xs text-[var(--text-secondary)]">学習ストリーク 🔥</div>
            </div>
          </div>
          <hr className="divider !my-3" />
          <div className="text-sm text-[var(--text-secondary)]">総学習語彙数: <strong className="text-[var(--text-primary)]">{Object.keys(mastery).length}</strong></div>
          <div className="text-sm text-[var(--text-secondary)]">総セッション数: <strong className="text-[var(--text-primary)]">{stats.sessions}</strong></div>
        </div>

        {/* SRS Memory Distribution Chart */}
        <div className="card col-span-1 md:col-span-2 p-6 flex flex-col items-center">
          <h3 className="w-full font-bold mb-4">記憶定着度分布 (SRS間隔)</h3>
          {chartData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-main)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-[var(--text-muted)] text-sm">学習を進めると、記憶定着度のグラフが表示されます</div>
          )}
        </div>

        <div className="card col-span-1 md:col-span-2 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="font-bold">問題別習得率</div>
            <div className="flex gap-2">
              <button className={`btn btn-sm ${filter==='all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>すべて</button>
              <button className={`btn btn-sm ${filter==='weak' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('weak')}>苦手のみ</button>
              <button className={`btn btn-sm ${filter==='mastered' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('mastered')}>習得済み</button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
            {rows.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">データがありません</div>
            ) : (
              rows.map(({ m, item: it }, i) => {
                const pct = Math.round((m.correct / m.total) * 100);
                const isSent = it.type === "fillin" || it.type === "rearrange";

                let displayTitle = "hanzi" in it ? it.hanzi : it.answer;
                if (it.type === "fillin") displayTitle = it.sentence.replace("___", "...").substring(0, 10) + "...";
                else if (it.type === "rearrange") displayTitle = it.answer.substring(0, 10) + "...";

                return (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border-main)] last:border-0">
                    <div className={`font-bold font-['Noto_Sans_SC'] ${isSent ? "text-base w-24 truncate" : "text-xl w-10"}`}>
                      {displayTitle}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[var(--accent-light)] truncate">
                        {isSent ? "文法・文章" : ("pinyin" in it ? it.pinyin : "")}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] truncate">{it.meaning}</div>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <div className="text-xs text-[var(--text-secondary)] mb-1">{pct}% ({m.correct}/{m.total})</div>
                      <div className="progress-bar">
                        <div className={`progress-fill ${pct >= 80 ? 'green' : ''}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <button className="btn btn-secondary border-[var(--red)] text-[var(--red)]" onClick={handleReset}>
          🗑️ 学習データをリセット
        </button>
      </div>

      {showResetConfirm && (
        <ConfirmDialog
          message="学習データを全てリセットしますか？この操作は取り消せません。"
          confirmLabel="リセット"
          onConfirm={() => { resetData(); setShowResetConfirm(false); }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
