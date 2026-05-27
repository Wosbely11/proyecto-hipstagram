import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userId: string | null = null;
  posts: any[] = [];
  loading = true;
  totalPosts = 0;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    // Captura el ID del usuario desde la ruta activa (ej: /profile/uuid-id)
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUserPosts();
    }
  }

  loadUserPosts() {
    this.http.get(`http://localhost:3002/user/${this.userId}`).subscribe({
      next: (res: any) => {
        this.posts = res.data;
        this.totalPosts = res.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando el perfil en la UI:', err);
        this.loading = false;
      }
    });
  }
}

