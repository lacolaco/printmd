import { Injector, afterNextRender } from '@angular/core';

/**
 * 移動でボタンが disabled になるとフォーカスが body へ落ちる。同じファイルの
 * 操作ボタンへ戻す (押した方向が無効なら反対方向のボタンへ)
 */
function refocusMoveButton(host: HTMLElement, id: number, delta: -1 | 1): void {
  const selector = (dir: number) => `button[data-move-file="${id}"][data-move-dir="${dir}"]`;
  const preferred = host.querySelector<HTMLButtonElement>(selector(delta));
  const fallback = host.querySelector<HTMLButtonElement>(selector(-delta));
  (preferred?.disabled === false ? preferred : fallback)?.focus();
}

/** レンダリング反映後にフォーカスを戻す */
export function focusLater(injector: Injector, host: HTMLElement, id: number, delta: -1 | 1): void {
  afterNextRender(() => refocusMoveButton(host, id, delta), { injector });
}
