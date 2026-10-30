# 学期別ルーティング(2春 / 2秋)Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/` は 2春の教材、`/2fall/` は 2秋の教材を出す。学習記録は学期ごとに分ける。

**Architecture:** 教材データを `getSemesterData(semesterId)` に集約し、`AppProvider` が `semester` を受け取って context 経由で各画面に渡す。`app/page.tsx`(2春)と `app/[semester]/page.tsx`(2秋、`generateStaticParams` + `dynamicParams = false`)が同じ `App` を別の学期で描画する。

**Tech Stack:** Next.js 16.2.7(App Router, `output: "export"`)、React 19、TypeScript 5、Tailwind v4。テスト基盤はなく、検証は `tsc` / `lint` / `build` と Playwright(`require('playwright')` は導入済み)で行う。

**Spec:** `docs/superpowers/specs/2026-10-30-semester-routing-design.md`

## Global Constraints

- `next.config.ts` は変更しない(`output: "export"`、`trailingSlash: true`、`basePath` は `NEXT_PUBLIC_BASE_PATH`)。
- Next 16 では `params` は `Promise`(`await params`)。動的セグメントは `export const dynamicParams = false` とし、`generateStaticParams()` で全パスを列挙する。redirects / rewrites は静的エクスポートで使えない。
- localStorage キー: 2sp は `final_mastery` / `final_stats`(既存のまま)、2fall は `final_mastery_2fall` / `final_stats_2fall`。`final_theme` は学期共通。
- 2春の教材 JSON の内容と、文の `id`(mastery のキー)は変更しない。`hsk_*.json`、`clean_data.py`、`add_sentences.js` には触れない。
- `any` 禁止(`@typescript-eslint/no-explicit-any: "error"`)。`eslint.config.mjs` は変更しない。
- `buildQueue` は純粋関数のまま。`isWeak` は変更しない。
- コミットメッセージの末尾に次の 2 行を付ける:
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` と `Claude-Session: https://claude.ai/code/session_018YQLLoYo9CKU1bow4xYiuY`

## Review Focus

1. 既存の 2春ユーザーの `final_mastery` が、`/` で変更なく読み込まれる(記録が消えない)。→ Task 4
2. `/2fall`(末尾スラッシュなし)で開いても `/2fall/` に解決される。→ Task 4
3. 2秋の保存データに現行教材に存在しない key が混ざっていても、ダッシュボードが落ちない。→ Task 4
4. 片方の学期でテーマを切り替えると、もう片方を開いたときも反映される(`final_theme` 共有)。→ Task 4
5. `NEXT_PUBLIC_BASE_PATH` 付きビルドで、`/2fall/` の assets 参照も basePath 配下を指す。→ Task 3

---

## ファイル構成

| ファイル | 役割 |
|---|---|
| `src/data/2sp/{words,sentences}.json` | 2春の教材(現 `exam_*.json` を移動) |
| `src/data/2fall/{words,sentences}.json` | 2秋の教材(初期はダミー) |
| `src/data/index.ts` | 学期ID・レジストリ・`getSemesterData` |
| `src/context/AppContext.tsx` | `semester` / `data` を提供、保存キーを学期別に |
| `src/lib/buildQueue.ts` | データを引数で受け取る |
| `src/app/App.tsx` | 画面本体(現 `page.tsx` の中身) |
| `src/app/page.tsx` | `/` = 2春 |
| `src/app/[semester]/page.tsx` | `/2fall/` を生成 |

---

### Task 1: データ層を学期対応にする

**Files:**
- Move: `src/data/exam_words.json` → `src/data/2sp/words.json`、`src/data/exam_sentences.json` → `src/data/2sp/sentences.json`(`git mv`、内容不変)
- Create: `src/data/2fall/words.json`、`src/data/2fall/sentences.json`
- Modify: `src/data/index.ts`

**Interfaces:**
- Produces(`src/data/index.ts`):
  - `type SemesterId = "2sp" | "2fall"`
  - `const SEMESTER_IDS: readonly SemesterId[]`、`const DEFAULT_SEMESTER: SemesterId`(`"2sp"`)
  - `function isSemesterId(s: string): s is SemesterId`
  - `type SemesterData = { words: WordItem[]; sentences: SentenceItem[]; sentenceTags: string[]; itemByKey: Record<string, QuizItem> }`
  - `function getSemesterData(id: SemesterId): SemesterData`(学期ごとにキャッシュし、変換は 1 回のみ)
  - **一時的に**従来の `words` / `sentences` / `SENTENCE_TAGS` / `itemByKey` を `getSemesterData(DEFAULT_SEMESTER)` から再エクスポートする(Task 2 で削除)。

- [ ] **Step 1: ベースラインを確認する**
  Run: `npm ci && npx tsc --noEmit && npm run lint && npm run build`
  Expected: すべて成功。lint に既存の警告があれば件数を控える(後続タスクで増やさない)。

