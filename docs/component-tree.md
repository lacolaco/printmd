# コンポーネントツリー

各コンポーネントの配置と責務。**コンポーネントの追加・削除・責務変更のコミットでは、この図と docs/signal-graph.md を同じコミットで更新すること** (AGENTS.md の Living documentation 規則)。

```mermaid
flowchart TB
  APP["App<br/><small>画面骨格: ヘッダ / 画面切替 / 印刷対象、<br/>ウィンドウ全体のドロップ受け</small>"]
  HEADER["Header<br/><small>ロゴ / 頁数・ズーム / 印刷</small>"]
  WS["Workspace<br/><small>作業画面: md+ は 2 カラム、スマートフォン幅は<br/>シングルカラム + ボトムシート (開閉状態を所有)</small>"]
  IMPORT["ImportScreen<br/><small>空状態の画面 (初回のみ)</small>"]
  PREVIEW["Preview<br/><small>A4 シートの多段組プレビュー<br/>(遅延実体化)</small>"]
  PANEL["ControlPanel<br/><small>調整パネル: md+ は右カラム /<br/>モバイルはボトムシートの中身</small>"]
  FILEP["FilePanel<br/><small>原稿の取り込み・並べ替え・削除</small>"]
  BREAKP["BreakPanel<br/><small>全ブロックの改ページ指定一覧</small>"]
  FOOTER["Footer<br/><small>下端の帯: 著作権表記とライセンス導線<br/>(ヘッダと対)</small>"]
  DROP["ImportDropzone<br/><small>取り込み面</small>"]
  PRINT["PrintRoot<br/><small>印刷対象 (変換済み文書の掲示)</small>"]

  APP --> HEADER
  APP --> FOOTER
  APP -->|"原稿あり"| WS
  APP -->|"空状態"| IMPORT
  APP --> PRINT
  WS --> PREVIEW
  WS --> PANEL
  PANEL --> FILEP
  PANEL --> BREAKP
  IMPORT --> DROP

  classDef shell fill:#fcd34d,stroke:#b45309
  classDef layout fill:#fde68a,stroke:#b45309
  classDef leaf fill:#e0f2fe,stroke:#0369a1
  class APP shell
  class WS,PANEL,IMPORT layout
  class HEADER,PREVIEW,FILEP,BREAKP,FOOTER,DROP,PRINT leaf
```

- 画面領域の責務で階層化: App は骨格、Workspace / ImportScreen が画面、ControlPanel が右カラムを所有する
- コンポーネント間の疎通はすべて共有サービス (EditorStore / ViewerState) 経由で、input/output は存在しない (該当ユースケースがない)
- リアクティブ構造は [signal-graph.md](./signal-graph.md) を参照
