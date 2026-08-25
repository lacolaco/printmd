import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { CssVariables } from './app/shared/paper/css-variables';
import { DEFAULT_PAPER } from './app/shared/paper/paper-catalog';

// 画面 CSS のページ寸法は PaperFormat を単一の情報源とする
new CssVariables(document).apply(DEFAULT_PAPER);

bootstrapApplication(App, { providers: [provideBrowserGlobalErrorListeners()] }).catch((err) =>
  console.error(err),
);
