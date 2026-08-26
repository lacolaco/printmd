function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

/**
 * Toolbar は Enter/Space を選択に割り当て、`ngToolbarWidget` を付けた button の
 * click を合成しない。段送りのボタンは自前の keydown で受けるため、
 * その既定動作をここで止める
 */
export function preventSelection(event: KeyboardEvent): void {
  if (isActivationKey(event.key)) {
    event.preventDefault();
  }
}

/**
 * 発火してよい押下か。KeyboardEventManager は ignoreRepeat のため、長押しの
 * repeat では既定動作が止まらず click が合成される。二重発火を避けるため、
 * repeat でない押下だけを対象とする
 */
export function isActivating(event: KeyboardEvent): boolean {
  return isActivationKey(event.key) && !event.repeat;
}
