import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { AdminService } from '../../services/admin/admin.service'; // <-- Importamos el servicio

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  
  vistaActual: 'usuarios' | 'auditoria' | 'moderacion' = 'usuarios';
  
  // Arreglo para guardar los usuarios que nos manda el backend
  usuarios: any[] = []; 

  constructor(
    private authService: AuthService, 
    private adminService: AdminService, // <-- Lo inyectamos aquí
    private router: Router
  ) {}

  // Esto se ejecuta automáticamente al abrir el panel
  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.adminService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        console.log("Usuarios cargados:", this.usuarios); // <-- Un log para confirmar
      },
      error: (err) => console.error('Error al cargar usuarios:', err)
    });
  }

  alternarEstado(usuario: any) {
    // Invertimos el estado actual (si es true pasa a false, y viceversa)
    const nuevoEstado = !usuario.activo; 

    // Opcional pero recomendado: Preguntar al admin si está seguro
    const confirmacion = confirm(`¿Estás seguro de que deseas ${nuevoEstado ? 'ACTIVAR' : 'SUSPENDER'} a ${usuario.username}?`);
    
    if (confirmacion) {
      this.adminService.cambiarEstadoUsuario(usuario.id, nuevoEstado).subscribe({
        next: (res) => {
          // Si el backend responde con éxito, actualizamos el estado visualmente en la tabla
          usuario.activo = nuevoEstado;
          console.log("Éxito:", res.message);
        },
        error: (err) => {
          console.error('Error al cambiar el estado del usuario:', err);
          alert('Hubo un error al intentar cambiar el estado.');
        }
      });
    }
  }

  cambiarVista(vista: 'usuarios' | 'auditoria' | 'moderacion') {
    this.vistaActual = vista;
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}