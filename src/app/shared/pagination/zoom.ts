import { Service, computed, inject, linkedSignal } from '@angular/core';
import type { PaperFormat } from '../paper/paper-format';
import { Paper } from '../paper/paper';

export const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** md ブレークポイント以上で右カラム (調整パネル) が占める幅 (単位 px) */
const PANEL_WIDTH = 360;
/** 紙面の左右に確保する余白ぶん (単位 px) */
const GUTTERS = 48;

function largestFitting(fit: number): number {
  let index = 0;
  ZOOMS.forEach((zoom, i) => {
    if (zoom <= fit) {
      index = i;
    }
  });
  return index;
}

/**
 * 初期ズーム段の決定。利用可能幅に紙面が収まる最大の段を選ぶ。
 * 100% (実寸 = 印刷判断の基準) を上限とし、自動では拡大しない
 */
export function defaultZoomIndex(
  viewportWidth: number,
  hasSideColumn: boolean,
  format: PaperFormat,
): number {
  const available = viewportWidth - (hasSideColumn ? PANEL_WIDTH : 0) - GUTTERS;
  const fit = Math.min(1, available / format.widthPx());
  return largestFitting(fit);
}

/** matchMedia を持たない環境 (jsdom) では実寸を既定にする */
function startupStep(format: PaperFormat): number {
  return typeof window.matchMedia !== 'function'
    ? ZOOMS.indexOf(1)
    : defaultZoomIndex(window.innerWidth, window.matchMedia('(min-width: 768px)').matches, format);
}

/** 段を delta ぶん送る (両端で頭打ち) */
function stepped(step: number, delta: -1 | 1): number {
  return Math.min(ZOOMS.length - 1, Math.max(0, step + delta));
}

function isAtLimit(step: number, delta: -1 | 1): boolean {
  return delta === -1 ? step === 0 : step === ZOOMS.length - 1;
}

/** 表示倍率。100% = 紙の実寸。段の保有と段送り・可否・表示文言を担う */
@Service()
export class Zoom {
  private readonly paper = inject(Paper);

  /** 書式が変われば収まる段へ組み直す */
  private readonly step = linkedSignal<PaperFormat, number>({
    source: this.paper.format,
    computation: (format) => startupStep(format),
  });

  /** 現在の段 (ZOOMS の添字) */
  readonly index = this.step.asReadonly();
  /** 表示倍率 (1 = 紙の実寸) */
  readonly value = computed(() => ZOOMS[this.index()]);
  /** 表示用の百分率文言 */
  readonly label = computed(() => `${Math.round(this.value() * 100)}%`);

  /** 段を delta ぶん送る (両端で頭打ち) */
  stepBy(delta: -1 | 1): void {
    this.step.set(stepped(this.index(), delta));
  }

  /** delta 方向へまだ段を送れるか */
  isSteppable(delta: -1 | 1): boolean {
    return !isAtLimit(this.index(), delta);
  }
}
