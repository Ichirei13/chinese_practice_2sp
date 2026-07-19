"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import { SENTENCE_TAGS } from "@/data";
import { isWeak } from "@/lib/buildQueue";
import type { QuizMode } from "@/data/types";

export default function Home() {
  const { setScreen, stats, mastery, sessionConfig, setSessionConfig } = useAppContext();

  const isSentenceMode = ["rearrange", "fillin"].includes(sessionConfig.mode);

  const totalStudied = Object.keys(mastery).length;
  const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  
  const weakItems = Object.values(mastery).filter(isWeak);
  const hasWeakItems = weakItems.length > 0;

  const handleStart = () => {
    setScreen("quiz");
  };

  const handleQuickRetry = () => {
    setSessionConfig({ ...sessionConfig, weakOnly: true, reviewMode: false });
    setScreen("quiz");
  };

  const handleReviewToday = () => {
    setSessionConfig({ ...sessionConfig, reviewMode: true, weakOnly: false });
    setScreen("quiz");
  };



  const setMode = (mode: QuizMode) => setSessionConfig({ ...sessionConfig, mode });

  const modes = [
    { id: "pinyin", icon: "⌨️", title: "ピンイン入力", desc: "漢字を見てピンインを入力", color: "#6c63ff" },
    { id: "meaning", icon: "📝", title: "意味クイズ", desc: "意味を4択で答える", color: "#22d87a" },
    { id: "hanzi", icon: "🔤", title: "漢字クイズ", desc: "正しい漢字を4択で答える", color: "#fbbf24" },
    { id: "tones", icon: "🎵", title: "四声クイズ", desc: "正しい声調（トーン）を当てる", color: "#a855f7" },
    { id: "listening", icon: "👂", title: "リスニング", desc: "音声を聞いてピンインを入力", color: "#38bdf8" },
    { id: "vocab_full", icon: "✍️", title: "フル単語テスト", desc: "漢字とピンインを両方入力", color: "#ff5f5f" },
    { id: "flashcard", icon: "📇", title: "フラッシュカード", desc: "サクサク暗記モード", color: "#f472b6" },
    { id: "time_attack", icon: "⏱️", title: "タイムアタック", desc: "制限時間内に何問解けるか", color: "#ef4444" },
  ];

  const sentenceModes = [
    { id: "rearrange", icon: "🔀", title: "並び替え", desc: "単語を正しい語順に並び替える", color: "#8b5cf6" },
    { id: "fillin", icon: "🧩", title: "穴埋め", desc: "空欄に当てはまる単語を選ぶ", color: "#10b981" },
  ];

  return (
    <section className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-[fadeIn_0.3s_ease]">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="hero col-span-1 md:col-span-full text-center pb-4">
          <div className="text-4xl mb-2">🀄</div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-light)] bg-clip-text text-transparent">期末試験対策</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">単語から文章まで、試験対策を完璧に！</p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card text-center p-4">
              <div className="text-2xl font-extrabold text-[var(--accent-light)] mb-1">{totalStudied}</div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">学習済み単語</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-2xl font-extrabold text-[var(--accent-light)] mb-1">{acc > 0 ? `${acc}%` : '—'}</div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">総合正答率</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-2xl font-extrabold text-[var(--accent-light)] mb-1">🔥 {stats.streak}</div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">連続学習日</div>
            </div>
          </div>
          
          {hasWeakItems && (
            <button className="btn btn-secondary border-[var(--red)] text-[var(--red)] mx-auto mb-3" onClick={handleQuickRetry}>
              📌 苦手な問題だけを復習する
            </button>
          )}

          <button className="btn btn-primary mx-auto mb-2 w-full max-w-xs text-lg py-3 shadow-lg" onClick={handleReviewToday}>
            📚 今日の復習
          </button>

          <button className="btn btn-secondary mx-auto mb-6 w-full max-w-xs" onClick={() => setScreen("dashboard")}>
            📊 学習ダッシュボードを見る
          </button>
        </div>

        <div className="mode-section col-start-1">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">単語テストモード</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {modes.map(m => (
              <div 
                key={m.id}
                className={`mode-card ${sessionConfig.mode === m.id ? 'selected' : ''}`}
                style={{ '--mode-color': m.color } as React.CSSProperties}
                onClick={() => setMode(m.id as QuizMode)}
              >
                <span className="mode-icon text-2xl mb-2 block">{m.icon}</span>
                <div className="mode-title text-sm font-bold mb-1 text-[var(--text-primary)]">{m.title}</div>
                <div className="mode-desc text-xs text-[var(--text-secondary)] leading-snug">{m.desc}</div>
              </div>
            ))}
          </div>

          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 mt-6">文章・文法モード</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {sentenceModes.map(m => (
              <div 
                key={m.id}
                className={`mode-card ${sessionConfig.mode === m.id ? 'selected' : ''}`}
                style={{ '--mode-color': m.color } as React.CSSProperties}
                onClick={() => setMode(m.id as QuizMode)}
              >
                <span className="mode-icon text-2xl mb-2 block">{m.icon}</span>
                <div className="mode-title text-sm font-bold mb-1 text-[var(--text-primary)]">{m.title}</div>
                <div className="mode-desc text-xs text-[var(--text-secondary)] leading-snug">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar md:col-start-2 md:row-start-2 md:row-span-2 md:sticky md:top-20">
          <div className="settings-panel card p-5 mb-5">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-4">⚙️ 設定</h3>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium">出題数</div>
                <div className="text-xs text-[var(--text-secondary)]">1セッションで出す問題数</div>
              </div>
              <select className="select min-w-[100px]" value={sessionConfig.count} onChange={e => setSessionConfig({...sessionConfig, count: e.target.value})}>
                <option value="10">10問</option>
                <option value="20">20問</option>
                <option value="30">30問</option>
                <option value="50">50問</option>
                <option value="all">全問</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-[var(--border-main)]">
              <div>
                <div className="text-sm font-medium">苦手優先</div>
                <div className="text-xs text-[var(--text-secondary)]">間違えた問題を優先</div>
              </div>
              <div
                className={`toggle ${sessionConfig.weakOnly ? 'on' : ''}`}
                onClick={() => setSessionConfig({...sessionConfig, weakOnly: !sessionConfig.weakOnly})}
              />
            </div>



            {!isSentenceMode && (
              <div className="flex items-center justify-between py-2 border-t border-[var(--border-main)]">
                <div>
                  <div className="text-sm font-medium">範囲 (A〜Z)</div>
                  <div className="text-xs text-[var(--text-secondary)]">ピンイン頭文字</div>
                </div>
                <select className="select min-w-[100px]" value={sessionConfig.range} onChange={e => setSessionConfig({...sessionConfig, range: e.target.value})}>
                  <option value="all">すべて</option>
                  <option value="a-f">A〜F</option>
                  <option value="g-l">G〜L</option>
                  <option value="m-r">M〜R</option>
                  <option value="s-z">S〜Z</option>
                </select>
              </div>
            )}

            {isSentenceMode && (
              <div className="flex items-center justify-between py-2 border-t border-[var(--border-main)]">
                <div>
                  <div className="text-sm font-medium">タグ</div>
                  <div className="text-xs text-[var(--text-secondary)]">課・テーマで絞り込み</div>
                </div>
                <select className="select min-w-[100px]" value={sessionConfig.tag} onChange={e => setSessionConfig({...sessionConfig, tag: e.target.value})}>
                  <option value="all">すべて</option>
                  {SENTENCE_TAGS.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-t border-[var(--border-main)]">
              <div>
                <div className="text-sm font-medium">出題形式</div>
                <div className="text-xs text-[var(--text-secondary)]">問題のヒント</div>
              </div>
              <select className="select min-w-[100px]" value={sessionConfig.promptType} onChange={e => setSessionConfig({...sessionConfig, promptType: e.target.value})}>
                <option value="meaning">日本語</option>
                <option value="pinyin">ピンイン</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary btn-lg w-full" onClick={handleStart}>
            🚀 スタート！
          </button>
        </div>
      </div>
    </section>
  );
}