- [ ] **Step 2: JSON を移動・作成する**
  `git mv` で 2春の 2 ファイルを `src/data/2sp/` へ。2秋のダミーを作る: 単語 8 語以上(`{ 漢字: { pinyin, display_pinyin, meaning } }` 形式、`meaning` は `【ダミー】` で始める)、例文は rearrange 2 件 + fillin 2 件(`id` は `2f-r1`、`2f-r2`、`2f-f1`、`2f-f2`、`tags: ["第1課"]`)。fillin は `sentence` に `___` をちょうど 1 つ含み、`options` に `answer` を含めること(`isValidSentence` を通る形)。

- [ ] **Step 3: `src/data/index.ts` を実装する**
  上記 Interfaces の関数群を実装する。単語変換(`display_pinyin || pinyin`)と `isValidSentence` は現行のものを流用し、開発時の破棄警告にも学期 ID を含める。

- [ ] **Step 4: 検証する**
  Run: `git add -A src/data && git diff --cached -M --summary`
  Expected: `exam_words.json → 2sp/words.json` と `exam_sentences.json → 2sp/sentences.json` が `rename ... (100%)` と表示される。
  Run: `npx tsc --noEmit && npm run lint && npm run build`
  Expected: すべて成功(ベースラインと同じ警告数)。

- [ ] **Step 5: Commit**
  `git add -A src/data && git commit -m "feat(data): add per-semester data layer with 2fall placeholder"`(末尾に Global Constraints のトレーラーを付ける)

---

### Task 2: context と各画面を学期対応にし、画面本体を `App` に切り出す

**Files:**
- Modify: `src/context/AppContext.tsx`、`src/lib/buildQueue.ts`、`src/components/screens/Home.tsx`、`src/components/screens/Quiz.tsx`、`src/components/screens/Dashboard.tsx`、`src/data/index.ts`、`src/app/page.tsx`、`src/app/layout.tsx`
- Create: `src/app/App.tsx`

**Interfaces:**
- Consumes: Task 1 の `SemesterId` / `SemesterData` / `getSemesterData`。
- Produces:
  - `AppProvider: React.FC<{ semester: SemesterId; children: React.ReactNode }>`
  - `AppContextType` に `semester: SemesterId` と `data: SemesterData` を追加
  - `buildQueue(config: SessionConfig, mastery: Record<string, MasteryData>, data: Pick<SemesterData, "words" | "sentences">): QuizItem[]`
  - `export default function App(): JSX.Element`(`src/app/App.tsx`、`"use client"`、現 `page.tsx` と同じ内容)

- [ ] **Step 1: `AppContext.tsx` を学期対応にする**
  保存キーは内部ヘルパー `storageKey(base: "final_mastery" | "final_stats", semester: SemesterId): string` に集約する(`semester === "2sp"` ならサフィックスなし、それ以外は `` `${base}_${semester}` ``)。mastery / stats の読み込み・保存・`resetData` のすべてでこれを使う。`final_theme` は現状どおり。`data` は `getSemesterData(semester)` から取得する。

- [ ] **Step 2: `buildQueue` と画面を `data` 参照に切り替える**
  `buildQueue` はモジュール import をやめ、引数 `data` の `words` / `sentences` を使う。`Home.tsx` は `SENTENCE_TAGS` → `data.sentenceTags`、`Quiz.tsx` は `wordsData` → `data.words`(該当 `useMemo` の依存配列に追加)と `buildQueue(sessionConfig, mastery, data)`、`Dashboard.tsx` は `itemByKey` → `data.itemByKey`。

- [ ] **Step 3: `App.tsx` を切り出して `page.tsx` と `layout.tsx` を組み替える**
  `page.tsx` の中身を `App.tsx` へ移す。`page.tsx` は `<AppProvider semester="2sp"><App /></AppProvider>` を返す。`layout.tsx` から `AppProvider` を外し、`<html>` / フォント / body のみにする。

- [ ] **Step 4: 一時的な再エクスポートを削除する**
  `src/data/index.ts` から `words` / `sentences` / `SENTENCE_TAGS` / `itemByKey` の再エクスポートを消す。
  Run: `grep -rn "SENTENCE_TAGS\|wordsData\|itemByKey" src`
  Expected: ヒットは `src/data/index.ts`(`SemesterData` 内の名前)と `data.itemByKey` 等の context 参照のみ。モジュール import は残っていない。

- [ ] **Step 5: 検証する**
  Run: `npx tsc --noEmit && npm run lint && npm run build`
  Expected: すべて成功。`out/index.html` が生成される。

- [ ] **Step 6: Commit**
  `git add -A src && git commit -m "refactor: pass semester data through AppContext and split App from page"`

---

### Task 3: `/2fall/` ルートを追加する

**Files:**
- Create: `src/app/[semester]/page.tsx`

**Interfaces:**
- Consumes: `SEMESTER_IDS`、`DEFAULT_SEMESTER`、`isSemesterId`(Task 1)、`AppProvider`(Task 2)、`App`(Task 2)。
- Produces: `generateStaticParams(): { semester: SemesterId }[]`(`DEFAULT_SEMESTER` 以外を返す)、`dynamicParams = false`、`default async function Page({ params }: { params: Promise<{ semester: string }> })`(Server Component。`isSemesterId` を満たさなければ `notFound()`)。

