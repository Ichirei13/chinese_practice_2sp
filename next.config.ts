import type { NextConfig } from "next";

// GitHub Pages のプロジェクトページは https://<user>.github.io/<repo>/ で配信される。
// そのため basePath / assetPrefix にリポジトリ名を付与する必要がある。
// 値はビルド時に GitHub Actions が NEXT_PUBLIC_BASE_PATH に注入する（ローカルビルドは空 = ルート）。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // localStorage のみで動く純クライアント SPA。静的エクスポートして GitHub Pages に配置する。
  output: "export",

  // 静的エクスポートでは next/image の最適化サーバーが無いため無効化（現状 next/image 未使用だが将来のため）。
  images: { unoptimized: true },

  // サブパス配信のためのプレフィックス。next/link やフォント等の内部参照に自動適用される。
  basePath,
  assetPrefix: basePath,

  // 各ルートを /path/index.html として出力し、GitHub Pages で拡張子なしURLでも解決できるようにする。
  trailingSlash: true,
};

export default nextConfig;
