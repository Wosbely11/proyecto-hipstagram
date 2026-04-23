import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
//import { Router } from '@angular/router';
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
    this.authService.login(this.credenciales).subscribe({
      next: (respuesta) => {
        // Guardamos el token
        this.authService.guardarToken(respuesta.token);
        
        // NUEVO: Guardamos el rol en el LocalStorage

        const rolUsuario = respuesta.usuario?.rol || 'USER'; 
        localStorage.setItem('rol', rolUsuario);
        
        // Redirección inteligente
        if (rolUsuario === 'ADMIN') {
          this.router.navigate(['/admin']); 
        } else {
          this.router.navigate(['/feed']); 
        }
      },
      error: (err) => {
        this.mensajeError = 'Credenciales incorrectas. Inténtalo de nuevo.';
        console.error(err);
      }
    });
  }


}