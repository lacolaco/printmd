# コンポーネントツリー

各コンポーネントの配置と責務。トップレベルは `src/app/feature/` (機能 = header / workspace / import / print / footer) と `src/app/shared/` (機能横断のドメイン) の 2 つ。feature 内のディレクトリ構造はこのツリーの親子関係をそのまま写し、コンポーネントの協力オブジェクト (SheetRenderer など) とコンテナのビューモデル (`xxx.vm.ts`) は、それを使うコンポーネントと同じディレクトリに置く。状態とその操作は責務単位のドメインサービス (Manuscripts / Breaks / ConversionPipeline / Paper / Zoom) が一体で保有し、shared のドメインディレクトリに置く。
**コンポーネントの追加・削除・責務変更のコミットでは、この図と docs/signal-graph.md を同じコミットで更新すること** (CLAUDE.md の生きたドキュメント規則)。

```mermaid
flowchart TB
  APP["App<br/><small>画面骨格: ヘッダ / ツールバー / 画面切替 / 印刷対象</small>"]
  HEADER["Header<br/><small>ロゴ / 印刷 (コンテナ)</small>"]
  TOOLBAR["Toolbar<br/><small>表示操作の帯: 頁数 / 用紙書式 / 表示倍率 (コンテナ)</small>"]
  ZOOMC["ZoomControl<br/><small>ズームの段送り操作面 (プレーン)</small>"]
  PAPERC["PaperControl<br/><small>用紙書式の選択面<br/>(ngToolbarWidgetGroup の aria-pressed トグルボタンで束ねる)</small>"]
  WS["Workspace<br/><small>作業画面: md+ は 2 カラム、スマートフォン幅は<br/>シングルカラム + ボトムシート (開閉状態を所有)。<br/>追加取り込みのドロップ受け</small>"]
  PREVIEW["Preview<br/><small>シート面の結線 (寸法は用紙書式)。描画は<br/>SheetRenderer に委譲 (遅延実体化)</small>"]
  FILEP["FilePanel<br/><small>原稿の取り込み・並べ替え・削除<br/>(読み上げは FilePanelState)</small>"]
  BREAKP["BreakPanel<br/><small>全ブロックの改ページ指定一覧</small>"]
  BREAKROW["BreakRowItem<br/><small>一覧の 1 行 (ラベル・インデント・強調)</small>"]
  FILEROW["FileRowItem<br/><small>ファイル行の操作面 (移動・削除)</small>"]
  FILEADD["FileAddInput<br/><small>追加取り込みの入力面</small>"]
  FOOTER["Footer<br/><small>下端の帯: 著作権表記・ライセンス導線・Angular バージョン<br/>(ヘッダと対)</small>"]
  DROP["ImportDropzone<br/><small>取り込み面 (デモ原稿の読み込みも担う)</small>"]
  PRINT["PrintRoot<br/><small>印刷対象 (変換済み文書の掲示)</small>"]

  APP --> HEADER
  APP -->|"原稿あり"| TOOLBAR
  TOOLBAR --> ZOOMC
  TOOLBAR --> PAPERC
  APP --> FOOTER
  APP -->|"原稿あり"| WS
  APP -->|"空状態"| DROP
  APP --> PRINT
  WS --> PREVIEW
  WS --> FILEP
  WS --> BREAKP
  BREAKP --> BREAKROW
  FILEP --> FILEROW
  FILEP --> FILEADD

  classDef shell fill:#fcd34d,stroke:#b45309
  classDef layout fill:#fde68a,stroke:#b45309
  classDef leaf fill:#e0f2fe,stroke:#0369a1
  class APP shell
  class WS layout
  class HEADER,TOOLBAR,ZOOMC,PAPERC,PREVIEW,FILEP,BREAKP,FOOTER,DROP,PRINT leaf
```

- 画面領域の責務で階層化: App は骨格、Workspace が作業画面と右カラム (調整パネル) を所有する
- コンテナは自身のビューモデル (CQS: state query と command) だけを注入し、VM がドメインサービス (Manuscripts / Breaks / ConversionPipeline / Paper / Zoom) を仲介する。プレーンなコンポーネントは input/output だけで疎通し VM を持たない。input/output は FileAddInput の selected など最小限
- Toolbar は表示操作 (頁数 / 用紙書式 / 表示倍率) をヘッダから切り出した独立の帯で、原稿があるときだけ App が Header の下・Workspace の上に置く。ヘッダは Header の isActive (原稿有無) が出し分ける印刷ボタンだけを持つ
- リアクティブ構造は [signal-graph.md](./signal-graph.md) を参照
