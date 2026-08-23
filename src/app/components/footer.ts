import { Component, VERSION } from '@angular/core';

/** アプリ下端の帯。著作権表記とライセンス導線と実行時 Angular バージョン (ヘッダと対をなす恒常表記) */
@Component({
  selector: 'app-footer',
  host: { class: 'block shrink-0' },
  template: `
    <footer
      class="app-footer flex min-h-7 items-center justify-center border-t px-4 py-1 text-center text-xs text-stone-500"
    >
      <p class="break-keep">
        &copy; 2026 lacolaco・
        <a
          class="underline hover:text-stone-800"
          href="https://github.com/lacolaco/printmd"
          rel="noopener"
          >ソースコード</a
        >・
        <a class="underline hover:text-stone-800" href="/3rdpartylicenses.txt" rel="noopener"
          >サードパーティライセンス</a
        >・ Angular v{{ angularVersion }}
      </p>
    </footer>
  `,
})
export class Footer {
  protected readonly angularVersion = VERSION.full;
}
