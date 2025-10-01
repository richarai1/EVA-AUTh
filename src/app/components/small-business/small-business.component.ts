import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { ChatWidgetComponent } from '../chat-widget/chat-widget.component';

@Component({
  selector: 'app-small-business',
  standalone: true,
  imports: [CommonModule, ChatWidgetComponent],
  template: `
    <div class="small-business-container">
      <header class="header">
        <img src="assets/att-header-logo.svg" alt="AT&T" class="logo" />
        <nav class="nav">
          <a href="#" class="nav-link">Shop</a>
          <a href="#" class="nav-link">Why AT&T Business</a>
          <a href="#" class="nav-link">Support</a>
          <button class="sign-in-btn" (click)="navigateToLogin()">Sign in</button>
        </nav>
      </header>

      <main class="main-content">
        <section class="hero-section">
          <h1>Small Business Solutions</h1>
          <p class="subtitle">Powerful connectivity and tools to help your business grow</p>
          <button class="chat-btn" (click)="openChat()">Chat with us</button>
        </section>

        <section class="features-section">
          <div class="feature-card">
            <h3>Business Internet</h3>
            <p>Fast, reliable internet for your business needs</p>
          </div>
          <div class="feature-card">
            <h3>Business Phone</h3>
            <p>Stay connected with advanced phone solutions</p>
          </div>
          <div class="feature-card">
            <h3>Business Wireless</h3>
            <p>Mobile solutions that keep you productive</p>
          </div>
        </section>
      </main>

      <app-chat-widget></app-chat-widget>
    </div>
  `,
  styles: [`
    .small-business-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .header {
      background: white;
      padding: 16px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .logo {
      height: 48px;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .nav-link {
      color: #333;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-link:hover {
      color: #0057b8;
    }

    .sign-in-btn {
      background: #0057b8;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 20px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .sign-in-btn:hover {
      background: #004494;
    }

    .main-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 64px 24px;
    }

    .hero-section {
      text-align: center;
      margin-bottom: 80px;
    }

    .hero-section h1 {
      font-size: 48px;
      color: #00205b;
      margin-bottom: 16px;
      font-weight: 700;
    }

    .subtitle {
      font-size: 20px;
      color: #555;
      margin-bottom: 32px;
    }

    .chat-btn {
      background: #0057b8;
      color: white;
      border: none;
      padding: 16px 48px;
      border-radius: 24px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0, 87, 184, 0.3);
    }

    .chat-btn:hover {
      background: #004494;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 87, 184, 0.4);
    }

    .features-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 32px;
    }

    .feature-card {
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }

    .feature-card h3 {
      color: #00205b;
      font-size: 24px;
      margin-bottom: 12px;
    }

    .feature-card p {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .header {
        padding: 16px 24px;
      }

      .nav {
        gap: 16px;
      }

      .hero-section h1 {
        font-size: 32px;
      }

      .features-section {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SmallBusinessComponent implements OnInit {
  constructor(
    private router: Router,
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
      }, 500);
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  openChat(): void {
    this.chatService.openChat();
  }
}
