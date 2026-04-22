import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // En interceptores funcionales, usamos inject() para traer nuestros servicios
  const authService = inject(AuthService);
  const token = authService.obtenerToken();

  // Si existe un token en el localStorage, clonamos la petición y le agregamos el header
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  // Si no hay token (ej. al hacer login o registro), dejamos pasar la petición tal cual
  return next(req);
};