import { Component, computed, input, output } from '@angular/core';
import type { BlockKind } from '../../../shared/markdown/block-extractor';
import type { BlockRow } from '../../../shared/markdown/block-groups';

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

/**
 * 改ページ一覧の 1 行。ファイル境界ブロックは常に改ページになるため
 * チェック操作の対象外として案内のみ表示する
 */
@Component({
  selector: 'app-break-row-item',
  template: `
    @if (row().block.isFileBoundary) {
      <p class="py-1 pr-1.5 text-sm text-stone-500" [style.padding-left.px]="indent()">
        <span
          class="mr-1 inline-block rounded bg-stone-100 px-1 text-[10px] text-stone-600"
          aria-hidden="true"
          >{{ kindLabel() }}</span
        >
        <span class="break-all">{{ row().block.label || kindLabel() }}</span>
        <span class="ml-1 text-xs text-stone-400">(ファイル境界、常に改ページ)</span>
      </p>
    } @else {
      <label
        class="flex cursor-pointer items-start gap-2 rounded py-1 pr-1.5 text-sm hover:bg-stone-100"
        [style.padding-left.px]="indent()"
      >
        <input
          type="checkbox"
          class="mt-0.5 shrink-0"
          [checked]="isChecked()"
          (change)="toggled.emit()"
        />
        <span class="min-w-0">
          <span
            class="mr-1 inline-block rounded bg-stone-100 px-1 text-[10px] text-stone-600"
            aria-hidden="true"
            >{{ kindLabel() }}</span
          >
          <span class="break-all text-stone-800" [class.font-medium]="isEmphasized()">{{
            row().block.label || kindLabel()
          }}</span>
        </span>
      </label>
    }
  `,
})
export class BreakRowItem {
  readonly row = input.required<BlockRow>();
  readonly isChecked = input.required<boolean>();
  readonly toggled = output<void>();

  protected readonly kindLabel = computed(() => KIND_LABELS[this.row().block.kind]);

  /** 基本の 6px + 階層インデント。深さは表示上 5 段で頭打ちにする */
  protected readonly indent = computed(() => 6 + Math.min(this.row().depth - 1, 4) * 12);

  protected readonly isEmphasized = computed(() => {
    const block = this.row().block;
    return block.kind === 'heading' && (block.level ?? 1) <= 2;
  });
}
