import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  // En los guards funcionales usamos inject() para traer los servicios
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isAuthenticated(); 
  const rol = localStorage.getItem('rol'); 

  if (isLoggedIn && rol === 'ADMIN') {
    return true; // ¡Adelante, jefe!
  }

  console.warn('Acceso denegado: Se requieren privilegios de Administrador');
  router.navigate(['/feed']);
  return false;
};