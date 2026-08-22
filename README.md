# printmd

Markdown 原稿を GitHub のレンダリングそのままの見た目で A4 の紙面に割り付け、改ページを調整して印刷用 PDF にするウェブツール。

**https://printmd.lacolaco.app**

- 計算はすべてブラウザ内で完結する。原稿がサーバーへ送られることはない
- 複数の Markdown ファイルを取り込み、順序を並べ替えられる (ファイル境界は常に改ページ)
- 任意のブロックの直前に改ページを指定できる。原稿は書き換わらない
- 出力はブラウザの印刷ダイアログから PDF に保存する

## 仕組み

画面プレビューは CSS 多段組を流用する。段の幅と高さを A4 の版面 (178mm × 265mm) に固定すると、ブラウザのフラグメンテーションエンジンが本文を段単位に分割する。これは印刷時のページ分割と同じエンジンなので、段の区切りがそのままページの区切りになり、プレビューと印刷結果が一致する。強制改ページは画面では `break-before: column`、印刷では `break-before: page` として同じクラスに割り当てる。

## 開発

```bash
npm ci
npm start          # 開発サーバー
npm test           # ユニットテスト (vitest / jsdom)
npm run e2e        # e2e (Playwright。プレビューと印刷 PDF の一致を実出力で検証)
npm run build      # 本番ビルド
```

デプロイは Cloudflare Workers Static Assets (`wrangler.jsonc`)。main への push で Cloudflare Workers Builds (Git 連携) が自動ビルド・デプロイする。GitHub Actions は CI (lint / test / build / e2e) のみを担う。

## ライセンス

[MIT](LICENSE)
