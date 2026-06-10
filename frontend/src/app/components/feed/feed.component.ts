import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { PostService } from '../../services/post/post.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit {


  // Inyecta directamente el HttpClient al inicio de la clase
  private http = inject(HttpClient);
  
  // Lista original (Intocable, mantiene el orden por fecha)
  publicaciones: any[] = [];
  
  // NUEVA VARIABLE: Lista que realmente se dibujará en el HTML
  publicacionesRenderizadas: any[] = [];

  // --- NUEVA VARIABLE: Guarda el objeto del post que se va a abrir en el modal ---
  postSeleccionado: any | null = null;

  // Variables de control de vista (UNIFICADAS)
  vistaActual: 'recientes' | 'populares' | 'perfil' = 'recientes';
  misPublicaciones: any[] = [];
  fotoPerfilUrl: string | null = null;
  miUsuario: any = null; // Guardará { id, username } tras leer tu token de sesión // Dejará de ser null al leer el token

  nuevoTexto: string = '';
  archivoSeleccionado: File | null = null;
  vistaPreviaImagen: string | ArrayBuffer | null = null;
  misVotos: { [postId: string]: number } = {};
  terminoBusqueda: string = '';

  constructor(
    private authService: AuthService, 
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {

    // 1. Lo primero es obtener la identidad del usuario logueado desde el Token
    this.obtenerDatosUsuarioDesdeToken();

    // 2. Luego cargas las publicaciones desde tu servicio/API
    //this.cargarPublicaciones();
    this.cargarFeed();  
  }

  // NUEVA FUNCIÓN: Rompe el JWT y extrae id, username y rol
  obtenerDatosUsuarioDesdeToken() {
    const token = localStorage.getItem('token'); 
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadDecodificado = JSON.parse(atob(payloadBase64));
        console.log("Datos que vienen en el Token:", payloadDecodificado);
        
        // CORRECCIÓN: Si payloadDecodificado.username no existe, intentamos usar otra propiedad común como 'nombre' o 'id'
        const usernameDetectado = payloadDecodificado.username || payloadDecodificado.nombre || 'usuario_anonimo';

        this.miUsuario = {
          id: payloadDecodificado.id || payloadDecodificado.id_usuario,
          username: usernameDetectado,
          rol: payloadDecodificado.rol || 'USER'
        };

        // Ahora cargamos la foto de perfil localmente con un nombre seguro
        this.cargarFotoPerfilLocal();
      } catch (error) {
        console.error('Error crítico al decodificar el token de sesión:', error);
      }
    }
  }

  cargarFeed() {
    this.postService.obtenerFeed().subscribe({
      next: (data: any) => {
        this.publicaciones = Array.isArray(data) ? data : []; 
        this.actualizarVista(); // Renderizamos según la pestaña actual

        // --- NUEVO: Si el modal de detalles está abierto, actualizamos sus datos en tiempo real ---
        if (this.postSeleccionado) {
          const postActualizado = this.publicaciones.find((p: any) => p.id === this.postSeleccionado.id);
          if (postActualizado) {
            this.postSeleccionado = postActualizado;
          }
        }
      },
      error: (err: any) => console.error('Error al cargar el feed', err)
    });
  }

  // --- NUEVA FUNCIÓN: Controla el cambio de pestañas de forma segura ---
  cambiarVista(vista: 'recientes' | 'populares') {
    this.vistaActual = vista;
    this.actualizarVista();
  }

  

  // --- NUEVA FUNCIÓN: Ordena los posts solo cuando es estrictamente necesario ---
