# 期末試験対策 — コードベースガイド

AIが改修・機能追加を行う際に参照するドキュメント。
設計上の意図・型の使い方・変更時の注意点を網羅する。

---

## プロジェクト概要

中国語の試験対策アプリ。単語と例文を、8種類の単語クイズ + 2種類の文章クイズで練習できる。SRS（間隔反復）で効率的な復習をサポートする。

教材は**学期ごと**に分かれている。`/` が 2年春（`2sp`）、`/2fall/` が 2年秋（`2fall`）。学期が違えば教材も学習記録（localStorage）も別。

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16.2.7 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| 言語 | TypeScript 5 |
| データ永続化 | localStorage のみ（サーバーなし） |
| フォント | Inter (UI), Noto Sans SC (漢字) |

---

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx          # HTML ルート・フォント設定のみ（AppProvider は各ページ側でマウント）
│   ├── App.tsx             # screen state で4画面を切り替えるルーター（学期に依存しない）
│   ├── page.tsx            # `/` = 2春: <AppProvider semester="2sp"><App/>
│   ├── [semester]/page.tsx # `/2fall/` 等: generateStaticParams で DEFAULT 以外の学期を静的生成（dynamicParams=false）
│   └── globals.css         # CSS変数・Tailwind・カスタムクラス定義
│
├── data/
│   ├── types.ts            # 【唯一の型定義場所】WordItem / SentenceItem / QuizItem 等
│   ├── index.ts            # 学期レジストリ（SEMESTER_IDS）と getSemesterData(id)。学期ごとに1回だけ変換・キャッシュ
│   ├── 2sp/                # 2年春の教材（words.json / sentences.json）
│   ├── 2fall/              # 2年秋の教材（words.json / sentences.json。第7〜9課: 単語145・並べ替え45・穴埋め48）
│   └── hsk_*.json          # 旧資産（未使用。clean_data.py / add_sentences.js が参照）
│
├── context/
│   └── AppContext.tsx       # グローバル状態（semester, data, screen, theme, stats, mastery, sessionConfig）
│
├── lib/
│   └── buildQueue.ts       # 純粋関数。出題キュー構築ロジック（テスト可能）
│
├── utils/
│   ├── shuffle.ts          # Fisher-Yates シャッフル shuffle<T>(arr): T[]
│   └── tones.ts            # 四声ディストラクタ生成（Math.random() 使用・意図的）
│
└── components/
    ├── Nav.tsx              # ナビゲーションバー（ダッシュボード・ホーム・テーマ切替）
    │
    ├── screens/             # 4つのメイン画面（page.tsx から screen 値で切り替え）
    │   ├── Home.tsx         # モード選択・設定パネル・クイックアクション
    │   ├── Quiz.tsx         # クイズオーケストレーター（state管理・ハンドラー）
    │   ├── Result.tsx       # セッション結果・間違い一覧
    │   └── Dashboard.tsx    # SRS グラフ・習得率一覧・リセット
    │
    ├── quiz/                # Quiz.tsx が使うモード別 UI（純表示コンポーネント）
    │   ├── Flashcard.tsx    # フラッシュカードモード専用レンダー
    │   ├── WordCard.tsx     # 単語カード（word / fillin 両対応）
    │   ├── PinyinInput.tsx  # ピンイン入力（pinyin / listening モード）
    │   ├── VocabFullInput.tsx # ピンイン＋漢字の2入力（vocab_full モード）
    │   ├── MultipleChoice.tsx # 4択グリッド＋わからないボタン
    │   ├── Rearrange.tsx    # 並び替えゾーン＋単語バンク
    │   └── Fillin.tsx       # 穴埋め選択肢ボタン群
    │
    └── ui/
        └── Modal.tsx        # ConfirmDialog / AlertDialog（overlay・ESCで閉じる）
```

---

## データモデル（`src/data/types.ts`）

### 判別可能ユニオン

```ts
type WordItem     = { type: "word";      hanzi; pinyin; meaning }
type RearrangeItem = { type: "rearrange"; id; tags; words[]; answer; meaning }
type FillinItem   = { type: "fillin";    id; tags; sentence; options[]; answer; meaning }

type SentenceItem = RearrangeItem | FillinItem
type QuizItem     = WordItem | SentenceItem
```

**型ガードのパターン（Quiz.tsx・子コンポーネントで使用）:**
```ts
const isWordItem = (item: QuizItem): item is WordItem => item.type === "word"

