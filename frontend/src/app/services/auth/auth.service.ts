import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Tomamos la URL base desde el environment (http://localhost:8080)
  private apiUrl = environment.apiUrl;

  // Inyectamos el HttpClient para poder hacer peticiones
  constructor(private http: HttpClient) { }

  // Método para hacer login
  login(credenciales: any): Observable<any> {
    // Esto hará un POST a http://localhost:8080/auth/login
    return this.http.post(`${this.apiUrl}/auth/login`, credenciales);
  }

  // NUEVO: Método para registrar un usuario
  registro(usuario: any): Observable<any> {
    // Esto hará un POST a http://localhost:8080/auth/register
    return this.http.post(`${this.apiUrl}/auth/register`, usuario);
  }

  // Verifica si el usuario tiene un token guardado (sesión activa)
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    // Retorna true si el token existe, false si no existe
    return !!token; 
  }

  // Métodos útiles para manejar el Token en el navegador
  // Guarda el token en el almacenamiento local del navegador
  guardarToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Recupera el token (lo usaremos más adelante para las peticiones)
  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  // Cierra la sesión eliminando el token
  logout(): void {
    localStorage.removeItem('token');
  }
}