actualizarVista() {
    if (this.vistaActual === 'recientes') {
      this.publicacionesRenderizadas = [...this.publicaciones].sort(
        (a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
      );
    } else if (this.vistaActual === 'populares') {
      this.publicacionesRenderizadas = [...this.publicaciones].sort(
        (a, b) => (b.likes || 0) - (a.likes || 0)
      );
    } else if (this.vistaActual === 'perfil') {
      // VALIDACIÓN: Si el usuario está correctamente identificado, filtramos la lista global
      if (this.miUsuario && this.miUsuario.id) {
        this.publicacionesRenderizadas = this.publicaciones.filter(
          (p: any) => p.usuario_id === this.miUsuario.id
        );
      } else {
        this.publicacionesRenderizadas = [];
      }
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
      reader.onload = (e: any) => this.vistaPreviaImagen = reader.result;
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
      error: (err: any) => console.error('Error al publicar', err)
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
      error: (err: any) => alert(err.error?.error || 'Error al guardar el comentario')
    });
  }

  buscar() {
    if (!this.terminoBusqueda.trim()) {
      this.cargarFeed();
      return;
    }
    this.postService.buscarPosts(this.terminoBusqueda).subscribe({
      next: (data: any) => {
        this.publicaciones = Array.isArray(data) ? data : [];
        this.actualizarVista();
      },
      error: (err: any) => console.error(err)
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

  // --- NUEVAS FUNCIÓNES PARA MANEJAR EL MODAL ---
  abrirModal(post: any) {
    this.postSeleccionado = post;
    document.body.style.overflow = 'hidden'; 
  }

  cerrarModal() {
    this.postSeleccionado = null;
    document.body.style.overflow = 'auto'; 
  }

  regresarAlInicio() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Llama a esta función cuando el usuario haga clic en la pestaña "Mi Perfil"
  cambiarAVistaPerfil() {
    this.vistaActual = 'perfil';
    this.actualizarVista(); // Esto ya filtra las publicaciones correctamente porque this.miUsuario.id ya existe

    // Solo cargamos la foto, la información del usuario ya la tenemos desde el Token
    this.cargarFotoPerfilLocal();
  }

  // Carga la foto desde LocalStorage usando el username como clave única
  cargarFotoPerfilLocal() {
    if (this.miUsuario?.username) {
      this.fotoPerfilUrl = localStorage.getItem(`perfil_pic_${this.miUsuario.username}`);
    }
  }

  // Guarda la imagen de la publicación seleccionada como foto de perfil
  seleccionarComoFotoPerfil(urlImagen: string) {
    if (this.miUsuario?.username) {
      localStorage.setItem(`perfil_pic_${this.miUsuario.username}`, urlImagen);
      this.fotoPerfilUrl = urlImagen;
      alert('¡Foto de perfil actualizada!');
    }
  }
//función eliminarPublicacion
  // función eliminarPublicacion
  eliminarPublicacion(idPost: string) { 
    if (confirm('¿Estás seguro de que deseas eliminar de forma permanente esta publicación?')) {
      
      // Obtenemos el token de sesión
      const token = localStorage.getItem('token'); 
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      // CAMBIO APLICADO AQUÍ: Usamos el puerto 8080 y agregamos el prefijo /posts
      this.http.delete(`http://localhost:8080/posts/delete/${idPost}`, { headers }).subscribe({
        next: () => {
          // Filtramos el post eliminado de tus arreglos locales para actualizar la interfaz
          this.misPublicaciones = this.misPublicaciones.filter((p: any) => p.id !== idPost);
          this.publicaciones = this.publicaciones.filter((p: any) => p.id !== idPost);
          
          // Si el post estaba abierto en el modal, lo cerramos
          if (this.postSeleccionado && this.postSeleccionado.id === idPost) {
             this.postSeleccionado = null;
          }

          // Forzamos la actualización de la pantalla
          this.actualizarVista();
          alert('Publicación eliminada correctamente.');
        },
        error: (err: any) => {
          console.error('Error al eliminar el post en el frontend:', err);
          alert('Hubo un error al intentar eliminar la publicación.');
        }
      });
    }
  }

  onSeleccionarFotoPerfil(event: any) {
  const file = event.target.files[0];
  if (file) {
    console.log("Foto lista para subir:", file.name);
    // Próximo paso: conectar el servicio para subir la imagen a AWS S3
  }
}
  
}