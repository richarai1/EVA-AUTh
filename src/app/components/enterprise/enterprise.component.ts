import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { ChatWidgetComponent } from '../chat-widget/chat-widget.component';

@Component({
  selector: 'app-enterprise',
  standalone: true,
  imports: [CommonModule, ChatWidgetComponent],
  template: `
    <div class="enterprise-container">
      <header class="header">
        <img src="assets/att-header-logo.svg" alt="AT&T" class="logo" />
        <nav class="nav">
          <a href="#" class="nav-link">Solutions</a>
          <a href="#" class="nav-link">Industries</a>
          <a href="#" class="nav-link">Resources</a>
          <a href="#" class="nav-link">Support</a>
          <button class="sign-in-btn" (click)="navigateToLogin()">Sign in</button>
        </nav>
      </header>

      <main class="main-content">
        <section class="hero-section">
          <h1>Enterprise Solutions</h1>
          <p class="subtitle">Transform your business with advanced connectivity, security, and innovation</p>
          <button class="chat-btn" (click)="openChat()">Chat with us</button>
        </section>

        <section class="features-section">
          <div class="feature-card">
            <div class="icon">🌐</div>
            <h3>Network Solutions</h3>
            <p>Enterprise-grade networking with global reach and reliability</p>
          </div>
          <div class="feature-card">
            <div class="icon">🔒</div>
            <h3>Cybersecurity</h3>
            <p>Advanced security solutions to protect your enterprise</p>
          </div>
          <div class="feature-card">
            <div class="icon">☁️</div>
            <h3>Cloud Services</h3>
            <p>Scalable cloud infrastructure for modern enterprises</p>
          </div>
          <div class="feature-card">
            <div class="icon">📱</div>
            <h3>Mobility Solutions</h3>
            <p>Empower your workforce with enterprise mobility</p>
          </div>
          <div class="feature-card">
            <div class="icon">🤖</div>
            <h3>IoT & 5G</h3>
            <p>Next-generation connectivity for digital transformation</p>
          </div>
          <div class="feature-card">
            <div class="icon">📊</div>
            <h3>Analytics & AI</h3>
            <p>Data-driven insights to optimize your operations</p>
          </div>
        </section>
      </main>

      <app-chat-widget></app-chat-widget>
    </div>
  `,
  styles: [`
    .enterprise-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }

    .header {
      background: rgba(255, 255, 255, 0.98);
      padding: 16px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
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
      max-width: 1400px;
      margin: 0 auto;
      padding: 80px 24px;
    }

    .hero-section {
      text-align: center;
      margin-bottom: 100px;
    }

    .hero-section h1 {
      font-size: 56px;
      color: #ffffff;
      margin-bottom: 20px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .subtitle {
      font-size: 22px;
      color: #e0e0e0;
      margin-bottom: 40px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }

    .chat-btn {
      background: linear-gradient(135deg, #0057b8 0%, #00a8e1 100%);
      color: white;
      border: none;
      padding: 18px 56px;
      border-radius: 28px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 6px 20px rgba(0, 168, 225, 0.4);
    }

    .chat-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 168, 225, 0.5);
    }

    .features-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 32px;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.95);
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      transition: all 0.3s;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .feature-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
      background: white;
    }

    .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .feature-card h3 {
      color: #00205b;
      font-size: 26px;
      margin-bottom: 16px;
      font-weight: 700;
    }

    .feature-card p {
      color: #555;
      font-size: 16px;
      line-height: 1.7;
    }

    @media (max-width: 768px) {
      .header {
        padding: 16px 24px;
      }

      .nav {
        gap: 16px;
      }

      .hero-section h1 {
        font-size: 36px;
      }

      .subtitle {
        font-size: 18px;
      }

      .features-section {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EnterpriseComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.chatService.setUserFlowContext('enterprise');

    const shouldReopenChat = sessionStorage.getItem('reopenChatAfterLogin');
    if (shouldReopenChat) {
      sessionStorage.removeItem('reopenChatAfterLogin');

      setTimeout(() => {
        this.chatService.openChat();
      }, 500);
    }
  }

  navigateToLogin(): void {
    this.authService.setRedirectPath('/enterprise');
    this.chatService.openChat();
    setTimeout(() => {
      this.chatService.handleButtonClick('login');
    }, 500);
  }

  openChat(): void {
    this.chatService.openChat();
  }
}
