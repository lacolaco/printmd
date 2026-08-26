import { Service, inject, linkedSignal, type WritableSignal } from '@angular/core';
import type { PaperFormat } from '../paper/paper-format';
import { Paper } from '../paper/paper';
import { Steps } from '../support/steps';

/** 選べる倍率の段 (小さい順) と段送り。1 = 紙の実寸 */
export const ZOOMS = new Steps(
  [0.5, 0.75, 1, 1.25, 1.5, 2],
  (level) => `${Math.round(level * 100)}%`,
);

/** md ブレークポイント以上で右カラム (調整パネル) が占める幅 (単位 px) */
const PANEL_WIDTH = 360;
/** 紙面の左右に確保する余白ぶん (単位 px) */
const GUTTERS = 48;

function largest(ratio: number): number {
  return ZOOMS.items.filter((level) => level <= ratio).at(-1) ?? ZOOMS.items[0];
}

/**
 * 初期ズーム段の決定。利用可能幅に紙面が収まる最大の段を選ぶ。
 * 100% (実寸 = 印刷判断の基準) を上限とし、自動では拡大しない
 */
export function fittingLevel(
  viewportWidth: number,
  hasSideColumn: boolean,
  format: PaperFormat,
): number {
  const available = viewportWidth - (hasSideColumn ? PANEL_WIDTH : 0) - GUTTERS;
  return largest(Math.min(1, available / format.widthPx()));
}

function isSideColumnShown(): boolean {
  return window.matchMedia('(min-width: 768px)').matches;
}

/** matchMedia を持たない環境 (jsdom) では実寸を既定にする */
function onStartup(format: PaperFormat): number {
  return typeof window.matchMedia !== 'function'
    ? 1
    : fittingLevel(window.innerWidth, isSideColumnShown(), format);
}

/** 表示倍率。100% = 紙の実寸。現在の段を保有する */
@Service()
export class Zoom {
  private readonly paper = inject(Paper);

  /**
   * 書式が変われば収まる段へ組み直す。
   * Signal Forms の模型として書き込みも受ける
   */
  readonly value: WritableSignal<number> = linkedSignal<PaperFormat, number>({
    source: this.paper.format,
    computation: (format) => onStartup(format),
  });

  /** 段を delta ぶん送る (両端で頭打ち) */
  stepBy(delta: -1 | 1): void {
    this.value.set(ZOOMS.next(this.value(), delta));
  }
}
