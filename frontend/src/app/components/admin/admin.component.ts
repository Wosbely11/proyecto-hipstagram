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

  cambiarVista(vista: 'usuarios' | 'auditoria' | 'moderacion') {
    this.vistaActual = vista;
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}