// 絞り込みの例
if (isWordItem(item)) { item.hanzi }           // WordItem 確定
if (item.type === "fillin") { item.sentence }  // FillinItem 確定
if (item.type === "rearrange") { item.words }  // RearrangeItem 確定
```

**masteryのキー:**
- WordItem → `item.hanzi`（例: `"学习"`）
- SentenceItem → `item.id`（例: `"r-001"`）

### JSON フォーマット

**`src/data/<学期>/words.json`:**
```json
{ "学习": { "pinyin": "xue2xi2", "display_pinyin": "xuéxí", "meaning": "学習する" }, ... }
```
`index.ts` で変換時に `display_pinyin || pinyin` を `WordItem.pinyin` に使用。

**`src/data/<学期>/sentences.json`:**
```json
[
  { "id": "r-001", "type": "rearrange", "tags": ["第1課"], "words": ["我","喜欢","学习"], "answer": "我喜欢学习", "meaning": "..." },
  { "id": "f-001", "type": "fillin",    "tags": ["第1課"], "sentence": "我___学习", "options": ["喜欢","讨厌"], "answer": "喜欢", "meaning": "..." }
]
```

---

## クイズモード一覧

### 単語モード（WordItem のみ使用）

| mode | 概要 | 入力形式 |
|------|------|----------|
| `pinyin` | 漢字を見てピンイン入力 | テキスト入力 |
| `meaning` | 意味を4択 | MultipleChoice |
| `hanzi` | 正しい漢字を4択 | MultipleChoice |
| `tones` | 正しい声調（トーン）を4択 | MultipleChoice |
| `listening` | 音声を聞いてピンイン入力 | テキスト入力 |
| `vocab_full` | ピンイン＋漢字を両方入力 | 2つのテキスト入力 |
| `flashcard` | タップで答えを表示、覚えた/もう一度 | Flashcard（専用レンダー） |
| `time_attack` | 60秒タイマー付き4択 | MultipleChoice |

### 文章モード（SentenceItem のみ使用）

| mode | 概要 | 入力形式 |
|------|------|----------|
| `rearrange` | 単語チップを正しい語順に並べる | Rearrange |
| `fillin` | 空欄に当てはまる単語を選ぶ | WordCard + Fillin |

---

## グローバル状態（`AppContext`）

```ts
// 主要な値と更新方法
semester: SemesterId                 // "2sp" | "2fall"。<AppProvider semester=...> で固定され、途中で変わらない
data: SemesterData                   // その学期の { label, words, sentences, sentenceTags, itemByKey }。label は Nav に表示

screen: "home" | "quiz" | "result" | "dashboard"
setScreen(s)                         // 画面遷移

sessionConfig: SessionConfig         // ホーム画面で設定、クイズ開始時に参照
setSessionConfig(config)

mastery: Record<string, MasteryData> // キー = hanzi or sentence id
updateMastery(id, isCorrect)         // 正誤を渡すとSRS計算して localStorage に保存

sessionResult: SessionResult | null  // クイズ終了時にセット、Result画面が参照
setSessionResult(res)

stats: { sessions, correct, total, streak, lastDate }
resetData()                          // mastery + stats を全消去
```

**localStorage キー:**

| 学期 | mastery | stats |
|------|---------|-------|
| `2sp`（`/`） | `final_mastery` | `final_stats` |
| `2fall`（`/2fall/`） | `final_mastery_2fall` | `final_stats_2fall` |

- `final_theme` — `"dark"` | `"light"`（**全学期で共通**）
- `2sp` は既存ユーザーの記録を守るためサフィックスなしのキーのまま。他の学期は `_<学期ID>` が付く（`AppContext.tsx` の `storageKey`）。
- `resetData()` は表示中の学期の mastery / stats だけを消す。

---

## SRS（間隔反復）アルゴリズム

`AppContext.updateMastery` 内で実装。SM-2 簡易版。

```
正解時: interval = 0→1→6→round(interval * easeFactor) で増加
不正解時: interval = 1 に戻す、easeFactor = max(1.3, easeFactor - 0.8)

