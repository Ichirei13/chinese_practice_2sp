# HSK4 Practice — プロジェクト全体像

> このファイル1つを読めば、プロジェクトの目的・構成・データ形式・拡張方法が分かるようにまとめたもの。
> 詳しい改修ガイドは [`CODEBASE.md`](./CODEBASE.md) を参照。

---

## 1. これは何か

中国語 **HSK4 級対策のクイズ／単語練習アプリ**。
**単語 659語**と**例文 176文**を、10種類の単語クイズ＋2種類の文法クイズで練習できる。
SRS（間隔反復）で苦手な語を効率よく復習できる。

- バックエンド・DBなし。学習データはブラウザの `localStorage` に保存。
- GitHub + Vercel 連携済み。`main` への push で自動デプロイ。

## 2. 技術構成

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16.2.7（App Router, Turbopack） |
| UI | React 19 / Tailwind CSS v4 |
| 言語 | TypeScript 5 |
| グラフ | recharts |
| データ永続化 | localStorage のみ |
| フォント | Inter（UI）/ Noto Sans SC（漢字） |

> 注意: このリポジトリの Next.js は通常版と挙動が異なる（`AGENTS.md` 参照）。
> コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを読むこと。

## 3. ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx      # HTMLルート・フォント設定・AppProvider マウント
│   ├── page.tsx        # screen state で4画面を切り替えるルーター
│   └── globals.css     # CSS変数・Tailwind・カスタムクラス
│
├── data/               # ★学習データはここ（追記対象）
│   ├── types.ts        # 唯一の型定義場所（WordItem / SentenceItem / QuizItem）
│   ├── index.ts        # JSONを型付き配列へ変換してエクスポート
│   ├── hsk_words.json      # 単語 659語
│   └── hsk_sentences.json  # 例文 176文
│
├── context/
│   └── AppContext.tsx  # グローバル状態（screen, theme, stats, mastery, sessionConfig）
│
├── lib/
│   └── buildQueue.ts   # 出題キュー構築の純粋関数（絞り込み・SRSフィルタ）
│
├── utils/
│   ├── shuffle.ts      # Fisher-Yates シャッフル
│   └── tones.ts        # 四声ディストラクタ生成
│
└── components/
    ├── Nav.tsx
    ├── screens/        # Home / Quiz / Result / Dashboard の4画面
    ├── quiz/           # モード別UI（Flashcard, PinyinInput, MultipleChoice, Rearrange, Fillin 等）
    └── ui/Modal.tsx    # ConfirmDialog / AlertDialog
```

（`legacy/` は旧バージョンの静的HTML実装。現行アプリは `src/` 側。）

## 4. データ形式（★追記するならここ）

### 単語 — `src/data/hsk_words.json`

キー＝漢字文字列のオブジェクト。

```json
{
  "学习": { "pinyin": "xue2xi2", "display_pinyin": "xuéxí", "meaning": "学習する" },
  "果然": { "pinyin": "guoran", "display_pinyin": "guǒrán", "meaning": "案の定" }
}
```

- `display_pinyin`（声調記号つき）が優先表示され、なければ `pinyin` を使う。
- **キー（漢字）が重複しないこと**。同じ漢字を足すと上書きになる。

### 例文 — `src/data/hsk_sentences.json`

配列。2タイプある。

```json
[
  {
    "id": "r1", "type": "rearrange", "tags": ["第1課"],
    "words": ["去", "餐厅", "昨天", "很不错", "的"],
    "answer": "昨天去的餐厅很不错",
    "meaning": "昨日行ったレストランはとてもよかった。"
  },
  {
    "id": "f1", "type": "fillin", "tags": ["第2課"],
    "sentence": "我___学习",
    "options": ["喜欢", "讨厌"],
    "answer": "喜欢",
    "meaning": "..."
  }
]
```

- `rearrange`（並び替え）: `words` を正しい順に並べると `answer` になる。
- `fillin`（穴埋め）: `sentence` の `___` に入る語を `options` から選ぶ。正解は `answer`。
- **`id` は学習履歴（mastery）のキー。既存IDは絶対に変更しない**。追記は既存とかぶらない一意なIDで（現行の命名は `r1`〜, `f1`〜, `batch1_*`, `b2_*`, `s_b3_*`, `r331`〜/`f331`〜 が混在。新規は重複しなければ形式自由）。
- `rearrange` は別解を `accept: string[]`（正解として認める語順の配列）で持てる。`fillin` は出題時に和訳（`meaning`）が表示され、空欄の答えが一意に決まる前提。
- mastery は id と成績・SRS状態のみ保存し、表示時に現行データから項目を引く（データ修正が既習ユーザーにも即反映される）。
- `tags` は課・カテゴリ。現在は `第1課`〜`第12課` と `仕事` / `学習` / `感情・人間関係`。
- タグの選択肢はJSONから自動生成されるので、**新しい課／範囲はタグを書くだけで絞り込みに反映される**。

## 5. 出題モード

**単語モード（8種・WordItem を使用）**
ピンイン入力 / 意味4択 / 漢字4択 / 声調4択 / リスニング / フルテスト（ピンイン＋漢字）/ フラッシュカード / タイムアタック（60秒）

**文法モード（2種・SentenceItem を使用）**
並び替え（rearrange）/ 穴埋め（fillin）

## 6. 型定義（`src/data/types.ts`）

判別可能ユニオンで管理。

```ts
type WordItem      = { type: "word";      hanzi; pinyin; meaning }
type RearrangeItem = { type: "rearrange"; id; tags; words[]; answer; meaning }
type FillinItem    = { type: "fillin";    id; tags; sentence; options[]; answer; meaning }

type SentenceItem  = RearrangeItem | FillinItem
type QuizItem      = WordItem | SentenceItem
```

mastery のキー: WordItem は `hanzi`、SentenceItem は `id`。

## 7. 状態管理・永続化（`AppContext`）

```
screen         : "home" | "quiz" | "result" | "dashboard"
sessionConfig  : 出題設定（mode, count, range, tag, weakOnly, reviewMode 等）
mastery        : Record<key, MasteryData>  // 各語の習得状況・SRS情報
stats          : { sessions, correct, total, streak, lastDate }
```

localStorage キー: `hsk_mastery` / `hsk_stats` / `hsk_theme`

## 8. SRS（間隔反復）

`AppContext.updateMastery` 内で SM-2 簡易版を実装。

```
正解時  : interval を 0→1→6→round(interval * easeFactor) と増加
不正解時: interval を 1 に戻し、easeFactor = max(1.3, easeFactor - 0.8)
nextReviewDate = 今日 + interval 日
```

`reviewMode: true` のとき `buildQueue` は `nextReviewDate <= 今日` の語だけ出題。

## 9. データを追記する手順（まとめ）

1. 単語 → `hsk_words.json` に `"漢字": { pinyin, display_pinyin, meaning }` を追加（漢字キー重複に注意）。
2. 例文 → `hsk_sentences.json` に新しい `id`（既存とかぶらない連番）で追加。
3. 新しい課・範囲は `tags` を付けるだけで絞り込みに自動反映。
4. `types.ts` / `index.ts` / UI は原則そのままで拾われる。
5. 追記後に `npm run dev` で表示確認、`npm run lint` でチェック。
