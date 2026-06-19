import { ApplicationConfig } from '@angular/core';
// Experimental zoneless change detection is available in Angular 18.
// It removes the dependency on Zone.js and uses Signals as the source of reactivity.
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient()
  ]
};
