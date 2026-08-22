import { Component, computed, inject } from '@angular/core';
import type { Block, BlockKind } from '../../../../markdown/block-extractor';
import { EditorStore } from '../../../../state/editor-store';

/**
 * 改ページ調整パネル。原稿の全トップレベルブロックを document 順に列挙し、
 * チェック = そのブロックの直前で改ページ。ファイル境界ブロックは常に改ページに
 * なるためチェック操作の対象外として案内のみ表示する。
 */

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
        </div>
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
      </section>
    }
  `,
})
export class BreakPanel {
  protected readonly store = inject(EditorStore);

  protected readonly multiFile = computed(
    () => new Set(this.store.blocks().map((b) => b.fileIndex)).size > 1,
  );

  protected readonly groups = computed<readonly FileGroup[]>(() => {
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


  protected toggleBreak(block: Block): void {
    this.store.toggleBreak(block.id);
  }
}
