import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // Importamos FormsModule para leer los inputs
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  credenciales = {
    email: '',
    password: ''
  };
  
  mensajeError: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  iniciarSesion() {
    this.mensajeError = '';

    this.authService.login(this.credenciales).subscribe({
      next: (respuesta) => {
        
        // MIRA EN LA CONSOLA DEL NAVEGADOR QUÉ TRAE EXACTAMENTE 'user'
        console.log("Datos recibidos del backend:", respuesta);

        // Validación flexible: Atrapa false, 0, o "false" en string
        const estadoActivo = respuesta.user?.activo;
        
        if (estadoActivo === false || estadoActivo === 0 || estadoActivo === 'false') {
          this.mensajeError = 'Usuario no activo, comuníquese con el administrador.';
          alert('⚠️ Usuario no activo, comuníquese con el administrador.');
          return; 
        }

        // Guardamos el token
        this.authService.guardarToken(respuesta.token);
        const rolUsuario = respuesta.user?.rol || 'USER'; 
        localStorage.setItem('rol', rolUsuario);
        
        if (rolUsuario === 'ADMIN') {
          this.router.navigate(['/admin']); 
        } else {
          this.router.navigate(['/feed']); 
        }
      },
      error: (err) => {
        // Este bloque atrapará el error 403 si aplicas el paso 1 en el backend
        if (err.status === 403 || err.error?.error === "Usuario inactivo") {
          this.mensajeError = 'Usuario no activo, comuníquese con el administrador.';
          alert('⚠️ Usuario no activo, comuníquese con el administrador.');
        } else {
          this.mensajeError = 'Credenciales incorrectas. Inténtalo de nuevo.';
        }
      }
    });
  }
}