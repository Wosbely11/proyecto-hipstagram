import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { PostService } from '../../services/post/post.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit {
  
  // Lista original (Intocable, mantiene el orden por fecha)
  publicaciones: any[] = [];
  
  // NUEVA VARIABLE: Lista que realmente se dibujará en el HTML
  publicacionesRenderizadas: any[] = [];
  
  nuevoTexto: string = '';
  archivoSeleccionado: File | null = null;
  vistaPreviaImagen: string | ArrayBuffer | null = null;
  misVotos: { [postId: string]: number } = {};

  vistaActual: 'recientes' | 'populares' = 'recientes';
  terminoBusqueda: string = '';

  constructor(
    private authService: AuthService, 
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarFeed();
  }

  cargarFeed() {
    this.postService.obtenerFeed().subscribe({
      next: (data) => {
        // Validación de seguridad: Asegurarnos de que siempre sea un Array
        this.publicaciones = Array.isArray(data) ? data : []; 
        this.actualizarVista(); // Renderizamos según la pestaña actual
      },
      error: (err) => console.error('Error al cargar el feed', err)
    });
  }

  // --- NUEVA FUNCIÓN: Controla el cambio de pestañas de forma segura ---
  cambiarVista(vista: 'recientes' | 'populares') {
    this.vistaActual = vista;
    this.actualizarVista();
  }

  // --- NUEVA FUNCIÓN: Ordena los posts solo cuando es estrictamente necesario ---
  actualizarVista() {
    if (this.vistaActual === 'populares') {
      // Ordena por Likes (de mayor a menor)
      this.publicacionesRenderizadas = [...this.publicaciones].sort((a, b) => {
        const likesA = Number(a.likes) || 0;
        const likesB = Number(b.likes) || 0;
        return likesB - likesA; 
      });
    } else {
      // Si es "Recientes", la mostramos tal como vino del backend
      this.publicacionesRenderizadas = [...this.publicaciones];
    }
  }

  seleccionarImagen(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('❌ Archivo no válido. Por favor, selecciona únicamente archivos de imagen.');
        this.archivoSeleccionado = null;
        this.vistaPreviaImagen = null;
        event.target.value = '';
        return;
      }
      this.archivoSeleccionado = file;
      const reader = new FileReader();
      reader.onload = e => this.vistaPreviaImagen = reader.result;
      reader.readAsDataURL(file);
    }
  }

  publicar() {
    if (!this.archivoSeleccionado) {
      alert('Por favor selecciona una imagen');
      return;
    }
    const formData = new FormData();
    formData.append('image', this.archivoSeleccionado);
    formData.append('descripcion', this.nuevoTexto);

    this.postService.crearPublicacion(formData).subscribe({
      next: () => {
        this.nuevoTexto = '';
        this.archivoSeleccionado = null;
        this.vistaPreviaImagen = null;
        this.cargarFeed(); // Al recargar, actualizarVista() se llamará automáticamente
      },
      error: (err) => console.error('Error al publicar', err)
    });
  }

  votar(postId: string, tipo: number) {
    this.misVotos[postId] = tipo;
    this.postService.votar(postId, tipo).subscribe({
      next: () => this.cargarFeed(),
      error: () => alert('Ocurrió un error al procesar el voto')
    });
  }

  enviarComentario(postId: string, texto: string) {
    if (!texto.trim()) return;
    if (texto.length > 128) {
      alert('El comentario no puede ser mayor a 128 caracteres.');
      return;
    }
    this.postService.comentar(postId, texto).subscribe({
      next: () => this.cargarFeed(),
      error: (err) => alert(err.error?.error || 'Error al guardar el comentario')
    });
  }

  buscar() {
    if (!this.terminoBusqueda.trim()) {
      this.cargarFeed();
      return;
    }
    this.postService.buscarPosts(this.terminoBusqueda).subscribe({
      next: (data) => {
        this.publicaciones = Array.isArray(data) ? data : [];
        this.actualizarVista();
      },
      error: (err) => console.error(err)
    });
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.cargarFeed();
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}