import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importante para [(ngModel)]
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { PostService } from '../../services/post/post.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule], // Agregamos FormsModule
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit {
  
  publicaciones: any[] = [];
  
  // Variables para nueva publicación
  nuevoTexto: string = '';
  archivoSeleccionado: File | null = null;
  vistaPreviaImagen: string | ArrayBuffer | null = null;

  // --- NUEVA VARIABLE: Diccionario para rastrear los clicks locales y pintar los botones ---
  misVotos: { [postId: string]: number } = {};

  // --- NUEVA VARIABLE: Controla qué pestaña visualiza el usuario ---
  vistaActual: 'recientes' | 'populares' = 'recientes';

  constructor(
    private authService: AuthService, 
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarFeed();
  }

  get publicacionesOrdenadas() {
    if (this.vistaActual === 'populares') {
      // Creamos una copia con [...array] para no alterar el feed original y ordenamos por likes descendentemente
      return [...this.publicaciones].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    // Si es 'recientes', retorna el feed por defecto de PostgreSQL (por fecha)
    return this.publicaciones;
  }

  cargarFeed() {
    this.postService.obtenerFeed().subscribe({
      next: (data) => {
        this.publicaciones = data; // Asignamos lo que viene de PostgreSQL
      },
      error: (err) => console.error('Error al cargar el feed', err)
    });
  }

  seleccionarImagen(event: any) {
    const file = event.target.files[0];
    
    if (file) {
      // VALIDACIÓN: Verificar si el archivo seleccionado NO es una imagen
      if (!file.type.startsWith('image/')) {
        alert('❌ Archivo no válido. Por favor, selecciona únicamente archivos de imagen (PNG, JPG, JPEG, WEBP, etc.).');
        
        // Limpiamos los estados físicos para bloquear el botón de Publicar
        this.archivoSeleccionado = null;
        this.vistaPreviaImagen = null;
        
        // Limpiamos el valor del input en el DOM para que si vuelven a dar click, responda correctamente
        event.target.value = '';
        return;
      }

      // Si pasa la validación, procedemos normalmente con la subida y la vista previa
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

    // Usamos FormData porque estamos enviando un archivo físico
    const formData = new FormData();
    formData.append('image', this.archivoSeleccionado);
    formData.append('descripcion', this.nuevoTexto);

    this.postService.crearPublicacion(formData).subscribe({
      next: (respuesta) => {
        // Limpiamos el formulario
        this.nuevoTexto = '';
        this.archivoSeleccionado = null;
        this.vistaPreviaImagen = null;
        // Recargamos el feed para ver la nueva foto
        this.cargarFeed();
      },
      error: (err) => console.error('Error al publicar', err)
    });
  }

  // --- FUNCIÓN VOTAR MODIFICADA ---
  votar(postId: string, tipo: number) {
    // 1. Guardamos el voto visualmente al instante para que [ngClass] cambie el color
    this.misVotos[postId] = tipo;

    // 2. Enviamos la petición al backend
    this.postService.votar(postId, tipo).subscribe({
      next: () => this.cargarFeed(), // Recargamos para ver el nuevo conteo
      error: (err) => alert('Ocurrió un error al procesar el voto')
    });
  }

  // 3. Agrega la función para enviar el comentario
  enviarComentario(postId: string, texto: string) {
    if (!texto.trim()) return; // Evita enviar comentarios vacíos
    
    // VALIDACIÓN PREVENTIVA: Detener si excede los 128 caracteres
    if (texto.length > 128) {
      alert('El comentario no puede ser mayor a 128 caracteres.');
      return;
    }
    
    this.postService.comentar(postId, texto).subscribe({
      next: () => {
        console.log('Comentario publicado');
        this.cargarFeed(); // Recarga para ver el comentario si lo muestras en el feed
      },
      error: (err) => {
        console.error('Error al comentar', err);
        // Si el backend rechaza la petición, mostramos el mensaje de error de tu interaction-service
        alert(err.error?.error || 'Error al guardar el comentario');
      }
    });
  }

  terminoBusqueda: string = '';

  buscar() {
    if (!this.terminoBusqueda.trim()) {
      this.cargarFeed();
      return;
    }
    this.postService.buscarPosts(this.terminoBusqueda).subscribe({
      next: (data) => this.publicaciones = data,
      error: (err) => console.error(err)
    });
  }

  // Función para limpiar la búsqueda y recargar el feed completo
  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.cargarFeed();
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}