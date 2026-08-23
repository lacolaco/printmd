import { Service, computed, signal } from '@angular/core';
import { A4, MM_TO_PX } from './page-geometry';

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
 * 初期ズーム段の決定。利用可能幅に A4 紙面が収まる最大の段を選ぶ。
 * 100% (実寸 = 印刷判断の基準) を上限とし、自動では拡大しない
 */
export function defaultZoomIndex(viewportWidth: number, hasSideColumn: boolean): number {
  const available = viewportWidth - (hasSideColumn ? PANEL_WIDTH : 0) - GUTTERS;
  const fit = Math.min(1, available / (A4.page.width * MM_TO_PX));
  return largestFitting(fit);
}

/** matchMedia を持たない環境 (jsdom) では実寸を既定にする */
export function startupStep(): number {
  return typeof window.matchMedia !== 'function'
    ? ZOOMS.indexOf(1)
    : defaultZoomIndex(window.innerWidth, window.matchMedia('(min-width: 768px)').matches);
}

/** 段を delta ぶん送る (両端で頭打ち) */
export function stepped(step: number, delta: -1 | 1): number {
  return Math.min(ZOOMS.length - 1, Math.max(0, step + delta));
}

export function isAtLimit(step: number, delta: -1 | 1): boolean {
  return delta === -1 ? step === 0 : step === ZOOMS.length - 1;
}

/** 表示倍率。100% = A4 実寸。段の保有と段送り・可否・表示文言を担う */
@Service()
export class Zoom {
  private readonly step = signal(startupStep());

  readonly index = this.step.asReadonly();
  readonly value = computed(() => ZOOMS[this.index()]);
  readonly label = computed(() => `${Math.round(this.value() * 100)}%`);

  stepBy(delta: -1 | 1): void {
    this.step.set(stepped(this.index(), delta));
  }

  isSteppable(delta: -1 | 1): boolean {
    return !isAtLimit(this.index(), delta);
  }
}
