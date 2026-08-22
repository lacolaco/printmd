import { Component } from '@angular/core';
import { ImportDropzone } from './import-dropzone';

/** 空状態の画面。取り込み面と表記だけを持ち、原稿が入ると作業画面に交代する */
@Component({
  selector: 'app-import-screen',
  imports: [ImportDropzone],
  host: { class: 'block' },
  template: `
    <main class="h-full" aria-label="原稿の取り込み">
      <app-import-dropzone />
    </main>
  `,
})
export class ImportScreen {}
