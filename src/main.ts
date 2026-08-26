import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideSheetMetrics } from './app/shared/paper/paper';

bootstrapApplication(App, {
  providers: [provideBrowserGlobalErrorListeners(), provideSheetMetrics()],
}).catch((err) => console.error(err));
