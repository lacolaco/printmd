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
  templateUrl: './app.html',
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
