import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { FALLBACK } from './app/shared/paper/paper-catalog';
import { PaperStyles } from './app/shared/paper/paper-styles';

// 紙面の寸法と @page 規則は起動時に置く。以後の追随は Paper が担うが、
// 印刷できる状態であること自体を DI の到達性に依存させない
new PaperStyles(document).apply(FALLBACK);

bootstrapApplication(App, { providers: [provideBrowserGlobalErrorListeners()] }).catch((err) =>
  console.error(err),
);
