import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { applyPageGeometryCssVariables } from './app/page-geometry';

// 画面 CSS のページ寸法は page-geometry.ts が正典 (単一情報源)
applyPageGeometryCssVariables(document.documentElement);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
