# signal 依存グラフ

アプリ全体のリアクティブ構造。**構造 (signal / computed / effect / コンポーネント構成) を変えるコミットでは、この図も同じコミットで更新すること。**

- 逆流 (effect からの signal 書き込み)・循環: なし
- `renderedDocument` は resource: Manuscripts.files を params とする async 導出 (Converter サービスが markdown 変換 + mermaid SVG 化 + キャッシュを担う)。`rendering` はその isLoading
- `Breaks.pagination` は (doc, 指定, ページ割りに関わる設定) からの計測つき computed。強制改ページ位置で文書をセグメント (独立した段組ストリップ) に分割し、セグメントごとに実測する (計測用の領域は観測可能な状態を残さない)。設定は画面 CSS を経由してページ割りに効くため、依存として読むだけで測定へは渡さない (版面の寸法はページ数の算出に要るので書式から受け取る)。`pageCount` はその total
- `Breaks.ids` は linkedSignal: Manuscripts.files に連動し、末尾への追記では維持・構造変更ではリセット
- パネル内で完結するローカル UI state (dragOver / draggingIndex / FilePanelViewModel の message / WorkspaceViewModel の sheetOpen) は省略
- 用紙書式は `Paper` (format / select)。`format` は書き込み可能で、ツールバーの `PaperControl` が自身の Signal Forms のフィールド越しに読み書きする。書式は `PaperFormat` の値オブジェクトで、版面と段の刻みと CSS 表現を自分で答える。書式を要する導出 (ページ組・表示倍率・シート描画) はすべてこの signal を源とする
- `Paper` の effect は `@page` 規則を DOM へ書くだけ。画面 CSS への寸法の供給は `StyleVariables` へ委ねる
- 用紙書式の前後の移動は `paper-catalog.ts` の `PaperCatalog` が答える。表示倍率は `zoom.ts` が同じ算術を自分で持つ
- ページ割りに関わる設定は `StyleVariables` がまとめる。設定は `provideLayoutSetting` で DI へ登録し、`all` computed が全設定のカスタムプロパティを 1 つにして effect が html へ書く。`Breaks.pagination` はこの `all` を読むので、設定が増えても `breaks.ts` は変わらない
- `Zoom.value` は linkedSignal: `Paper.format` を source とし、書式が変わればその紙に収まる倍率へ戻す。ツールバーの `ZoomControl` は表示と可否を受け取り、操作を output で返す

```mermaid
flowchart LR
  subgraph Actions["ユーザー操作"]
    A1([ファイル追加/削除/並べ替え])
    A2([改ページのチェック])
    A3([ズーム − / ＋])
    A4([用紙書式の選択])
  end

  subgraph ManuscriptsS["Manuscripts"]
    S1((manuscripts))
    S5((notices))
    C1[/nonEmpty/]
  end

  subgraph BreaksS["Breaks"]
    S2((ids<br/>linkedSignal))
    V3[/pagination<br/>計測つき computed<br/>セグメント分割 + 実測/]
    V2[/pageCount<br/>= pagination.total/]
  end

  subgraph ConversionS["ConversionPipeline"]
    S4[["renderedDocument<br/>resource (async 導出)"]]
    S3[/rendering<br/>= isLoading/]
  end

  subgraph PaperS["Paper"]
    S6((format))
    AE2[effect<br/>書式の反映]
  end

  subgraph StyleS["StyleVariables"]
    VS1[/all<br/>登録された設定を畳む/]
    AE3[effect<br/>カスタムプロパティの書き込み]
  end

  subgraph ZoomS["Zoom"]
    V1((value<br/>linkedSignal))
  end

  subgraph ToolbarC["Toolbar (PaperControl / ZoomControl)"]
    HC1[/status<br/>ToolbarViewModel/]
    T1{{ツールバー: 頁数/用紙/倍率}}
  end

  subgraph HeaderC["Header"]
    T7{{ヘッダ: ロゴ/印刷}}
  end

  subgraph AppC["App"]
    T2{{空状態 ↔ 作業画面の切替<br/>(ツールバーの出し分けも同じ判定)}}
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
    D3[(@page 規則)]
    D4[(html のカスタムプロパティ<br/>登録された設定すべて)]
  end

  A1 -- "add / remove /<br/>nudge / reorder" --> S1
  S1 -- "source 連動:<br/>追記=維持 / 構造変更=リセット" --> S2
  A2 -- toggle --> S2
  A3 -- "Signal Forms 経由" --> V1
  A4 -- "Signal Forms 経由" --> S6
  S6 -- "source 連動: 収まる段へ組み直す" --> V1
  S6 --> AE2
  AE2 --> D3
  S6 --> V3
  S6 --> PE1
  S6 -- "provideLayoutSetting で登録" --> VS1
  VS1 --> AE3
  AE3 --> D4
  VS1 --> V3

  S1 -- "params → loader<br/>(Converter: markdown 変換 +<br/>mermaid SVG 化 + キャッシュ)" --> S4
  S4 --> S3
  A1 -. "add が警告を設定" .-> S5

  S1 --> C1

  C1 --> T2
  S4 -- "doc.groups() ほか<br/>(RenderedDocument の遅延メモ)" --> T4
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

  V1 --> T3
  V2 --> HC1
  S3 --> HC1
  S3 --> T6
  HC1 --> T1
  V1 --> T1
  C1 --> T1
  C1 --> T7

  classDef sig fill:#fcd34d,stroke:#b45309,color:#1c1917
  classDef comp fill:#bae6fd,stroke:#0369a1,color:#0c4a6e
  classDef eff fill:#0f172a,stroke:#0f172a,color:#fff
  classDef tmpl fill:#d1fae5,stroke:#059669,color:#064e3b
  classDef dom fill:#e7e5e4,stroke:#57534e
  classDef res fill:#99f6e4,stroke:#0f766e,color:#134e4a
  classDef linked fill:#f5d0fe,stroke:#a21caf,color:#4a044e
  class S1,S5,S6 sig
  class S4 res

  class S2,V1 linked
  class C1,S3,HC1,V2,V3,VS1 comp
  class AE1,AE2,AE3,PE1 eff
  class T1,T2,T3,T4,T5,T6,T7 tmpl
  class D1,D2,D3,D4 dom
```

凡例: 丸 = writable signal ・ 紫丸 = linkedSignal ・ 青緑 = resource (async 導出) ・ 平行四辺形 = computed ・ 黒 = effect (DOM 書き込みのみ) ・ 六角 = テンプレートバインディング ・ 点線 = 命令的な書き込み
