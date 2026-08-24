import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { applyGeometryStyles } from './app/pagination/page-geometry';

// 画面 CSS のページ寸法は page-geometry.ts を単一の情報源とする
applyGeometryStyles(document.documentElement);

bootstrapApplication(App, { providers: [provideBrowserGlobalErrorListeners()] }).catch((err) =>
  console.error(err),
);
