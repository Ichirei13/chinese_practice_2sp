# 学期別ルーティング(2春 / 2秋)設計

日付: 2026-10-30

## 目的

同じアプリで **2年春(2sp)** と **2年秋(2fall)** の教材を出し分ける。
2秋はリンクの末尾に `/2fall/` を付けた URL で開く。変わるのは **教材データだけ**で、UI・クイズモード・SRS ロジックは共通。

## 決定事項(ユーザー合意済み)

| 項目 | 決定 |
|------|------|
| URL 構造 | 2春は既存リンクのまま(`/`)。2秋は `/2fall/` を追加(案A) |
| 学習記録 | 学期ごとに分離。2春の既存キーはそのまま、2秋はサフィックス付き |
| テーマ | 学期共通(`final_theme`) |
| 実装方式 | 動的セグメント `app/[semester]/page.tsx` + `generateStaticParams` |

## 前提と制約

- `output: "export"`(静的エクスポート)+ GitHub Pages 配信。`trailingSlash: true`、`basePath` は `NEXT_PUBLIC_BASE_PATH`。
- Next.js 16.2.7 の静的エクスポートでは redirects / rewrites は使えず、動的ルートは `generateStaticParams()` で全パスをビルド時に列挙する必要がある(`node_modules/next/dist/docs` 相当のドキュメントで確認済み)。したがって `/2fall/` は実ページとして生成する。
- `dynamicParams = false` を指定し、未知の学期は 404 とする。
- リポジトリにテスト基盤はない。検証は lint / build / ブラウザ確認で行う。
- 2秋の教材データは未受領。**初期は少量のダミーデータ**で配線を検証し、実データは後日差し替える。

## 設計

### 1. データ層

- 教材 JSON を学期ディレクトリに分ける。
  - `src/data/2sp/words.json`, `src/data/2sp/sentences.json` — 現行の `exam_words.json` / `exam_sentences.json` を `git mv`(内容は不変)。
  - `src/data/2fall/words.json`, `src/data/2fall/sentences.json` — 新規。
- `src/data/index.ts` は、学期 ID を受け取り `SemesterData` を返す形にする。
  ```ts
  export type SemesterId = "2sp" | "2fall";
  export type SemesterData = {
    words: WordItem[];
    sentences: SentenceItem[];
    sentenceTags: string[];
    itemByKey: Record<string, QuizItem>;
  };
  export const DEFAULT_SEMESTER: SemesterId = "2sp";
  export const SEMESTER_IDS: SemesterId[];       // レジストリ(唯一の一覧)
  export function getSemesterData(id: SemesterId): SemesterData;
  ```
- 単語の変換(`display_pinyin || pinyin`)と文の検証(`isValidSentence`)は現行ロジックを共通関数として流用する。学期ごとの結果はモジュールレベルでキャッシュし、1 学期につき変換は 1 回のみ。
- `hsk_*.json` と `clean_data.py` / `add_sentences.js` は未使用の旧資産であり、今回は触らない。

### 2. 画面へのデータ受け渡し

- `AppProvider` が `semester: SemesterId` を props で受け取り、`AppContext` に `semester` と `data: SemesterData` を載せる。
- 学期データを参照する箇所を context 経由に変更する。
  - `Home.tsx`: `SENTENCE_TAGS` → `data.sentenceTags`
  - `Quiz.tsx`: `wordsData` → `data.words`、`buildQueue` 呼び出しにデータを渡す
  - `Dashboard.tsx`: `itemByKey` → `data.itemByKey`
- `buildQueue(config, mastery, data)` は純粋関数のまま。`words` / `sentences` をモジュール import せず引数から受け取る。`isWeak` は変更なし。
- `AppProvider` は `layout.tsx` から外し、各ページ側でマウントする。layout に置いたままだとルート間で state が残り学期が混ざり得るため。`layout.tsx` は `<html>` / フォント設定のみ。

### 3. 学習記録の分離

| 学期 | mastery | stats | theme |
|------|---------|-------|-------|
| 2sp | `final_mastery` | `final_stats` | `final_theme` |
| 2fall | `final_mastery_2fall` | `final_stats_2fall` | `final_theme`(共通) |

- キー生成は `AppContext` 内の小さなヘルパーに集約する(2sp はサフィックスなし)。
- `resetData` は現在の学期の mastery / stats のみ削除する。

### 4. ルーティング

- 共通の画面本体を `src/app/App.tsx`(現 `page.tsx` の中身)に切り出す。
  ```
  src/app/
    layout.tsx             # html / fonts のみ
    page.tsx               # <AppProvider semester="2sp"><App/></AppProvider>
    [semester]/page.tsx    # generateStaticParams: DEFAULT 以外の SEMESTER_IDS
                           # dynamicParams = false
                           # <AppProvider semester={params.semester}><App/></AppProvider>
  ```
- `/` は常に 2春。`/2fall/` は 2秋。将来の学期は、データフォルダ追加とレジストリへの 1 行追加で対応できる。
- Next 16 では `params` は `Promise` として受け取る(`await params`)。

### 5. エラー処理

- 学期 ID は型で絞る。`[semester]` の値は `generateStaticParams` が列挙したものに限られる(`dynamicParams = false`)。
- 2秋の教材が空でも画面は落ちない。既存の「空プール → AlertDialog」の経路に乗る。

### 6. 検証

1. `npm run lint` が通る(`any` 禁止ルールを維持)。
2. `npm run build` が通り、`out/index.html` と `out/2fall/index.html` が生成される。
3. Playwright(ビルド成果物を静的配信して確認):
   - `/` と `/2fall/` が別の教材を出題する。
   - 片方で回答しても、もう片方の `localStorage`(mastery / stats)が変化しない。
   - 2春の既存キーのデータが引き続き読み込まれる(既存ユーザーの記録が消えない)。
   - 2秋のリセットが 2春の記録を消さない。
   - `/unknown/` が 404 になる。
4. 2春側の全クイズモードの挙動が変更前と同じであること(スモーク確認)。

### 7. ドキュメント更新

- `CODEBASE.md`: ディレクトリ構成、データ層、`AppContext`、localStorage キー、「データを変更する場合」を新構造に更新する。現状は `hsk_*` / `hsk_mastery` の記述が実態(`exam_*` / `final_*`)とずれているため、あわせて正す。
- `README.md`: 2秋の URL と教材データ差し替え手順を追記する。

## スコープ外

- 2秋の実教材データの作成(後日受領して差し替え)。
- 学期選択 UI、学期間のデータ引き継ぎ。
- `hsk_*.json` や旧スクリプトの整理。
- `layout.tsx` の title / manifest の学期別出し分け。
