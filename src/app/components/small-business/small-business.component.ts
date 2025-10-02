import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { ChatWidgetComponent } from '../chat-widget/chat-widget.component';

@Component({
  selector: 'app-small-business',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-container">
      <div class="background-image"></div>
    </div>
  `,
  styles: [`
    .payment-container {
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
      background-image: url('/assets/business.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
  `]
})
export class SmallBusinessComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.chatService.setUserFlowContext('small-business');

    // Check if user just signed in and chat should be reopened
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

  navigateToLogin(): void {
    this.authService.setRedirectPath('/small-business');
    this.router.navigate(['/login']);
  }

  openChat(): void {
    this.chatService.openChat();
  }
}
