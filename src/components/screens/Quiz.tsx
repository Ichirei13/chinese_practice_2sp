"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { words as wordsData } from "@/data";
import type { QuizItem, WordItem } from "@/data/types";
import { generateToneDistractors } from "@/utils/tones";
import { shuffle } from "@/utils/shuffle";
import { buildQueue } from "@/lib/buildQueue";
import Flashcard from "@/components/quiz/Flashcard";
import WordCard from "@/components/quiz/WordCard";
import PinyinInput from "@/components/quiz/PinyinInput";
import VocabFullInput from "@/components/quiz/VocabFullInput";
import MultipleChoice from "@/components/quiz/MultipleChoice";
import Rearrange from "@/components/quiz/Rearrange";
import Fillin from "@/components/quiz/Fillin";
import { AlertDialog } from "@/components/ui/Modal";

const normalizePinyin = (p: string) =>
  p.toLowerCase().replace(/[\s'’]+/g, "").trim();

const TIME_ATTACK_SECS = 60;

// ── Type helpers ──────────────────────────────────────────────────────────────
const isWordItem = (item: QuizItem): item is WordItem => item.type === "word";
/** Key used to index mastery: sentence items use `.id`, word items use `.hanzi` */
const getItemId = (item: QuizItem): string => isWordItem(item) ? item.hanzi : item.id;

export default function Quiz() {
  const { setScreen, sessionConfig, setSessionConfig, mastery, updateMastery, setSessionResult, updateStats, stats, retryQueue, setRetryQueue } = useAppContext();

  // ── All hooks declared unconditionally at the top ──────────────────────────
  const [queue, setQueue] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState<{ item: QuizItem }[]>([]);
  const [startTime] = useState(Date.now());
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [inputValHanzi, setInputValHanzi] = useState("");
  const [chineseVoice, setChineseVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  // タイマーの総時間（time_attack=60秒）。プログレスバー計算に使う
  const [timerTotal, setTimerTotal] = useState(60);
  const [rearrangeBank, setRearrangeBank] = useState<{ id: number; text: string }[]>([]);
  const [rearrangeZone, setRearrangeZone] = useState<{ id: number; text: string }[]>([]);
  const [fillinSelected, setFillinSelected] = useState<string | null>(null);
  // Flashcard state — must be here, NOT after any conditional return
  const [showFlashcardAns, setShowFlashcardAns] = useState(false);
  // わからない state
  const [dontKnowSelected, setDontKnowSelected] = useState(false);
  // Empty queue notification state
  const [showEmptyAlert, setShowEmptyAlert] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  // Live tallies that don't suffer from stale-closure reads when endSession is
  // called synchronously right after submitAnswer (flashcard / time_attack).
  const correctRef = useRef(0);
  const mistakesRef = useRef<{ item: QuizItem }[]>([]);
  const endedRef = useRef(false);
  const taTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Init: load voices + build question queue
  useEffect(() => {
    const speechAvailable = typeof window !== "undefined" && "speechSynthesis" in window;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(
        v => v.lang.includes("zh") || v.name.includes("Chinese") || v.name.includes("Ting-Ting")
      );
      if (voice) setChineseVoice(voice);
    };
    if (speechAvailable) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // "間違いだけ再挑戦" replays this exact set instead of rebuilding a queue.
    if (retryQueue && retryQueue.length > 0) {
      setQueue(retryQueue);
      setRetryQueue(null);
    } else {
      const q = buildQueue(sessionConfig, mastery);
      if (q.length === 0) {
        setShowEmptyAlert(true);
      } else {
        setQueue(q);
      }
    }

    return () => {
      if (speechAvailable) window.speechSynthesis.onvoiceschanged = null;
      if (taTimeoutRef.current) clearTimeout(taTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer — Time Attack (60s) で共用
  useEffect(() => {
    if ((sessionConfig.mode !== "time_attack") || queue.length === 0) return;
    if (timeLeft <= 0) { endSession(); return; }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, sessionConfig.mode, queue.length]);

  // Reset flashcard answer state on new question
  useEffect(() => {
    setShowFlashcardAns(false);
  }, [currentIndex]);

  // Setup rearrange word bank on new question
  const currentItem = queue[currentIndex];
  useEffect(() => {
    if (currentItem?.type === "rearrange" && !isAnswered) {
      setRearrangeBank(
        shuffle(currentItem.words.map((w: string, i: number) => ({ id: i, text: w })))
      );
      setRearrangeZone([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem]);

  // Focus input & auto-play audio on new question
  useEffect(() => {
    if (inputRef.current && !isAnswered && ["pinyin", "listening", "vocab_full"].includes(sessionConfig.mode)) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (sessionConfig.mode === "listening" && currentItem && isWordItem(currentItem) && !isAnswered) {
      playAudio(currentItem.hanzi);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isAnswered, sessionConfig.mode, currentItem]);

  // Multiple choice options (memoized) — MC modes only ever show word items
  const choices = useMemo((): WordItem[] => {
    if (!currentItem || !["meaning", "hanzi", "time_attack", "tones"].includes(sessionConfig.mode)) return [];
    if (!isWordItem(currentItem)) return [];

    if (sessionConfig.mode === "tones") {
      // Build fake WordItems with different tones for the distractors choices.
      // currentItem.pinyin already holds the display pinyin (e.g. "guǒrán").
      const distractors = generateToneDistractors(currentItem.pinyin);
      const fakeChoices: WordItem[] = distractors.map((d, i) => ({
        hanzi: "fake_" + i,
        pinyin: d,         // use pinyin for both storage and display in tones mode
        meaning: currentItem.meaning,
        type: "word" as const,
      }));
      return shuffle([currentItem, ...fakeChoices]);
    }

    // In meaning mode, also exclude distractors that share the correct meaning,
    // otherwise two "correct" answers can appear (synonym words in the data).
    const pool = shuffle(
      wordsData.filter(w =>
        w.hanzi !== currentItem.hanzi &&
        (sessionConfig.mode !== "meaning" || w.meaning !== currentItem.meaning)
      )
    ).slice(0, 3);
    return shuffle([currentItem, ...pool]);
  }, [currentItem, sessionConfig.mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setScreen("home");
      if (isAnswered && e.key === "Enter") nextQuestion();
      if (!isAnswered && choices.length === 4) {
        if (e.key.toLowerCase() === "a") handleChoice(0);
        if (e.key.toLowerCase() === "b") handleChoice(1);
        if (e.key.toLowerCase() === "c") handleChoice(2);
        if (e.key.toLowerCase() === "d") handleChoice(3);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswered, choices]);

  // ── Early return AFTER all hooks ──────────────────────────────────────────
  if (queue.length === 0) {
    return (
      <>
        <div className="p-10 text-center text-[var(--text-secondary)]">読み込み中…</div>
        {showEmptyAlert && (
          <AlertDialog
            message="条件に一致する問題がありません。設定を変えてお試しください。"
            okLabel="ホームへ戻る"
            onClose={() => {
              setShowEmptyAlert(false);
              setSessionConfig({ ...sessionConfig, reviewMode: false, weakOnly: false });
              setScreen("home");
            }}
          />
        )}
      </>
    );
  }

  // ── Helper functions ───────────────────────────────────────────────────────

  const playAudio = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    if (chineseVoice) utter.voice = chineseVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const endSession = () => {
    if (endedRef.current) return; // guard against double-invocation (timer race)
    endedRef.current = true;

    const timeSec = Math.floor((Date.now() - startTime) / 1000);
    const correct = correctRef.current;
    const total = queue.length;

    // Persist aggregate stats + learning streak (both were never updated before).
    const today = new Date().toDateString();
    let streak = stats.streak;
    if (stats.lastDate !== today) {
      const diff = stats.lastDate
        ? Math.floor((new Date(today).getTime() - new Date(stats.lastDate).getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;
      streak = diff === 1 ? stats.streak + 1 : 1;
    }
    updateStats({
      sessions: stats.sessions + 1,
      correct: stats.correct + correct,
      total: stats.total + total,
      lastDate: today,
      streak,
    });

    setSessionResult({
      correct,
      total,
      time: timeSec,
      mistakes: mistakesRef.current,
    });
    setScreen("result");
  };

  const submitAnswer = (isCorrect: boolean, correctText: string) => {
    if (isAnswered) return;
    setIsAnswered(true);
    if (isCorrect) {
      correctRef.current += 1;
      setFeedback({ isCorrect: true, text: "✅ 正解！" });
      if (currentItem.type === "word") playAudio(currentItem.hanzi);
    } else {
      mistakesRef.current = [...mistakesRef.current, { item: currentItem }];
      setSessionMistakes(prev => [...prev, { item: currentItem }]);
      setFeedback({ isCorrect: false, text: `❌ 不正解: ${correctText}` });
    }
    updateMastery(getItemId(currentItem), isCorrect);
    if (sessionConfig.mode === "time_attack") {
      taTimeoutRef.current = setTimeout(nextQuestion, 500);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= queue.length) {
      endSession();
    } else {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setFeedback(null);
      setInputVal("");
      setInputValHanzi("");
      setFillinSelected(null);
      setDontKnowSelected(false);
    }
  };

  const skipQuestion = () => {
    if (!currentItem) return;
    const fallback = isWordItem(currentItem) ? currentItem.pinyin : currentItem.answer;
    submitAnswer(false, fallback);
  };

  // わからない: counts as wrong, reveals the correct answer
  const handleDontKnow = () => {
    if (isAnswered || !currentItem) return;
    setDontKnowSelected(true);
    let correctText: string;
    if (isWordItem(currentItem)) {
      if (["meaning", "time_attack"].includes(sessionConfig.mode)) correctText = currentItem.meaning;
      else if (sessionConfig.mode === "tones") correctText = currentItem.pinyin;
      else correctText = currentItem.hanzi;
    } else {
      correctText = currentItem.answer;
    }
    submitAnswer(false, correctText);
  };

  const handlePinyinSubmit = () => {
    if (isAnswered || !currentItem || !isWordItem(currentItem)) return;
    submitAnswer(normalizePinyin(inputVal) === normalizePinyin(currentItem.pinyin), currentItem.pinyin);
  };

  const handleVocabFullSubmit = () => {
    if (isAnswered || !currentItem || !isWordItem(currentItem)) return;
    const pOk = sessionConfig.promptType === "pinyin" ? true : normalizePinyin(inputVal) === normalizePinyin(currentItem.pinyin);
    const hOk = inputValHanzi.trim() === currentItem.hanzi;
    submitAnswer(pOk && hOk, `${currentItem.hanzi} (${currentItem.pinyin})`);
  };

  const handleChoice = (idx: number) => {
    if (isAnswered || !choices[idx] || !currentItem || !isWordItem(currentItem)) return;
    const isCorrect = choices[idx].hanzi === currentItem.hanzi;
    const correctText =
      ["meaning", "time_attack"].includes(sessionConfig.mode) ? currentItem.meaning
      : sessionConfig.mode === "tones" ? currentItem.pinyin
      : currentItem.hanzi;
    submitAnswer(isCorrect, correctText);
  };

  const handleRearrangeSubmit = () => {
    if (isAnswered || !currentItem || currentItem.type !== "rearrange") return;
    const strip = (t: string) => t.replace(/[\s，。？！、：；,.?!…]/g, "");
    const userAns = strip(rearrangeZone.map(c => c.text).join(""));
    // Accept the canonical answer plus any listed alternative word orders.
    const accepted = [currentItem.answer, ...(currentItem.accept ?? [])].map(strip);
    submitAnswer(accepted.includes(userAns), currentItem.answer);
  };

  const handleFillin = (word: string) => {
    if (isAnswered || !currentItem || currentItem.type !== "fillin") return;
    setFillinSelected(word);
    submitAnswer(word === currentItem.answer, currentItem.answer);
  };

  const moveRearrange = (id: number, to: "zone" | "bank") => {
    if (isAnswered) return;
    if (to === "zone") {
      const item = rearrangeBank.find(b => b.id === id);
      if (item) {
        setRearrangeZone([...rearrangeZone, item]);
        setRearrangeBank(rearrangeBank.filter(b => b.id !== id));
      }
    } else {
      const item = rearrangeZone.find(b => b.id === id);
      if (item) {
        setRearrangeBank([...rearrangeBank, item]);
        setRearrangeZone(rearrangeZone.filter(b => b.id !== id));
      }
    }
  };

  // ── Flashcard Mode Render ─────────────────────────────────────────────────
  if (sessionConfig.mode === "flashcard") {
    if (!currentItem || !isWordItem(currentItem)) return null;
    return (
      <Flashcard
        item={currentItem}
        currentIndex={currentIndex}
        queueLength={queue.length}
        showAnswer={showFlashcardAns}
        onShowAnswer={() => setShowFlashcardAns(true)}
        onResult={correct => { submitAnswer(correct, ""); nextQuestion(); }}
        onExit={() => setScreen("home")}
        playAudio={playAudio}
      />
    );
  }

  // ── Standard Mode Render ──────────────────────────────────────────────────
  const effectiveMode = sessionConfig.mode;
  const isMCMode = ["meaning", "hanzi", "time_attack", "tones"].includes(effectiveMode);
  const showTimer = sessionConfig.mode === "time_attack";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl animate-[fadeIn_0.3s_ease]">
      {/* Header bar */}
      <div className="flex items-center gap-4 mb-2">
        <button className="btn btn-ghost btn-sm" onClick={() => setScreen("home")}>← 終了</button>
        <div className="flex-1 progress-bar">
          <div className="progress-fill" style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / queue.length) * 100}%` }} />
        </div>
        <div className="text-sm font-bold text-[var(--text-secondary)]">{currentIndex + 1} / {queue.length}</div>
      </div>

      {showTimer ? (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1 font-bold">
            <span className={timeLeft <= 10 ? "text-[var(--red)] animate-pulse" : "text-[var(--yellow)]"}>
              ⏱️ 残り時間: {`${timeLeft}秒`}
            </span>
          </div>
          <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? "bg-[var(--red)]" : "bg-[var(--yellow)]"}`}
              style={{ width: `${(timeLeft / timerTotal) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6" />
      )}

      {/* Word / Question card */}
      <WordCard
        currentItem={currentItem}
        mode={effectiveMode}
        promptType={sessionConfig.promptType}
        isAnswered={isAnswered}
        fillinSelected={fillinSelected}
        playAudio={playAudio}
      />

      {/* Pinyin input */}
      {["pinyin", "listening"].includes(effectiveMode) && (
        <PinyinInput
          inputRef={inputRef}
          value={inputVal}
          onChange={setInputVal}
          onSubmit={handlePinyinSubmit}
          onDontKnow={handleDontKnow}
          isAnswered={isAnswered}
          isCorrect={feedback ? feedback.isCorrect : null}
        />
      )}

      {/* Full vocab input */}
      {sessionConfig.mode === "vocab_full" && isWordItem(currentItem) && (
        <VocabFullInput
          inputRef={inputRef}
          pinyinValue={inputVal}
          hanziValue={inputValHanzi}
          onPinyinChange={setInputVal}
          onHanziChange={setInputValHanzi}
          onSubmit={handleVocabFullSubmit}
          onDontKnow={handleDontKnow}
          isAnswered={isAnswered}
          currentItem={currentItem}
          promptType={sessionConfig.promptType}
        />
      )}

      {/* Multiple choice */}
      {isMCMode && isWordItem(currentItem) && (
        <MultipleChoice
          choices={choices}
          currentItem={currentItem}
          mode={sessionConfig.mode}
          isAnswered={isAnswered}
          dontKnowSelected={dontKnowSelected}
          onChoice={handleChoice}
          onDontKnow={handleDontKnow}
        />
      )}

      {/* Rearrange */}
      {effectiveMode === "rearrange" && (
        <Rearrange
          zone={rearrangeZone}
          bank={rearrangeBank}
          isAnswered={isAnswered}
          onMove={moveRearrange}
          onSubmit={handleRearrangeSubmit}
        />
      )}

      {/* Fill-in options */}
      {effectiveMode === "fillin" && !isAnswered && currentItem.type === "fillin" && (
        <Fillin options={currentItem.options} onSelect={handleFillin} />
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`text-center font-bold mt-4 text-lg animate-[fadeIn_0.3s_ease] ${
            feedback.isCorrect ? "text-[var(--green)]" : "text-[var(--red)]"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-8">
        <div className="text-xs text-[var(--text-secondary)]">❌ {sessionMistakes.length} ミス</div>
        {isAnswered ? (
          <button className="btn btn-primary" onClick={nextQuestion}>
            次へ → (Enter)
          </button>
        ) : (
          !isMCMode && (
            <button className="btn btn-secondary btn-sm" onClick={skipQuestion}>
              スキップ
            </button>
          )
        )}
      </div>
    </div>
  );
}
