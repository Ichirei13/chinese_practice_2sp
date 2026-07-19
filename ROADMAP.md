# 公開ロードマップ — HSK4 Practice

中国語HSK4練習アプリ（`chinese_practice`）を、独自ドメインで世に出すまでの手順書。
作成日: 2026-06-16

---

## 前提：このアプリの性質（重要）

- **フレームワーク**: Next.js 16 / React 19 / TypeScript / Tailwind v4
- **バックエンドなし**: データは全部 `localStorage`。サーバーもDBも環境変数(`.env`)も不要。
- **つまり**: 静的に近い構成なので、Vercelに乗せるのが一番ラク。DB費用ゼロ、設定もほぼゼロ。

この「サーバーレス＝公開が簡単」という点が今回の最大の追い風。

---

## 現在地（✅ ここまで完了済み）

- [x] **GitHub接続済み** — `github.com/Ichirei13/chinese_practice`
- [x] **Vercel接続・本番デプロイ済み** — Vercelプロジェクト `chinese_practice` にリンク済み。gitログに `(now in production)` あり。
- [x] つまり **`https://〇〇.vercel.app` のURLで既に全世界に公開されている**

> 残っているのは「独自ドメインを取得して紐付ける」＋「運用と改善の仕組み作り」だけ。

---

## Phase 1 — 公開URLの確認と整備（所要 30分 / 今すぐ）

まず今の本番URLを確かめて、見せられる状態か点検する。

- [ ] Vercelダッシュボード（vercel.com）にログイン → プロジェクト `chinese_practice` を開く
- [ ] 上部の **Domains** または **Visit** から本番URL（`xxx.vercel.app`）を確認・コピー
- [ ] **スマホ**で開いてみる（友達はPCよりスマホで触る。レイアウト崩れチェック）
- [ ] 各クイズ（単語10種＋文法2種）が動くか、SRS/ベストスコアが `localStorage` に保存されるか確認
- [ ] **README.md を現行版に更新** — 今のREADMEは旧「4択のみ版」の記述で実態とズレている（CODEBASE.mdが正）。公開リポジトリの顔なので直す。

---

## Phase 2 — 独自ドメインを取得（所要 30分 / GitHub Student Pack）

GitHub Student Packで無料 or 格安のドメインが取れる。

- [ ] `education.github.com/pack` にログインし、提供元を選ぶ
  - **Namecheap**: `.me` ドメインが1年無料（SSL付き）。手軽さNo.1。
  - **Name.com**: `.live` などが1年無料。
  - **.tech ドメイン**: Student Pack経由で `.tech` が1年無料。技術ポートフォリオ向けで見栄えが良い。
- [ ] 希望ドメインを検索して取得（例: `reiji.tech` / `hsk-practice.me` など）
  - **おすすめ戦略**: apex（例 `reiji.tech`）は将来ポートフォリオ用に温存し、このアプリは **サブドメイン**（例 `hsk.reiji.tech`）に置くと、後で「ブログ」「他アプリ」を同じドメイン下に増やせる（CLAUDE.mdの構想と一致）。
- [ ] 取得後、ドメイン管理画面（DNS設定ページ）にアクセスできることを確認

---

## Phase 3 — ドメインをVercelに接続（所要 30分＋反映待ち）

- [ ] Vercel → プロジェクト → **Settings → Domains → Add**
- [ ] 使いたいドメイン/サブドメインを入力（例: `hsk.reiji.tech`）
- [ ] Vercelが表示するDNSレコードを、Namecheap/Name.com側に設定する
  - **サブドメイン** の場合: `CNAME` レコードを `cname.vercel-dns.com` に向ける
  - **apexドメイン** の場合: `A` レコードを Vercel指定IP（`76.76.21.21`）に向ける
- [ ] DNS反映を待つ（数分〜最大数時間）。VercelのDomains画面が緑（Valid）になればOK
- [ ] **HTTPS（SSL証明書）はVercelが自動発行** — 手動作業不要。`https://` で開けることを確認

---

## Phase 4 — 本番運用の仕組みを整える（所要 1時間）

公開して終わりじゃなく、更新を回せる状態にする。

- [ ] **自動デプロイの確認**: `main` ブランチに push すると Vercel が自動で再ビルド＆公開（CI/CDは設定済み）。一度小さな修正をpushして自動反映を体験する。
- [ ] **プレビューデプロイ**: 新機能はブランチを切ってPRを出すと、Vercelが専用プレビューURLを発行。本番に影響せず友達に試作を見せられる。
- [ ] **Vercel Analytics**（無料枠）を有効化 → 誰が・どのページを見たか把握
- [ ] **独自ドメインのカスタムDNS**でメール転送等が要るなら後で追加（今は不要）

---

## Phase 5 — フィードバックと改善ループ（継続）

ここが「ポートフォリオ／検証経験」の本体。

- [ ] 完成URLを友達に共有して実際に使ってもらう
- [ ] **Notionでフィードバックを一元管理**（バグ報告・要望・改善ログ）。このロードマップのNotion版を司令塔にする。
- [ ] 次の機能候補（README拡張案より）:
  - 音声・発音再生（ピンインTTS）
  - ピンイン入力での回答モード
  - SRS（間隔反復）の強化・統計ダッシュボード
  - 苦手語の自動抽出
- [ ] 機能追加は「Notionに仕様を箇条書き → AIエージェント(Antigravity等)に実装指示 → PRでプレビュー確認 → mainにマージで自動公開」のサイクルで回す

---

## 困ったとき（よくある詰まりポイント）

- **ドメインがValidにならない**: DNSレコードのタイプ（A/CNAME）と値を再確認。反映に時間がかかることもあるので最大24時間待つ。
- **`.vercel` や `node_modules` をコミットしてしまう**: `.gitignore` で除外済み。触らない。
- **環境変数が要る機能を足したくなったら**: Vercel → Settings → Environment Variables に追加（今のアプリは不要）。
- **ローカルビルド確認**: `npm run build` → `npm start`。ローカルで通れば本番でも通る。

---

## サマリー（最短ルート）

1. Vercelで今の本番URLを確認（もう公開済み）
2. Student Packでドメイン取得（Namecheap `.me` か `.tech`）
3. Vercel Settings → Domains に追加し、DNSにCNAME/Aを設定
4. 緑になったら独自ドメインで公開完了
5. あとはmainにpushするだけで更新が自動反映 → 改善ループへ
