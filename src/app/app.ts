import { Component, inject } from '@angular/core';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { ImportScreen } from './components/import-screen';
import { PrintRoot } from './components/print-root';
import { Workspace } from './components/workspace';
import { EditorStore } from './state/editor-store';

/** 画面骨格。ヘッダ / 画面の切替 / 印刷対象の配置と、ウィンドウ全体のドロップ受け */
@Component({
  selector: 'app-root',
  imports: [Footer, Header, ImportScreen, PrintRoot, Workspace],
  template: `
    <div
      class="app-ui flex h-dvh flex-col"
      (dragover)="onWindowDragOver($event)"
      (drop)="onWindowDrop($event)"
    >
      <app-header />
      @if (store.hasFiles()) {
        <app-workspace class="min-h-0 flex-1" />
      } @else {
        <app-import-screen class="min-h-0 flex-1" />
      }
      <app-footer />
    </div>

    <!-- 印刷対象。画面では非表示、@media print のみ可視化する (アプリ UI は同時に隠す) -->
    <app-print-root />
  `,
})
export class App {
  protected readonly store = inject(EditorStore);

  /** ウィンドウ全体をドロップ先にする (誤ドロップでのページ遷移も防ぐ) */
  protected onWindowDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected onWindowDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files !== undefined && files.length > 0) void this.store.addFiles([...files]);
  }
}
