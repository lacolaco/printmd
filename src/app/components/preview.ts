import { Component, computed, effect, inject, signal, viewChild, type ElementRef } from '@angular/core';
import { EditorStore } from '../state/editor-store';

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
/** 1mm を CSS px に換算する係数 (96dpi 基準) */
const MM = 96 / 25.4;
/** A4 版面幅 (178mm) + 段間 (16mm) */
const COLUMN_STEP_MM = 194;

/**
 * プレビュー: CSS 多段組を流用したページ分割。マスター要素を段幅 178mm の
 * 多段組コンテナへ複製し、段 i だけを見せる窓 (178mm × 265mm, overflow
 * hidden) を A4 シートとして縦に積む。段数の計測とシート構築は DOM の実測に
 * 依存するため、jsdom では段数は常に 1 に丸まる (構造アサーションに留める)
 */
@Component({
  selector: 'app-preview',
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <div
        class="flex shrink-0 items-center justify-center gap-2 border-b border-stone-200 bg-stone-50 py-1.5 text-xs text-stone-700"
        role="toolbar"
        aria-label="プレビュー操作"
      >
        <span role="status" aria-live="polite">{{ pageCountLabel() }}</span>
        <span aria-hidden="true" class="text-stone-300">|</span>
        <button
          type="button"
          class="rounded px-2 py-0.5 hover:bg-stone-200 disabled:opacity-30"
          [disabled]="zoomIndex() === 0"
          aria-label="縮小"
          (click)="setZoom(-1)"
        >
          −
        </button>
        <span class="w-10 text-center">{{ zoomLabel() }}</span>
        <button
          type="button"
          class="rounded px-2 py-0.5 hover:bg-stone-200 disabled:opacity-30"
          [disabled]="zoomIndex() === ZOOMS.length - 1"
          aria-label="拡大"
          (click)="setZoom(1)"
        >
          ＋
        </button>
      </div>
      <!-- 紙面は視覚プレビュー。支援技術には原稿ファイルとブロック一覧が本文を担うため、
           複製された紙面は inert で焦点・読み上げの対象から外す (リンク等の複製が
           フォーカス可能なまま残ると aria-hidden-focus 違反になる)。
           スクロール領域自体はキーボードで操作できるよう focusable にする -->
      <div
        class="min-h-0 flex-1 overflow-auto bg-stone-200 py-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
        tabindex="0"
        role="region"
        aria-label="印刷プレビューの紙面 (矢印キーでスクロール)"
      >
        <div class="mx-auto w-fit" #sheetsHost [style.zoom]="zoom()" inert></div>
      </div>
    </div>
  `,
})
export class Preview {
  protected readonly ZOOMS = ZOOMS;
  private readonly store = inject(EditorStore);

  protected readonly zoomIndex = signal(2);
  protected readonly zoom = computed(() => ZOOMS[this.zoomIndex()]);
  protected readonly zoomLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);

  protected readonly pageCount = signal(0);
  protected readonly pageCountLabel = computed(() =>
    this.pageCount() === 0 ? '- ページ' : `${this.pageCount()} ページ`,
  );

  private readonly sheetsHost = viewChild.required<ElementRef<HTMLElement>>('sheetsHost');

  constructor() {
    effect(() => {
      this.rebuild(this.store.printableMaster()?.container ?? null);
    });
  }

  protected setZoom(delta: -1 | 1): void {
    this.zoomIndex.update((i) => Math.min(ZOOMS.length - 1, Math.max(0, i + delta)));
  }

  /** 可視シートの遅延実体化に使う。rebuild ごとに張り直す */
  private observer: IntersectionObserver | null = null;

  private rebuild(master: HTMLElement | null): void {
    const host = this.sheetsHost().nativeElement;
    this.observer?.disconnect();
    this.observer = null;
    host.replaceChildren();
    if (master === null) {
      this.pageCount.set(0);
      return;
    }
    const count = this.measurePageCount(master);
    this.pageCount.set(count);
    // 大部数対策: シートは空の枠だけ並べ、可視域に入ったものだけ中身を実体化する。
    // 全クローン実体化は 62 ページ実測でトグル 1 回 15 秒超のメインスレッド専有になった
    const lazy = typeof IntersectionObserver !== 'undefined';
    if (lazy) {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            this.fillSheet(entry.target as HTMLElement, master);
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
      else this.fillSheet(sheet, master);
    }
  }

  /** シートへ段組クローンの窓を実体化する。実体化済みなら何もしない */
  private fillSheet(sheet: HTMLElement, master: HTMLElement): void {
    if (sheet.childElementCount > 0) return;
    const index = Number(sheet.dataset['page']) - 1;
    const clip = document.createElement('div');
    clip.className = 'clip';
    const mc = this.buildColumnClone(master);
    mc.style.marginLeft = `${-(index * COLUMN_STEP_MM)}mm`;
    clip.append(mc);
    sheet.append(clip);
  }

  /** 段組クローンを 1 つ作る。段数の計測とページ切り出しの両方で使う */
  private buildColumnClone(master: HTMLElement): HTMLElement {
    const mc = document.createElement('div');
    mc.className = 'mc markdown-body';
    mc.innerHTML = master.innerHTML;
    return mc;
  }

  private measurePageCount(master: HTMLElement): number {
    const probe = document.createElement('div');
    probe.className = 'preview-probe';
    const probeMc = this.buildColumnClone(master);
    probe.append(probeMc);
    document.body.append(probe);
    const count = Math.max(1, Math.round((probeMc.scrollWidth + 16 * MM) / (COLUMN_STEP_MM * MM)));
    probe.remove();
    return count;
  }
}
