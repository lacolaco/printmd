import { Component, computed, effect, inject, signal } from '@angular/core';
import type { Block, BlockKind } from '../markdown/block-extractor';
import { EditorStore } from '../state/editor-store';

/**
 * 改ページ調整パネル。全トップレベルブロックがチェック可能 (チェック = 直前で
 * 改ページ)。ノイズ対策: 既定では主要ブロックだけを表示し、「すべてのブロック
 * を表示」で段落・リスト等も出す。ファイル境界ブロックは常に改ページになるため
 * チェック操作の対象外として案内のみ表示する。
 */

const MAIN_KINDS: ReadonlySet<BlockKind> = new Set([
  'heading',
  'table',
  'code',
  'mermaid',
  'blockquote',
  'hr',
]);

const KIND_LABELS: Readonly<Record<BlockKind, string>> = {
  heading: '見出し',
  paragraph: '段落',
  table: '表',
  code: 'コード',
  mermaid: '図',
  blockquote: '引用',
  list: 'リスト',
  html: 'HTML',
  hr: '罫線',
  other: 'その他',
};

interface BreakRow {
  readonly block: Block;
  readonly kindLabel: string;
  readonly indent: number;
  readonly emphasized: boolean;
}

interface FileGroup {
  readonly fileIndex: number;
  readonly fileName: string;
  readonly rows: readonly BreakRow[];
}

@Component({
  selector: 'app-break-panel',
  template: `
    @if (store.hasFiles()) {
      <section class="mt-4" aria-labelledby="break-heading">
        <div class="mb-2 flex items-center justify-between gap-2">
          <h2 id="break-heading" class="text-sm font-bold text-stone-700">改ページ調整</h2>
          <label class="flex cursor-pointer items-center gap-1 text-xs text-stone-600">
            <input type="checkbox" [checked]="showAll()" (change)="toggleShowAll()" />
            すべてのブロックを表示
          </label>
        </div>
        <p class="mb-2 text-xs text-stone-500">
          チェックしたブロックの直前で改ページします。原稿は書き換わりません
        </p>
        @if (totalRows() === 0) {
          <p class="text-xs text-stone-500">改ページを調整できるブロックがありません</p>
        }
        @for (group of groups(); track group.fileIndex) {
          <div role="group" [attr.aria-label]="multiFile() ? group.fileName : null">
            @if (multiFile()) {
              <p class="mt-2 truncate text-xs font-bold text-stone-500">{{ group.fileName }}</p>
            }
            <ul class="space-y-0.5" role="list">
              @for (row of group.rows; track row.block.id) {
                <li>
                  @if (row.block.isFileBoundary) {
                    <p class="py-1 pr-1.5 text-sm text-stone-500" [style.padding-left.px]="row.indent">
                      <span
                        class="mr-1 inline-block rounded bg-stone-100 px-1 text-[10px] text-stone-600"
                        aria-hidden="true"
                        >{{ row.kindLabel }}</span
                      >
                      <span class="break-all">{{ row.block.label || row.kindLabel }}</span>
                      <span class="ml-1 text-xs text-stone-400">(ファイル境界、常に改ページ)</span>
                    </p>
                  } @else {
                    <label
                      class="flex cursor-pointer items-start gap-2 rounded py-1 pr-1.5 text-sm hover:bg-stone-100"
                      [style.padding-left.px]="row.indent"
                    >
                      <input
                        type="checkbox"
                        class="mt-0.5 shrink-0"
                        [checked]="store.breaks().has(row.block.id)"
                        (change)="toggleBreak(row.block)"
                      />
                      <span class="min-w-0">
                        <span
                          class="mr-1 inline-block rounded bg-stone-100 px-1 text-[10px] text-stone-600"
                          aria-hidden="true"
                          >{{ row.kindLabel }}</span
                        >
                        <span
                          class="break-all text-stone-800"
                          [class.font-medium]="row.emphasized"
                          >{{ row.block.label || row.kindLabel }}</span
                        >
                      </span>
                    </label>
                  }
                </li>
              }
            </ul>
          </div>
        }
        @if (hiddenCount() > 0) {
          <p class="mt-2 text-xs text-stone-500">
            ほか {{ hiddenCount() }} ブロックは「すべてのブロックを表示」で選べます
          </p>
        }
      </section>
    }
  `,
})
export class BreakPanel {
  protected readonly store = inject(EditorStore);
  protected readonly showAll = signal(false);
  /** フィルタ対象でも表示を維持する ID (操作した行が消えないように)。フィルタ切り替えでリセット */
  private readonly stickyIds = signal<ReadonlySet<string>>(new Set());

  constructor() {
    // ID は位置由来 (f{n}b{m}) のため、ファイルの削除・並べ替えで同じ ID が別の
    // ブロックを指し直す。構造変更の世代に合わせて維持リストを破棄する
    effect(() => {
      this.store.structureVersion();
      this.stickyIds.set(new Set());
    });
  }

  protected readonly multiFile = computed(
    () => new Set(this.store.blocks().map((b) => b.fileIndex)).size > 1,
  );

  protected readonly groups = computed<readonly FileGroup[]>(() => {
    const breaks = this.store.breaks();
    const showAll = this.showAll();
    const sticky = this.stickyIds();
    const groups: FileGroup[] = [];
    let current: { fileIndex: number; fileName: string; rows: BreakRow[] } | null = null;
    let currentHeadingLevel = 0;
    for (const block of this.store.blocks()) {
      if (current === null || block.fileIndex !== current.fileIndex) {
        // ファイル境界で階層をリセットする (前ファイルの見出しレベルを持ち越さない)
        currentHeadingLevel = 0;
        current = { fileIndex: block.fileIndex, fileName: block.fileName, rows: [] };
        groups.push(current);
      }
      if (block.kind === 'heading') currentHeadingLevel = block.level ?? 1;
      const visible =
        block.isFileBoundary ||
        showAll ||
        MAIN_KINDS.has(block.kind) ||
        breaks.has(block.id) ||
        sticky.has(block.id);
      if (!visible) continue;
      const level = block.kind === 'heading' ? (block.level ?? 1) : currentHeadingLevel + 1;
      current.rows.push({
        block,
        kindLabel: KIND_LABELS[block.kind],
        // 基本の 6px + 階層インデント (padding はここで一元管理する)
        indent: 6 + Math.min(level - 1, 4) * 12,
        emphasized: block.kind === 'heading' && (block.level ?? 1) <= 2,
      });
    }
    return groups.filter((group) => group.rows.length > 0);
  });

  protected readonly totalRows = computed(() =>
    this.groups().reduce((sum, group) => sum + group.rows.length, 0),
  );

  protected readonly hiddenCount = computed(() => this.store.blocks().length - this.totalRows());

  protected toggleShowAll(): void {
    this.showAll.set(!this.showAll());
    this.stickyIds.set(new Set());
  }

  protected toggleBreak(block: Block): void {
    if (!MAIN_KINDS.has(block.kind)) {
      this.stickyIds.update((current) => new Set(current).add(block.id));
    }
    this.store.toggleBreak(block.id);
  }
}
