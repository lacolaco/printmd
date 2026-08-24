import { Component, inject } from '@angular/core';
import { Footer } from './components/footer';
import { Header } from './components/header/header';
import { ImportDropzone } from './components/import-screen/import-dropzone';
import { PrintRoot } from './components/print-root';
import { Workspace } from './components/workspace/workspace';
import { AppViewModel } from './app.vm';

/** 画面骨格。ヘッダ / 画面の切替 / 印刷対象の配置 */
@Component({
  selector: 'app-root',
  providers: [AppViewModel],
  imports: [Footer, Header, ImportDropzone, PrintRoot, Workspace],
  template: `
    <div class="app-ui flex h-dvh flex-col">
      <app-header />
      @if (vm.nonEmpty()) {
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
