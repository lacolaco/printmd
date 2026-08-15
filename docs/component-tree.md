# コンポーネントツリー

各コンポーネントの配置と責務。**コンポーネントの追加・削除・責務変更のコミットでは、この図と docs/signal-graph.md を同じコミットで更新すること** (AGENTS.md の Living documentation 規則)。

```mermaid
flowchart TB
  APP["App<br/><small>画面骨格: レイアウト分岐と<br/>ウィンドウ全体のドロップ受け</small>"]
  HEADER["Header<br/><small>ロゴ / 頁数・ズーム / 印刷</small>"]
  PREVIEW["Preview<br/><small>A4 シートの多段組プレビュー<br/>(遅延実体化)</small>"]
  FILEP["FilePanel<br/><small>原稿の取り込み・並べ替え・削除</small>"]
  BREAKP["BreakPanel<br/><small>全ブロックの改ページ指定一覧</small>"]
  FOOTER["Footer<br/><small>著作権表記とライセンス導線</small>"]
  DROP["ImportDropzone<br/><small>空状態の取り込み面 (初回のみ)</small>"]
  PRINT["PrintRoot<br/><small>印刷対象 (変換済み文書の掲示)</small>"]

  APP --> HEADER
  APP -->|"原稿あり"| PREVIEW
  APP -->|"原稿あり"| FILEP
  APP -->|"原稿あり"| BREAKP
  APP -->|"原稿あり"| FOOTER
  APP -->|"空状態"| DROP
  APP -->|"空状態"| FOOTER
  APP --> PRINT

  classDef shell fill:#fcd34d,stroke:#b45309
  classDef leaf fill:#e0f2fe,stroke:#0369a1
  class APP shell
  class HEADER,PREVIEW,FILEP,BREAKP,FOOTER,DROP,PRINT leaf
```

- 深さ 1 のフラットな木。コンポーネント間の疎通はすべて共有サービス (EditorStore / ViewerState) 経由で、input/output は存在しない (該当ユースケースがない)
- リアクティブ構造は [signal-graph.md](./signal-graph.md) を参照
