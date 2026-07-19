# 引き継ぎメモ — HSK4 Practice 公開作業

Cowork セッションからの引き継ぎ。ここから先は Claude Code で継続する。
最終更新: 2026-06-16

---

## ⚡ 最優先：まずこれをやる

ローカルに **未pushのコミットが1つ** ある（README更新＋ROADMAP/HANDOFF追加）。
Cowork のサンドボックスからは GitHub 認証ができずpushできなかったので、Claude Code 側で push する。

```bash
cd /Users/reiji/myapps/chinese_practice
git status          # "ahead 1" を確認
git push origin main
```

push すると Vercel が自動で再デプロイし、本番リポジトリに README/ROADMAP が反映される。

- 未pushコミット: `ea7001a docs: Update README to current HSK4 version, add publish ROADMAP`
- このコミットには `README.md`（全面書き換え）と `ROADMAP.md`（新規）が含まれる
- `HANDOFF.md`（このファイル）はまだコミットしていない → 必要なら一緒に add してよい

---

## 現状サマリー（どこまで来ているか）

このアプリは **すでに本番公開済み**。ゼロから公開する作業ではない。

| 項目 | 状態 |
|------|------|
| GitHub リポジトリ | ✅ 接続済み `github.com/Ichirei13/chinese_practice` |
| Vercel プロジェクト | ✅ リンク済み（プロジェクト名 `chinese_practice`） |
| 本番デプロイ | ✅ 済み（`https://〇〇.vercel.app` で公開中） |
| 自動デプロイ(CI/CD) | ✅ `main` への push で自動再ビルド |
| 独自ドメイン | ❌ 未取得（GitHub Student Pack でこれから） |
| README | ✅ 現行HSK4版に更新済み（このコミットに含む・未push） |

`.vercel/project.json` の情報:
- `projectId`: `prj_zxDLV4ul7HVqx7To2sJRGUHGtTbS`
- `orgId`: `team_OKAusvMo8TXQoEcja5iIOy4T`

---

## このセッションで実施したこと

1. **現状調査** — GitHub/Vercel接続済み・本番デプロイ済みであることを確認
2. **ROADMAP.md 作成** — 公開〜独自ドメイン〜運用までの手順書（リポジトリ直下）
3. **Notion ページ作成** — チェックリスト付きの司令塔ページ
   - URL: https://app.notion.com/p/3812429800c081c6bebcf5c146e5d9de
   - タイトル: 🚀 公開ロードマップ — HSK4 Practice アプリ
4. **README.md 全面更新** — 旧「4択のみ版」の記述（存在しない `_components/QuestionCard.tsx` 等を参照していた）を、現行のHSK4版（単語8モード＋文法2モード、SRS、ダッシュボード）に書き換え
5. **コミット作成**（未push） — 上記2ファイルを `ea7001a` でコミット

### 注意：Cowork サンドボックスの制約（Claude Code では無関係）

- Cowork のマウントは **ファイル削除が既定で不可**・**GitHub認証情報なし**だったため、サンドボックスから push できなかった
- Claude Code は実機で動くのでこれらの制約はない。通常通り git/push できる

---

## 次のステップ（ロードマップ要約）

詳細は `ROADMAP.md` 参照。Notion のチェックリストと内容は同期している。

### Phase 1 — 公開URLの確認と整備（今すぐ・30分）
- Vercel ダッシュボードで本番URL（`xxx.vercel.app`）を確認、スマホで動作チェック
- 各クイズ・SRS・localStorage保存の動作確認
- ✅ README更新は完了（push待ち）

### Phase 2 — 独自ドメイン取得（GitHub Student Pack・30分）
- `education.github.com/pack` から取得（Namecheap `.me` 1年無料 / `.tech` 1年無料）
- **推奨戦略**: apex（例 `reiji.tech`）はポートフォリオ用に温存し、このアプリは
  **サブドメイン**（例 `hsk.reiji.tech`）に置く → 後でブログ・他アプリを同ドメイン下に増やせる

### Phase 3 — ドメインを Vercel に接続（30分＋反映待ち）
- Vercel → Settings → Domains → Add
- サブドメイン: `CNAME` を `cname.vercel-dns.com` に向ける
- apex: `A` を `76.76.21.21` に向ける
- Domains画面が緑(Valid)になればOK。HTTPSはVercelが自動発行

### Phase 4 — 運用整備（1時間）
- main push で自動デプロイの確認、PRごとのプレビューデプロイ活用
- Vercel Analytics（無料枠）有効化

### Phase 5 — 改善ループ（継続）
- 友達にURL共有 → Notionでフィードバック管理
- 次の機能候補: 音声/発音TTS拡充・ピンイン入力強化・SRS統計・苦手語自動抽出
- サイクル: Notionに仕様 → 実装 → PRでプレビュー → mainマージで自動公開

---

## アプリの技術コンテキスト（最低限）

詳細は `CODEBASE.md` に網羅済み。改修時はそちらを必ず読む。

- **構成**: Next.js 16.2.7 (App Router, Turbopack) / React 19 / TypeScript 5 / Tailwind v4
- **バックエンドなし**: データは全て `localStorage`。サーバー・DB・`.env` 不要 → Vercelデプロイが容易
- **データ**: `src/data/hsk_words.json`（600語）/ `hsk_sentences.json`（129文）
- **localStorage キー**: `hsk_mastery` / `hsk_stats` / `hsk_theme`
- **クイズ**: 単語8モード（pinyin, meaning, hanzi, tones, listening, vocab_full, flashcard, time_attack）＋文法2モード（rearrange, fillin）
- **SRS**: `AppContext.updateMastery` 内に SM-2簡易版。`buildQueue`（純粋関数）が出題キューを構築
- **ESLint**: Next16 strict hooks を意図的に緩和。`any` は禁止
- **ローカル動作確認**: `npm run dev` / `npm run build`

### 重要ファイル
- `src/app/page.tsx` — 4画面ルーター（home/quiz/result/dashboard）
- `src/context/AppContext.tsx` — グローバル状態・SRS計算・localStorage
- `src/lib/buildQueue.ts` — 出題キュー構築（テスト可能な純粋関数）
- `src/data/types.ts` — 唯一の型定義場所
- `CODEBASE.md` — 改修ガイド（モード追加手順・データ変更注意点など）

---

## 関連ファイル一覧

- `HANDOFF.md` — このファイル（引き継ぎ）
- `ROADMAP.md` — 公開ロードマップ詳細
- `README.md` — リポジトリの顔（更新済み・push待ち）
- `CODEBASE.md` — 設計・改修ガイド
- `AGENTS.md` — Next.js 16 のAIルール（破壊的変更ありなので docs 参照を促す）
