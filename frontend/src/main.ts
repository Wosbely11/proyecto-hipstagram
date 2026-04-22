
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// 1. Cambiamos la importación a AppComponent
import { AppComponent } from './app/app.component'; 

// 2. Le decimos a Angular que arranque usando AppComponent
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));