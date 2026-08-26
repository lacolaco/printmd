import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideSheetMetrics } from './app/shared/paper/paper';
import { provideBaseFontSize } from './app/shared/typography/typography';

bootstrapApplication(App, {
  providers: [provideBrowserGlobalErrorListeners(), provideSheetMetrics(), provideBaseFontSize()],
}).catch((err) => console.error(err));
