function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

/**
 * Toolbar は Enter / Space を自前の選択へ割り当て、`ngToolbarWidget` を付けた
 * button の click を合成しない。段送りのボタンは自前の keydown で受けるため、
 * その既定動作をここで止める。
 * repeat かどうかを問わず止めるのは、KeyboardEventManager が ignoreRepeat の
 * ため repeat では Toolbar 側の抑止が働かず、click が合成されてしまうからである
 */
export function preventSelection(event: KeyboardEvent): void {
  if (isActivationKey(event.key)) {
    event.preventDefault();
  }
}

/**
 * 発火してよい押下か。長押しは repeat の押下を捨てて 1 段だけ送る
 * (自動連続送りは持たない)
 */
export function isActivating(event: KeyboardEvent): boolean {
  return isActivationKey(event.key) && !event.repeat;
}
