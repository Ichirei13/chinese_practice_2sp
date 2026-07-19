"use client";

import { useAppContext } from "@/context/AppContext";

export default function Nav() {
  const { setScreen, toggleTheme, theme } = useAppContext();

  return (
    <nav className="nav flex items-center justify-between px-4 md:px-7 py-4 border-b border-[var(--border-main)] backdrop-blur-md sticky top-0 z-50 bg-[rgba(13,15,20,0.85)] data-[theme=light]:bg-[rgba(240,242,248,0.85)]">
      <div className="nav-logo text-lg font-bold flex items-center gap-2">
        <span className="text-[var(--accent)]">汉</span> 期末試験対策
      </div>
      <div className="nav-actions flex items-center gap-2">
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={() => setScreen("dashboard")} 
          title="ダッシュボード"
        >
          📊
        </button>
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={() => setScreen("home")} 
          title="ホームへ"
        >
          🏠
        </button>
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={toggleTheme} 
          title="テーマ切替"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
