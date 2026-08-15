# signal 依存グラフ

アプリ全体のリアクティブ構造。**構造 (signal / computed / effect / コンポーネント構成) を変えるコミットでは、この図も同じコミットで更新すること。**

- 逆流 (effect からの signal 書き込み)・循環: なし
- `pageCount` は (doc, breaks) からの計測つき computed (プローブは観測可能な状態を残さない)
- `breaksSignal` は linkedSignal: filesSignal に連動し、末尾への追記では維持・構造変更ではリセット
- `filesSignal → runPipeline → renderedDocumentSignal` は async パイプライン (点線 = 非リアクティブ)。単飛行 + 後追いで再入制御
- パネル内で完結するローカル UI state (dragOver / draggingIndex / announcement) は省略

```mermaid
flowchart LR
  subgraph Actions["ユーザー操作"]
    A1([ファイル追加/削除/並べ替え])
    A2([改ページのチェック])
    A3([ズーム − / ＋])
  end

  subgraph Store["EditorStore"]
    S1((filesSignal))
    S2((breaksSignal<br/>linkedSignal))
    S3((renderingSignal))
    S4((renderedDocumentSignal<br/>= doc))
    S5((importWarningsSignal))
    C1[/hasFiles/]
    C2[/blocks/]
    P[["runPipeline<br/>(async・単飛行・fragmentCache)"]]
  end

  subgraph Viewer["ViewerState"]
    V1((zoomIndex))
    V2[/pageCount<br/>計測つき computed/]
    VC1[/zoom/]
    VC2[/zoomLabel/]
  end

  subgraph HeaderC["Header"]
    HC1[/statusLabel/]
    T1{{ヘッダ: 頁数/ズーム/印刷}}
  end

  subgraph AppC["App"]
    T2{{空状態 ↔ 作業画面の切替}}
  end

  subgraph PrintC["PrintRoot"]
    AE1[effect<br/>印刷対象の掲示]
  end

  subgraph PreviewC["Preview"]
    PE1[effect<br/>シート構築]
    T3{{style.zoom}}
  end

  subgraph Panels["BreakPanel / FilePanel"]
    BC1[/groups/]
    BC2[/totalRows/]
    BC3[/multiFile/]
    T4{{改ページ一覧}}
    T5{{ファイル行}}
  end

  subgraph DOM["DOM シンク"]
    D1[(print-root<br/>唯一の文書実体)]
    D2[(sheets<br/>クローン群)]
  end

  A1 -- "addFiles / removeFile /<br/>moveFile / reorderFile" --> S1
  S1 -- "source 連動:<br/>追記=維持 / 構造変更=リセット" --> S2
  A2 -- toggleBreak --> S2
  A3 -- setZoom --> V1

  S1 -.-> P
  P -.-> S3
  P -.-> S4
  P -.-> S5

  S1 --> C1
  S4 --> C2

  C1 --> T2
  C2 --> BC1
  S2 --> BC1
  BC1 --> BC2
  C2 --> BC3
  BC1 --> T4
  BC2 --> T4
  BC3 --> T4
  S2 --> T4
  S1 --> T5
  S5 --> T5

  S4 --> AE1
  S2 --> AE1
  AE1 --> D1

  S4 --> PE1
  S2 --> PE1
  PE1 --> D2
  S4 --> V2
  S2 --> V2
  V2 --> PE1

  V1 --> VC1
  VC1 --> VC2
  VC1 --> T3
  V2 --> HC1
  S3 --> HC1
  HC1 --> T1
  VC2 --> T1
  C1 --> T1

  classDef sig fill:#fcd34d,stroke:#b45309,color:#1c1917
  classDef comp fill:#bae6fd,stroke:#0369a1,color:#0c4a6e
  classDef eff fill:#0f172a,stroke:#0f172a,color:#fff
  classDef tmpl fill:#d1fae5,stroke:#059669,color:#064e3b
  classDef dom fill:#e7e5e4,stroke:#57534e
  classDef pipe fill:#fff,stroke:#57534e,stroke-dasharray:4 4
  classDef linked fill:#f5d0fe,stroke:#a21caf,color:#4a044e
  class S1,S3,S4,S5,V1 sig
  class S2 linked
  class C1,C2,VC1,VC2,HC1,BC1,BC2,BC3,V2 comp
  class AE1,PE1 eff
  class T1,T2,T3,T4,T5 tmpl
  class D1,D2 dom
  class P pipe
```

凡例: 丸 = writable signal ・ 紫丸 = linkedSignal ・ 平行四辺形 = computed ・ 黒 = effect (DOM 書き込みのみ) ・ 六角 = テンプレートバインディング ・ 点線 = 命令的 (非リアクティブ)
