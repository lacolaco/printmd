import { Component, inject } from '@angular/core';
import { Footer } from './feature/footer/footer';
import { Header } from './feature/header/header';
import { ImportDropzone } from './feature/import/import-dropzone';
import { PrintRoot } from './feature/print/print-root';
import { Toolbar } from './feature/toolbar/toolbar';
import { Workspace } from './feature/workspace/workspace';
import { AppViewModel } from './app.vm';

/** 画面骨格。ヘッダ / 画面の切替 / 印刷対象の配置 */
@Component({
  selector: 'app-root',
  providers: [AppViewModel],
  imports: [Footer, Header, ImportDropzone, PrintRoot, Toolbar, Workspace],
  template: `
    <div class="app-ui flex h-dvh flex-col">
      <app-header />
      @if (vm.isNonEmpty()) {
        <app-toolbar />
        <app-workspace class="min-h-0 flex-1" />
      } @else {
        <main class="min-h-0 flex-1" aria-label="原稿の取り込み">
          <app-import-dropzone class="block h-full" />
        </main>
      }
      <app-footer />
    </div>

    <!-- 印刷対象。画面では非表示、@media print のみ可視化する (アプリ UI は同時に隠す) -->
    <app-print-root />
  `,
})
export class App {
  protected readonly vm = inject(AppViewModel);
}
