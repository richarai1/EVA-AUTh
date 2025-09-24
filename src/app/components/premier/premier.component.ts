import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';


import { Router } from '@angular/router';

@Component({
  selector: 'app-premier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="premier-container">
      <img src="assets/images/Premier.png" alt="Premier Dashboard" class="premier-image" (error)="onImgError($event)" />
    </div>
  `,
  styles: [`
    .premier-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f8fafc;
    }

    .premier-image {
      max-width: 100%;
      max-height: 100vh;
      object-fit: contain;
    }
  `]
})
export class PremierComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.chatService.resetChat();
      this.chatService.openChat();
    }, 1000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/Premier.png';
  }
}