import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { FeedComponent } from './components/feed/feed.component';
import { AdminComponent } from './components/admin/admin.component'; // Lo crearemos en el paso 3
import { adminGuard } from './guards/admin/admin.guard';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'feed', component: FeedComponent },
  { path: 'profile/:id', component: ProfileComponent }, // Ruta para el perfil de usuario, con parámetro de ID
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] }, // <-- Con minúscula

  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
