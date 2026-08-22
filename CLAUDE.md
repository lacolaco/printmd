# CLAUDE.md

printmd のプロジェクト規範。

## 生きたドキュメント

- `docs/signal-graph.md` はリアクティブ構造 (signal / computed / linkedSignal / resource / effect) の唯一の定義図である。これらを追加・削除・移動するコミットは、同じコミットでこの図を更新しなければならない。
- `docs/component-tree.md` はコンポーネント構造の唯一の定義図である。コンポーネントの追加・削除・責務変更を行うコミットは、同じコミットでこの図を更新しなければならない。

## ページ組の不変条件

- プレビューと印刷のページ割り一致は「予測ではなく共有」で達成する。改ページ位置を自前で計算するコードを持ち込んではならない (経緯は README の仕組み節を参照)。
- 画面の強制改ページは CSS の強制改行 (`break-before: column`) に依存してはならない。Firefox が未実装のため、セグメント分割 (`src/app/page-count.ts`) で表現する。
- 紙面の寸法は `src/app/page-geometry.ts` を単一の情報源とする。数値を別の場所に重複させてはならない。

## コーディング規律

- 5 行ルール: 関数・メソッドの本体は、ロジックのある行が 5 行以内でなければならない。括弧・区切り記号 (`{` `}` `(` `)` `[` `]` `;` `,`) だけの行と空行は数えない。lint ルール `printmd/max-function-lines` が強制する。適用対象は `src/` と `tools/` の実装コードで、`*.spec.ts` ファイルと `e2e/` は対象外。

## 検証

- テストファースト。修正はまず失敗するテストで再現してから行う。
- 印刷パリティ (Chromium) と境界改ページ (Chromium / WebKit / Firefox) の e2e は削除・弱体化してはならない。

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
- Inline the template when it is 20 lines or fewer; use an external file only above that (enforced by the `printmd/inline-short-templates` lint rule)
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