nextReviewDate = 今日 + interval 日後（ISO文字列）
```

`reviewMode: true` のとき、`buildQueue` は `nextReviewDate <= 今日` のアイテムのみ抽出する。

---

## 出題キュー構築（`src/lib/buildQueue.ts`）

純粋関数。Quiz.tsx の init `useEffect` から呼ばれる。教材は引数で受け取る（モジュール import しない）。

```ts
buildQueue(
  config: SessionConfig,
  mastery: Record<string, MasteryData>,
  data: Pick<SemesterData, "words" | "sentences">
): QuizItem[]
```

処理順:
1. モードで word/sentence プールを選択
2. range（A〜Z）または tag で絞り込み
3. reviewMode → nextReviewDate フィルタ / weakOnly → 正解率 < 80% フィルタ
4. `shuffle()` してから count 分スライス
5. 空プールなら `[]` を返す（Quiz.tsx 側で AlertDialog 表示）

---

## Quiz.tsx のアーキテクチャ

**責務:** state 管理・イベントハンドラー・子コンポーネントへの props 渡し。JSX は最小限。

**state 一覧:**
```ts
queue: QuizItem[]               // buildQueue の結果
currentIndex: number
sessionCorrect: number
sessionMistakes: { item: QuizItem }[]
isAnswered: boolean
feedback: { isCorrect: boolean; text: string } | null
inputVal: string                // ピンイン入力
inputValHanzi: string           // 漢字入力（vocab_full 用）
chineseVoice: SpeechSynthesisVoice | null
timeLeft: number                // time_attack 用（60秒）
rearrangeBank / rearrangeZone: { id: number; text: string }[]
fillinSelected: string | null
showFlashcardAns: boolean
dontKnowSelected: boolean
showEmptyAlert: boolean         // 空プール通知
```

**主要ハンドラー:**
- `submitAnswer(isCorrect, correctText)` — 正誤を記録、mastery 更新
- `nextQuestion()` — 次へ進む（末尾なら endSession）
- `handleDontKnow()` — 「わからない」= 不正解として処理
- `handleChoice(idx)` — 選択肢クリック
- `handlePinyinSubmit()` — ピンイン確認
- `handleVocabFullSubmit()` — フルテスト確認
- `handleRearrangeSubmit()` — 並び替え確認
- `handleFillin(word)` — 穴埋め選択

**flashcard のレンダーは早期 return:**
```tsx
if (sessionConfig.mode === "flashcard") {
  if (!isWordItem(currentItem)) return null;
  return <Flashcard ... />;
}
// 以降が standard render
```

---

## ESLint 設定（`eslint.config.mjs`）

```js
"react-hooks/purity":         "off"   // useMemo 内 Math.random() を許容
"react-hooks/immutability":   "off"   // ref 更新パターンを許容
"react-hooks/set-state-in-effect": "off" // init useEffect 内 setState を許容
"@typescript-eslint/no-explicit-any": "error" // any 型は禁止
```

Next.js 16 の strict hooks ルールは意図的に緩和している。`any` は必ず型定義で置き換えること。

---

## 変更時の注意点

### 新しいクイズモードを追加する場合

1. `SessionConfig.mode` の型は現在 `string` — 型を narrow にする場合は全参照箇所を更新
2. 単語モードなら `buildQueue` の `isSentence` 判定は不要（自動で word プールになる）
3. 文章モードなら `isSentence = ["rearrange", "fillin", "新モード"]` に追加
4. Home.tsx の `modes` / `sentenceModes` 配列にエントリを追加
5. `isMCMode` / `hideHanzi` 等の判定ロジックを Quiz.tsx で更新
6. 対応する子コンポーネントを `src/components/quiz/` に追加
7. `handleDontKnow` の `correctText` 分岐に新モードを追加する場合あり

### データ（JSON）を変更する場合

- 教材は `src/data/<学期>/words.json` と `sentences.json`。
- `words.json` のキーは漢字文字列、`display_pinyin` が優先される（なければ `pinyin`）
- `sentences.json` の `id` は mastery のキーになるため変更厳禁
- `sentenceTags`（`getSemesterData(id).sentenceTags`）は JSON から動的生成されるため、タグ追加は JSON 側だけで完結
- 教材を参照するコードは `import ... from "@/data"` のモジュール変数ではなく、`useAppContext().data`（純粋関数なら引数）を使うこと。学期が混ざる。

### 新しい学期を追加する場合

1. `src/data/<新学期ID>/words.json` と `sentences.json` を置く（`id` は他学期と重複しても動くが、学期内で一意にする）。
2. `src/data/index.ts` で JSON を 2 つ import し、`RAW` に `{ label, words, sentences }` のエントリを 1 つ足す（`SemesterId` と `SEMESTER_IDS` は `RAW` から自動で決まる）。
3. 追加の設定は不要。`/<新学期ID>/` が `[semester]/page.tsx` の `generateStaticParams` で自動生成され、localStorage キーは `_<新学期ID>` サフィックスになる。

### Modal を使う場合

```tsx
import { ConfirmDialog, AlertDialog } from "@/components/ui/Modal";

// 確認ダイアログ（Dashboard.tsx のリセット参照）
{showConfirm && (
  <ConfirmDialog
    message="..."
    confirmLabel="実行"
    onConfirm={() => { doSomething(); setShowConfirm(false); }}
    onCancel={() => setShowConfirm(false)}
  />
)}

// 通知ダイアログ（Quiz.tsx の空プール参照）
{showAlert && (
  <AlertDialog
    message="..."
    okLabel="OK"
    onClose={() => setShowAlert(false)}
  />
)}
```

### `shuffle` を使う場合

```ts
import { shuffle } from "@/utils/shuffle";
const result = shuffle(arr);  // 元配列は変更しない、新配列を返す
```

`src/utils/tones.ts` 内の `Math.random()` は声調ディストラクタ生成用で正当な用途。変更不要。
