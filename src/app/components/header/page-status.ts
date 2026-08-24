import { Component, input } from '@angular/core';

/** 頁数の表示。受け取った文言を読み上げ対象として掲げるだけのプレーンな面 */
@Component({
  selector: 'app-page-status',
  host: { class: 'contents' },
  template: `<span role="status" aria-live="polite">{{ label() }}</span>`,
})
export class PageStatus {
  readonly label = input('');
}
