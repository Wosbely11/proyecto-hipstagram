import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// 1. Importar withInterceptors de @angular/common/http
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// 2. Importar tu nuevo interceptor
import { authInterceptor } from './interceptors/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    // 3. Registrar el interceptor dentro de provideHttpClient
    provideHttpClient(withInterceptors([authInterceptor])) 
  ]
};