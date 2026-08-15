import { Component } from '@angular/core';
import { Footer } from './footer';
import { ImportDropzone } from './import-dropzone';

/** 空状態の画面。取り込み面と表記だけを持ち、原稿が入ると作業画面に交代する */
@Component({
  selector: 'app-import-screen',
  imports: [Footer, ImportDropzone],
  host: { class: 'block' },
  template: `
    <main class="relative h-full" aria-label="原稿の取り込み">
      <app-import-dropzone />
      <app-footer class="absolute bottom-3 left-0 right-0 text-center" />
    </main>
  `,
})
export class ImportScreen {}
