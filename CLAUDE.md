# CLAUDE.md

printmd のプロジェクト規範。

## 生きたドキュメント

- `docs/signal-graph.md` はリアクティブ構造 (signal / computed / linkedSignal / resource / effect) の唯一の定義図である。これらを追加・削除・移動するコミットは、同じコミットでこの図を更新しなければならない。
- `docs/component-tree.md` はコンポーネント構造の唯一の定義図である。コンポーネントの追加・削除・責務変更を行うコミットは、同じコミットでこの図を更新しなければならない。

## ページ組の不変条件

- プレビューと印刷のページ割り一致は「予測ではなく共有」で達成する。改ページ位置を自前で計算するコードを持ち込んではならない (経緯は README の仕組み節を参照)。
- 画面の強制改ページは CSS の強制改行 (`break-before: column`) に依存してはならない。Firefox が未実装のため、セグメント分割 (`src/app/shared/pagination/segment-ranges.ts`) で表現する。
- 紙面の寸法は `src/app/shared/paper/paper-format.ts` の `PaperFormat` を単一の情報源とし、書式そのものは `paper-catalog.ts` に置く。数値を別の場所に重複させてはならない。書式ごとの分岐を書かず、寸法の問い合わせは `PaperFormat` のメソッドへ委ねる。

## 拡張の規律

- 拡張は開放閉鎖原則 (拡張に対して開き、修正に対して閉じる) に従う。増やせるものを増やすとき、既存の実装は閉じたままでなければならない。判定は「その追加で既存ファイルが変わるか」で行い、変わるならまだ拡張点が無い。
- 選べるもの (用紙書式など) を増やす変更は、先に拡張点を作る変更を分けて出す。増やす変更そのものが、一覧への登録だけで済む状態にしてから出す。
- 選択肢の集合を文言・テストへ書き写さない。README や `index.html` の説明文は特定の選択肢を名指しせず、テストで一覧を検査するときは一覧から導く。1 件を代表として使う検証 (計算の期待値など) は妨げない。

## コーディング規律

- コーディング規律は lint で決定論的に強制する (`eslint.config.ts` と `tools/eslint-rules/` が唯一の定義)。規律を文書へ書き写さない。lint で表現できない規律だけをここへ書く。

## 検証

- テストファースト。修正はまず失敗するテストで再現してから行う。
- 印刷パリティ (Chromium) と境界改ページ (Chromium / WebKit / Firefox) の e2e は削除・弱体化してはならない。
- 画面に出る変更は、自動テストの通過をもって完了としない。開発サーバ (`pnpm start`) で実機を見て、スクリーンショットを報告に添える。

## Angular / TypeScript コーディング指針

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

### TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

### Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

### Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

### Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

### Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
