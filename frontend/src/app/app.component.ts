import { Component } from '@angular/core';
// IMPORTANTE: Asegúrate de que esto esté importado
import { RouterOutlet } from '@angular/router'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // <-- Y que esté aquí en el arreglo de imports
  templateUrl: './app.component.html',
  styleUrl: './app.component.css' // o .scss dependiendo de lo que tengas
})
export class AppComponent {
  title = 'frontend';
}