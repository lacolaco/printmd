import { Component, inject } from '@angular/core';
import { BreakPanel } from './components/break-panel';
import { FilePanel } from './components/file-panel';
import { Header } from './components/header';
import { Preview } from './components/preview';
import { PrintRoot } from './components/print-root';
import { EditorStore } from './state/editor-store';

/** 画面骨格。取り込みドロップの受け口とレイアウト切替だけを持つ */
@Component({
  selector: 'app-root',
  imports: [BreakPanel, FilePanel, Header, Preview, PrintRoot],
  templateUrl: './app.html',
})
export class App {
  protected readonly store = inject(EditorStore);

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files !== null) void this.store.addFiles([...input.files]);
    input.value = '';
  }

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
