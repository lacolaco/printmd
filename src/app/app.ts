import { Component, inject } from '@angular/core';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { ImportScreen } from './components/import-screen/import-screen';
import { PrintRoot } from './components/print-root';
import { Workspace } from './components/workspace/workspace';
import { sourcesFrom } from './manuscript/manuscript';
import { Editor } from './components/editor';
import { ManuscriptState } from './state/manuscript-state';

/** 画面骨格。ヘッダ / 画面の切替 / 印刷対象の配置と、ウィンドウ全体のドロップ受け */
@Component({
  selector: 'app-root',
  imports: [Footer, Header, ImportScreen, PrintRoot, Workspace],
  template: `
    <div
      class="app-ui flex h-dvh flex-col"
      (dragover)="permitDrag($event)"
      (drop)="acceptDrop($event)"
    >
      <app-header />
      @if (store.nonEmpty()) {
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
  protected readonly store = inject(ManuscriptState);
  private readonly editor = inject(Editor);

  /** ウィンドウ全体をドロップ先にする (誤ドロップでのページ遷移も防ぐ) */
  protected permitDrag(event: DragEvent): void {
    event.preventDefault();
  }

  protected acceptDrop(event: DragEvent): void {
    event.preventDefault();
    this.editor.addFiles(sourcesFrom(event.dataTransfer?.files));
  }
}
