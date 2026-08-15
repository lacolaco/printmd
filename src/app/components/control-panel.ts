import { Component } from '@angular/core';
import { BreakPanel } from './break-panel';
import { FilePanel } from './file-panel';
import { Footer } from './footer';

/** 調整パネル。原稿の管理と改ページ指定を束ねる右カラムの所有者 */
@Component({
  selector: 'app-control-panel',
  imports: [BreakPanel, FilePanel, Footer],
  host: {
    class:
      'app-panel block w-full shrink-0 overflow-y-auto border-t p-4 md:w-90 md:border-l md:border-t-0',
    role: 'complementary',
    'aria-label': '調整パネル',
  },
  template: `
    <app-file-panel />
    <app-break-panel />
    <app-footer class="mt-6 block border-t border-stone-200 pt-3" />
  `,
})
export class ControlPanel {}
