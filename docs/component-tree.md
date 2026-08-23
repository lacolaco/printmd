# コンポーネントツリー

各コンポーネントの配置と責務。`src/app/components/` のディレクトリ構造はこのツリーの親子関係をそのまま写す (親コンポーネントのディレクトリ配下に子コンポーネントを置く。App 直下の葉は components/ 直下)。コンポーネントの協力オブジェクト (SheetRenderer / Demo など、コンポーネントではないクラス) は、それを使うコンポーネントと同じディレクトリに置く。状態とその操作は責務単位のドメインサービス (Manuscripts / Breaks / Document / Zoom) が一体で保有し、ドメインのディレクトリに置く。ローカルステートは提供元コンポーネントに同居する (workspace.state.ts / file-panel.state.ts)。
**コンポーネントの追加・削除・責務変更のコミットでは、この図と docs/signal-graph.md を同じコミットで更新すること** (CLAUDE.md の生きたドキュメント規則)。

```mermaid
flowchart TB
  APP["App<br/><small>画面骨格: ヘッダ / 画面切替 / 印刷対象、<br/>ウィンドウ全体のドロップ受け</small>"]
  HEADER["Header<br/><small>ロゴ / 表示操作の帯 / 印刷</small>"]
  STATUS["PageStatus<br/><small>頁数・変換中の文言 (読み上げ対象)</small>"]
  ZOOMC["ZoomControl<br/><small>ズームの段送り操作</small>"]
  WS["Workspace<br/><small>作業画面: md+ は 2 カラム、スマートフォン幅は<br/>シングルカラム + ボトムシート (開閉状態を所有)</small>"]
  IMPORT["ImportScreen<br/><small>空状態の画面 (初回のみ)</small>"]
  PREVIEW["Preview<br/><small>A4 シート面の結線。描画は<br/>SheetRenderer に委譲 (遅延実体化)</small>"]
  PANEL["ControlPanel<br/><small>調整パネル: md+ は右カラム /<br/>モバイルはボトムシートの中身</small>"]
  FILEP["FilePanel<br/><small>原稿の取り込み・並べ替え・削除<br/>(読み上げは FilePanelState)</small>"]
  BREAKP["BreakPanel<br/><small>全ブロックの改ページ指定一覧</small>"]
  BREAKROW["BreakRowItem<br/><small>一覧の 1 行 (ラベル・インデント・強調)</small>"]
  FILEROW["FileRowItem<br/><small>ファイル行の操作面 (移動・削除)</small>"]
  FILEADD["FileAddInput<br/><small>追加取り込みの入力面</small>"]
  FOOTER["Footer<br/><small>下端の帯: 著作権表記・ライセンス導線・Angular バージョン<br/>(ヘッダと対)</small>"]
  DROP["ImportDropzone<br/><small>取り込み面 (デモ取り込みは<br/>Demo サービス)</small>"]
  PRINT["PrintRoot<br/><small>印刷対象 (変換済み文書の掲示)</small>"]

  APP --> HEADER
  HEADER --> STATUS
  HEADER --> ZOOMC
  APP --> FOOTER
  APP -->|"原稿あり"| WS
  APP -->|"空状態"| IMPORT
  APP --> PRINT
  WS --> PREVIEW
  WS --> PANEL
  PANEL --> FILEP
  PANEL --> BREAKP
  BREAKP --> BREAKROW
  FILEP --> FILEROW
  FILEP --> FILEADD
  IMPORT --> DROP

  classDef shell fill:#fcd34d,stroke:#b45309
  classDef layout fill:#fde68a,stroke:#b45309
  classDef leaf fill:#e0f2fe,stroke:#0369a1
  class APP shell
  class WS,PANEL,IMPORT layout
  class HEADER,STATUS,ZOOMC,PREVIEW,FILEP,BREAKP,FOOTER,DROP,PRINT leaf
```

- 画面領域の責務で階層化: App は骨格、Workspace / ImportScreen が画面、ControlPanel が右カラムを所有する
- コンポーネント間の疎通はドメインサービス (Manuscripts / Breaks / Document / Zoom) の購読と命令で行う。input/output は FileAddInput の selected など最小限
- リアクティブ構造は [signal-graph.md](./signal-graph.md) を参照
