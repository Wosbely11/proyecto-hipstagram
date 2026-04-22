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
        // Guardamos el token que nos devuelve el backend
        this.authService.guardarToken(respuesta.token);
        
        // Aquí decidiremos a dónde enviarlo dependiendo de su rol
        // Por ahora lo enviamos a una ruta ficticia '/feed'
        this.router.navigate(['/feed']); 
      },
      error: (err) => {
        this.mensajeError = 'Credenciales incorrectas. Inténtalo de nuevo.';
        console.error(err);
      }
    });
  }
}