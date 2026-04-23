import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Construye las cabeceras incluyendo el token de seguridad
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  obtenerUsuarios(): Observable<any> {
    // Hace la petición al API Gateway (que lo mandará al user-service)
    return this.http.get(`${this.apiUrl}/users`, { headers: this.getHeaders() });
  }

  // --- NUEVO MÉTODO PARA CAMBIAR ESTADO ---
  cambiarEstadoUsuario(usuarioId: string, nuevoEstado: boolean): Observable<any> {
    const body = { 
      usuario_id: usuarioId, 
      activo: nuevoEstado 
    };
    // Hacemos un PUT a /users/admin/status
    return this.http.put(`${this.apiUrl}/users/admin/status`, body, { headers: this.getHeaders() });
  }

  // --- NUEVO MÉTODO PARA CAMBIAR ROL ---
  cambiarRolUsuario(usuarioId: string, nuevoRol: string): Observable<any> {
    const body = { 
      usuario_id: usuarioId, 
      rol: nuevoRol 
    };
    return this.http.put(`${this.apiUrl}/users/admin/role`, body, { headers: this.getHeaders() });
  }

}