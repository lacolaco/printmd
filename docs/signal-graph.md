# signal 依存グラフ

アプリ全体のリアクティブ構造。**構造 (signal / computed / effect / コンポーネント構成) を変えるコミットでは、この図も同じコミットで更新すること。**

- 逆流 (effect からの signal 書き込み)・循環: なし
- `renderedDocument` は resource: ManuscriptState.files を params とする async 導出 (Converter サービスが markdown 変換 + mermaid SVG 化 + キャッシュを担う)。`rendering` はその isLoading
- `pagination` は (doc, breaks) からの計測つき computed。強制改ページ位置で文書をセグメント (独立した段組ストリップ) に分割し、セグメントごとに実測する (プローブは観測可能な状態を残さない)。`pageCount` はその total
- `marks` は linkedSignal: ManuscriptState.files に連動し、末尾への追記では維持・構造変更ではリセット
- パネル内で完結するローカル UI state (dragOver / draggingIndex / Announcer の message) は省略
- ズーム段の状態は `ZoomState` (index / value / label)。段送り・上限判定・初期段の決定は pagination/zoom.ts の純関数で、Header が判断して replace で置き換える

```mermaid
flowchart LR
  subgraph Actions["ユーザー操作"]
    A1([ファイル追加/削除/並べ替え])
    A2([改ページのチェック])
    A3([ズーム − / ＋])
  end

  subgraph Manuscripts["ManuscriptState"]
    S1((manuscripts))
    S5((notices))
    C1[/nonEmpty/]
  end

  subgraph Breaks["BreakState"]
    S2((marks<br/>linkedSignal))
  end

  subgraph Documents["DocumentState"]
    S4[["renderedDocument<br/>resource (async 導出)"]]
    S3[/rendering<br/>= isLoading/]
    C2[/blocks/]
    C3[/blockGroups/]
    C4[/rowTotal/]
    C5[/multiSource/]
  end

  subgraph Viewer["ViewerState"]
    V3[/pagination<br/>計測つき computed<br/>セグメント分割 + 実測/]
    V2[/pageCount<br/>= pagination.total/]
  end

  subgraph ZoomS["ZoomState"]
    V1((step))
    VC1[/value/]
    VC2[/label/]
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
    T6{{変換中表示}}
  end

  subgraph Panels["BreakPanel / FilePanel"]
    T4{{改ページ一覧}}
    T5{{ファイル行}}
  end

  subgraph DOM["DOM シンク"]
    D1[(print-root<br/>唯一の文書実体)]
    D2[(sheets<br/>クローン群)]
  end

  A1 -- "addFiles / removeFile /<br/>nudge / reorder" --> S1
  S1 -- "source 連動:<br/>追記=維持 / 構造変更=リセット" --> S2
  A2 -- toggleBreak --> S2
  A3 -- "Header: stepped → replace" --> V1

  S1 -- "params → loader<br/>(Converter: markdown 変換 +<br/>mermaid SVG 化 + キャッシュ)" --> S4
  S4 --> S3
  A1 -. "addFiles が警告を設定" .-> S5

  S1 --> C1
  S4 --> C2

  C1 --> T2
  C2 --> C3
  C3 --> C4
  C2 --> C5
  C3 --> T4
  C4 --> T4
  C5 --> T4
  S2 --> T4
  S1 --> T5
  S5 --> T5

  S4 --> AE1
  S2 --> AE1
  AE1 --> D1

  S4 --> PE1
  PE1 --> D2
  S4 --> V3
  S2 --> V3
  V3 --> V2
  V3 --> PE1

  V1 --> VC1
  VC1 --> VC2
  VC1 --> T3
  V2 --> HC1
  S3 --> HC1
  S3 --> T6
  HC1 --> T1
  VC2 --> T1
  C1 --> T1

  classDef sig fill:#fcd34d,stroke:#b45309,color:#1c1917
  classDef comp fill:#bae6fd,stroke:#0369a1,color:#0c4a6e
  classDef eff fill:#0f172a,stroke:#0f172a,color:#fff
  classDef tmpl fill:#d1fae5,stroke:#059669,color:#064e3b
  classDef dom fill:#e7e5e4,stroke:#57534e
  classDef res fill:#99f6e4,stroke:#0f766e,color:#134e4a
  classDef linked fill:#f5d0fe,stroke:#a21caf,color:#4a044e
  class S1,S5,V1 sig
  class S4 res

  class S2 linked
  class C1,C2,C3,C4,C5,S3,VC1,VC2,HC1,V2,V3 comp
  class AE1,PE1 eff
  class T1,T2,T3,T4,T5,T6 tmpl
  class D1,D2 dom
```

凡例: 丸 = writable signal ・ 紫丸 = linkedSignal ・ 青緑 = resource (async 導出) ・ 平行四辺形 = computed ・ 黒 = effect (DOM 書き込みのみ) ・ 六角 = テンプレートバインディング ・ 点線 = 命令的な書き込み
