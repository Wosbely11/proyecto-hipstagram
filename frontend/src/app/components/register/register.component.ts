import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // Importamos Router y RouterLink
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // Agregamos RouterLink aquí
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  nuevoUsuario = {
    username: '', // Tu backend seguramente espera un nombre de usuario
    email: '',
    password: ''
  };
  
  mensajeError: string = '';
  mensajeExito: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  registrarUsuario() {
    this.authService.registro(this.nuevoUsuario).subscribe({
      next: (respuesta) => {
        this.mensajeExito = '¡Cuenta creada con éxito! Redirigiendo al login...';
        this.mensajeError = '';
        
        // Esperamos 2 segundos para que el usuario lea el mensaje y lo enviamos al login
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.mensajeError = 'Hubo un error al crear la cuenta. Verifica tus datos.';
        this.mensajeExito = '';
        console.error(err);
      }
    });
  }
}