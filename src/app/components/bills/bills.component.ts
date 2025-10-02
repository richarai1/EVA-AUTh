import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bills-container">
      <div class="background-image"></div>
    </div>
  `,
  styles: [`
    .bills-container {
      min-height: 100vh;
      width: 100%;
      position: relative;
      overflow: hidden;
    }

    .background-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('/assets/image-12.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
  `]
})
export class BillsComponent implements OnInit {
  constructor(
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const shouldReopenChat = sessionStorage.getItem('reopenChatAfterLogin');
    if (shouldReopenChat) {
      sessionStorage.removeItem('reopenChatAfterLogin');

      setTimeout(() => {
        this.chatService.openChat();

        // Reinitialize after login with delay
        setTimeout(() => {
          this.chatService.reinitializeAfterLogin();
        }, 800);
      }, 1200);
    }
  }
}
