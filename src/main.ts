import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { applyGeometryStyles } from './app/page-geometry';

// 画面 CSS のページ寸法は page-geometry.ts を単一の情報源とする
applyGeometryStyles(document.documentElement);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
