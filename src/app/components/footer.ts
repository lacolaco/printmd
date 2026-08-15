import { Component } from '@angular/core';

/** アプリ下端の帯。著作権表記とライセンス導線 (ヘッダと対をなす恒常表記) */
@Component({
  selector: 'app-footer',
  host: { class: 'block shrink-0' },
  template: `
    <footer
      class="app-footer flex h-7 items-center justify-center gap-1 border-t px-4 text-xs text-stone-500"
    >
      &copy; 2026 lacolaco ・
      <a
        class="underline hover:text-stone-800"
        href="https://github.com/lacolaco/printmd"
        rel="noopener"
        >ソースコード</a
      >
      ・
      <a class="underline hover:text-stone-800" href="/3rdpartylicenses.txt" rel="noopener"
        >サードパーティライセンス</a
      >
    </footer>
  `,
})
export class Footer {}
