function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

/**
 * Toolbar は Enter と Space を自分の選択へ割り当て、ウィジェットの button の
 * click を発火させない。ボタンの動作は keydown で受ける必要がある。
 * 繰り返しかどうかを問わず既定動作を止めるのは、KeyboardEventManager が
 * ignoreRepeat のため、長押しの繰り返しでは Toolbar 側の抑止が働かず
 * ブラウザが click を合成してしまうからである
 */
export function preventToolbarSelection(event: KeyboardEvent): void {
  if (isActivationKey(event.key)) {
    event.preventDefault();
  }
}

/** 発火してよい押下か。長押しの繰り返しは 2 度目以降を捨てる */
export function isActivating(event: KeyboardEvent): boolean {
  return isActivationKey(event.key) && !event.repeat;
}