- [ ] **Step 1: ページを実装する**
  上記の Produces どおりに実装する。`"use client"` は付けず、クライアントコンポーネントの `AppProvider` と `App` を子に置く。

- [ ] **Step 2: 通常ビルドを検証する**
  Run: `npm run build && ls out/index.html out/2fall/index.html && ls out | grep -c '^2sp$'`
  Expected: 両 HTML が存在し、`out/2sp` は存在しない(最後の出力は `0`)。

- [ ] **Step 3: basePath 付きビルドを検証する(Review Focus 5)**
  Run: `NEXT_PUBLIC_BASE_PATH=/chinese_practice_2sp npm run build && grep -c "/chinese_practice_2sp/_next" out/2fall/index.html`
  Expected: ビルド成功、出力は `1` 以上。

- [ ] **Step 4: Commit**
  `git add src/app && git commit -m "feat: add /2fall/ route via [semester] segment"`

---

### Task 4: 結合検証(Playwright)

**Files:**
- なし(コミット対象外)。リポジトリ外に使い捨てスクリプト(例: `/tmp/verify-semesters.mjs`)を置く。不具合が出たら、該当タスクのファイルを直して再実行し、修正だけをコミットする。

**Interfaces:**
- Consumes: Task 3 までの成果物。`npm run build`(basePath なし)の `out/` を `python3 -m http.server -d out 8080` で配信して確認する。

- [ ] **Step 1: 検証スクリプトを書いて実行する**
  各項目で `pageerror` が 0 件であること、および次を `assert` する。Home の UI セレクタは `Home.tsx` を読んで決める。
  - **(Review Focus 1)** `addInitScript` で `final_mastery` に `{"故宫":{"total":2,"correct":2,"interval":1,"easeFactor":2.5,"nextReviewDate":"2000-01-01T00:00:00.000Z"}}` を入れて `/` を開く。ダッシュボードに `故宫` が表示され、`final_mastery` の値は操作後も入れた値と同一。
  - 同じ初期データで `/2fall/` を開く。ダッシュボードに `故宫` が出ず、`final_mastery_2fall` はまだ存在しない。
  - `/2fall/` でピンイン入力モードを 1 問回答する。`final_mastery_2fall` に 1 件のキーが入り、`final_mastery` は変わらない。出題される単語はダミー教材のもの。
  - `/2fall/` でリセットしても `final_mastery` / `final_stats` は残る。`/` でリセットすると `final_mastery` は消え、`final_mastery_2fall` は残る。
  - **(Review Focus 2)** `/2fall`(スラッシュなし)にアクセスして、最終的に `/2fall/` でアプリが描画される。`/unknown/` は HTTP 404。
  - **(Review Focus 3)** `final_mastery_2fall` に存在しない key(例: `"zzz"`)を入れて `/2fall/` のダッシュボードを開く。例外なく描画される。
  - **(Review Focus 4)** `/` でテーマを切り替え、続けて `/2fall/` を開く。`<html data-theme>` が同じ値。
  - `/` で単語 8 モード(pinyin / meaning / hanzi / tones / listening / vocab_full / flashcard / time_attack)と文章 2 モード(rearrange / fillin)を順に開始し、最初の問題が描画される。

  Expected: すべて pass、`pageerror` 0 件。

- [ ] **Step 2: 失敗があれば修正する**
  原因のタスクのファイルを直し、`npx tsc --noEmit && npm run lint && npm run build` を通してから Step 1 を再実行する。修正があればコミットする(メッセージは `fix: ...`)。

---

### Task 5: ドキュメントを更新する

**Files:**
- Modify: `CODEBASE.md`、`README.md`

- [ ] **Step 1: `CODEBASE.md` を新構造に合わせる**
  ディレクトリ構成(`data/2sp/`、`data/2fall/`、`app/App.tsx`、`app/[semester]/page.tsx`)、データ層(`getSemesterData`)、`AppContext`(`semester` / `data`、`buildQueue` の新シグネチャ)、localStorage キー表(実態の `final_*` と学期別サフィックス)、「データを変更する場合」(学期ごとの JSON パスと、新学期の追加手順: データフォルダ追加 + レジストリ 1 行)を更新する。`hsk_*` や `hsk_mastery` と書かれた古い記述は実態に直す。

- [ ] **Step 2: `README.md` に学期別 URL を追記する**
  `/` = 2春、`/2fall/` = 2秋であることと、2秋教材の差し替え方法(`src/data/2fall/` の 2 ファイルを置き換える)を書く。

- [ ] **Step 3: 最終確認とコミット**
  Run: `npx tsc --noEmit && npm run lint && npm run build`
  Expected: すべて成功。
  `git add CODEBASE.md README.md && git commit -m "docs: document semester routing and per-semester data"`

---

## 完了後

実データを受領したら、`src/data/2fall/words.json` と `sentences.json` を置き換える(`id` は一意にし、変更しない)。置き換え後は Task 4 の 2fall 関連項目を再実行する。
