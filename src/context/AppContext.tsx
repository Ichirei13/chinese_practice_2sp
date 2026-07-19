"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { QuizItem, SessionConfig, SessionResult, MasteryData } from "@/data/types";

export type ScreenType = "home" | "quiz" | "result" | "dashboard";

export interface AppStats {
  sessions: number;
  correct: number;
  total: number;
  lastDate: string;
  streak: number;
}

// Re-export so callers can import from a single place
export type { MasteryData, SessionConfig, SessionResult };

interface AppContextType {
  screen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  stats: AppStats;
  updateStats: (newStats: Partial<AppStats>) => void;
  mastery: Record<string, MasteryData>;
  updateMastery: (id: string, isCorrect: boolean) => void;
  resetData: () => void;
  sessionResult: SessionResult | null;
  setSessionResult: (res: SessionResult | null) => void;
  sessionConfig: SessionConfig;
  setSessionConfig: (config: SessionConfig) => void;
  /** When set, the next quiz session replays exactly these items (retry wrong). */
  retryQueue: QuizItem[] | null;
  setRetryQueue: (items: QuizItem[] | null) => void;
}

const defaultStats: AppStats = { sessions: 0, correct: 0, total: 0, lastDate: "", streak: 0 };

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<ScreenType>("home");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [stats, setStats] = useState<AppStats>(defaultStats);
  const [mastery, setMastery] = useState<Record<string, MasteryData>>({});
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [retryQueue, setRetryQueue] = useState<QuizItem[] | null>(null);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    mode: "pinyin", count: "20", weakOnly: false, reviewMode: false, range: "all", tag: "all", promptType: "meaning"
  });

  useEffect(() => {
    // Load from local storage
    const storedTheme = localStorage.getItem("final_theme") as "dark" | "light";
    if (storedTheme) setTheme(storedTheme);

    const storedStats = localStorage.getItem("final_stats");
    if (storedStats) {
      try {
        const pStats = JSON.parse(storedStats);
        // check streak
        const today = new Date().toDateString();
        if (pStats.lastDate) {
          const diff = Math.floor((new Date(today).getTime() - new Date(pStats.lastDate).getTime()) / (1000 * 60 * 60 * 24));
          if (diff > 1) pStats.streak = 0;
        }
        setStats(pStats);
      } catch {}
    }

    const storedMastery = localStorage.getItem("final_mastery");
    if (storedMastery) {
      try {
        setMastery(JSON.parse(storedMastery));
      } catch {}
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("final_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => (t === "dark" ? "light" : "dark"));
  };

  const updateStats = (newStats: Partial<AppStats>) => {
    setStats(prev => {
      const updated = { ...prev, ...newStats };
      localStorage.setItem("final_stats", JSON.stringify(updated));
      return updated;
    });
  };

  // Store only id + score + SRS state. The item itself is resolved from current
  // data at display time (see data/index.ts `itemByKey`), so fixes to the word
  // list or sentences immediately reach already-studied users.
  const updateMastery = (id: string, isCorrect: boolean) => {
    setMastery(prev => {
      const existing = prev[id] || { correct: 0, total: 0 };

      let interval = existing.interval || 0;
      let easeFactor = existing.easeFactor || 2.5;

      if (isCorrect) {
        if (interval === 0) {
          interval = 1;
        } else if (interval === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
      } else {
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.8);
      }

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + interval);
      const nextReviewDate = nextDate.toISOString();

      const updated: Record<string, MasteryData> = {
        ...prev,
        [id]: {
          total: existing.total + 1,
          correct: existing.correct + (isCorrect ? 1 : 0),
          interval,
          easeFactor,
          nextReviewDate,
        },
      };
      localStorage.setItem("final_mastery", JSON.stringify(updated));
      return updated;
    });
  };

  const resetData = () => {
    setStats(defaultStats);
    setMastery({});
    localStorage.removeItem("final_stats");
    localStorage.removeItem("final_mastery");
  };

  return (
    <AppContext.Provider value={{
      screen, setScreen, theme, toggleTheme,
      stats, updateStats, mastery, updateMastery, resetData,
      sessionResult, setSessionResult, sessionConfig, setSessionConfig,
      retryQueue, setRetryQueue
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
