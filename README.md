# HSK4 Practice — 中国語学習アプリ

中国語 HSK4 級対策のクイズアプリ。**659語の単語**と **176文の例文**を、10種類の単語クイズ＋2種類の文法クイズで練習できます。SRS（間隔反復）で苦手な語を効率よく復習できます。

Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 で構築。バックエンド不要（学習データは `localStorage` に保存）。

## 主な機能

**単語モード（8種）**

- ピンイン入力（漢字を見てピンインをタイプ）
- 意味4択 / 漢字4択 / 声調（トーン）4択
- リスニング（音声を聞いてピンイン入力）
- フルテスト（ピンイン＋漢字を両方入力）
- フラッシュカード（タップで答え表示、覚えた / もう一度）
- タイムアタック（60秒タイマー付き4択）

**文法モード（2種）**

- 並び替え（単語チップを正しい語順に）
- 穴埋め（空欄に入る単語を選択）

**学習サポート**

- SRS（SM-2簡易版）で次回復習日を自動計算。復習モードで「今日やるべき語」だけ出題
- 苦手語モード（正解率80%未満のみ抽出）、課・範囲（A〜Z）での絞り込み
- ダッシュボードで習得率グラフ・学習統計（連続日数など）を表示
- ダーク / ライトテーマ切替

## 開発

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認します。

```bash
npm run build   # 本番ビルド
npm start       # ビルド結果を起動
npm run lint    # ESLint
```

## ディレクトリ構成

```
src/
├── app/          # layout / page（4画面ルーター）/ globals.css
├── data/         # 型定義・単語/例文JSON（hsk_words.json, hsk_sentences.json）
├── context/      # AppContext（screen, theme, stats, mastery, SRS）
├── lib/          # buildQueue（出題キュー構築・純粋関数）
├── utils/        # shuffle, tones（声調ディストラクタ生成）
└── components/   # Nav / screens / quiz（モード別UI）/ ui（Modal）
```

設計の詳細・改修時の注意点は [`CODEBASE.md`](./CODEBASE.md) を参照。

## データ永続化

サーバー・DBは無し。以下を `localStorage` に保存します。

- `hsk_mastery` — 各語の習得状況（SRSの間隔・次回復習日）
- `hsk_stats` — 学習統計（セッション数・正答数・連続日数）
- `hsk_theme` — テーマ設定

## デプロイ

GitHub と Vercel に連携済みで、`main` ブランチへの push で自動デプロイされます。公開手順・独自ドメイン設定は [`ROADMAP.md`](./ROADMAP.md) を参照。

## 今後の拡張候補

ピンイン発音TTSの拡充、統計ダッシュボードの強化、苦手語の自動抽出など。型と出題ロジックをUIから分離しているため機能追加しやすい構成です。
