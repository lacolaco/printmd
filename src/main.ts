import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { FALLBACK } from './app/shared/paper/paper-catalog';
import { PaperStyles } from './app/shared/paper/paper-styles';

// 印刷できる状態を DI の到達性に依存させない (以後の追随は Paper が担う)
new PaperStyles(document).apply(FALLBACK);

bootstrapApplication(App, { providers: [provideBrowserGlobalErrorListeners()] }).catch((err) =>
  console.error(err),
);
