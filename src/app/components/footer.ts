import { Component } from '@angular/core';

/** 著作権表記とライセンス導線。配置は親が決める (レイアウト非依存) */
@Component({
  selector: 'app-footer',
  template: `
    <footer class="text-xs text-stone-500">
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
