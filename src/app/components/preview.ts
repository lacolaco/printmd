import {
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  type ElementRef,
} from '@angular/core';
import type { MasterDocument } from '../markdown/block-extractor';
import { applyForcedBreaks } from '../markdown/block-extractor';
import { EditorStore } from '../state/editor-store';
import { ViewerState } from '../state/viewer-state';
import { COLUMN_GAP_MM, COLUMN_STEP_MM, MM_TO_PX } from '../page-geometry';


/**
 * プレビュー: CSS 多段組を流用したページ分割。マスター要素を段幅 178mm の
 * 多段組コンテナへ複製し、段 i だけを見せる窓 (178mm × 265mm, overflow
 * hidden) を A4 シートとして縦に積む。
 * 改ページの指定は右カラムの調整パネルが担い、紙面は表示専用
 */
@Component({
  selector: 'app-preview',
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <div
        class="app-workspace min-h-0 flex-1 overflow-auto py-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-700"
        tabindex="0"
        role="region"
        aria-label="紙面 (矢印キーでスクロール。各ページのブロック境界に改ページ指定ボタンがあります)"
      >
        <div class="mx-auto w-fit" #sheetsHost [style.zoom]="viewer.zoom()"></div>
      </div>
    </div>
  `,
})
export class Preview {
  private readonly store = inject(EditorStore);
  protected readonly viewer = inject(ViewerState);

  private readonly sheetsHost = viewChild.required<ElementRef<HTMLElement>>('sheetsHost');

  constructor() {
    effect(() => {
      this.rebuild(this.store.master(), this.store.breaks());
    });
  }

  /** 可視シートの遅延実体化に使う。rebuild ごとに張り直す */
  private observer: IntersectionObserver | null = null;

  private rebuild(master: MasterDocument | null, breaks: ReadonlySet<string>): void {
    const host = this.sheetsHost().nativeElement;
    this.observer?.disconnect();
    this.observer = null;
    host.replaceChildren();
    if (master === null) {
      this.viewer.pageCount.set(0);
      return;
    }
    const count = this.measurePageCount(master, breaks);
    this.viewer.pageCount.set(count);
    // 大部数対策: シートは空の枠だけ並べ、可視域に入ったものだけ中身を実体化する
    const lazy = typeof IntersectionObserver !== 'undefined';
    if (lazy) {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            this.fillSheet(entry.target as HTMLElement, master, breaks);
            this.observer?.unobserve(entry.target);
          }
        },
        { rootMargin: '600px 0px' },
      );
    }
    for (let index = 0; index < count; index++) {
      const sheet = document.createElement('div');
      sheet.className = 'sheet';
      sheet.dataset['page'] = String(index + 1);
      host.append(sheet);
      if (lazy) this.observer?.observe(sheet);
      else this.fillSheet(sheet, master, breaks);
    }
  }

  /** シートへ段組クローンの窓を実体化する。実体化済みなら何もしない */
  private fillSheet(sheet: HTMLElement, master: MasterDocument, breaks: ReadonlySet<string>): void {
    if (sheet.childElementCount > 0) return;
    const index = Number(sheet.dataset['page']) - 1;
    const clip = document.createElement('div');
    clip.className = 'clip';
    const mc = this.buildColumnClone(master, breaks);
    mc.style.marginLeft = `${-(index * COLUMN_STEP_MM)}mm`;
    // 紙面の複製は読み上げ・フォーカスの対象から外す (本文は原稿と印刷マスターが担う)
    mc.setAttribute('inert', '');
    clip.append(mc);
    sheet.append(clip);
  }

  /**
   * 段組クローンを 1 つ作る。段数の計測とページ切り出しの両方で使う。
   * innerHTML の直列化 + 再パースはシートごとに全文を再解析して高くつくため、
   * cloneNode で複製する (マスターはリスナーを持たない静的マークアップ)
   */
  private buildColumnClone(master: MasterDocument, breaks: ReadonlySet<string>): HTMLElement {
    const mc = master.container.cloneNode(true) as HTMLElement;
    mc.className = 'mc markdown-body';
    // クローンは元の状態を引き継がない前提で、改ページクラスを描画時に適用する
    applyForcedBreaks(mc, master.blocks, breaks);
    return mc;
  }

  private measurePageCount(master: MasterDocument, breaks: ReadonlySet<string>): number {
    const probe = document.createElement('div');
    probe.className = 'preview-probe';
    const probeMc = this.buildColumnClone(master, breaks);
    probe.append(probeMc);
    document.body.append(probe);
    const count = Math.max(1, Math.round((probeMc.scrollWidth + COLUMN_GAP_MM * MM_TO_PX) / (COLUMN_STEP_MM * MM_TO_PX)));
    probe.remove();
    return count;
  }
}
