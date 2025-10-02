import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <div class="image-stack">
        <img
          src="assets/home.png"
          alt="Home Image 1"
          class="home-image"
        />
      </div>

      <div class="business-navigation">
        <button class="nav-button" (click)="navigateToSmallBusiness()">
          Small Business Solutions
        </button>
        <button class="nav-button enterprise-btn" (click)="navigateToEnterprise()">
          Enterprise Solutions
        </button>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
     
    }

    .image-stack {
      
      width: 100%;
    }

    .home-image {
      width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      display: block;
    }

    .home-image:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .business-navigation {
      position: fixed;
      bottom: 40px;
      right: 40px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      z-index: 100;
    }

    .nav-button {
      background: #0057b8;
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 24px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 87, 184, 0.3);
      white-space: nowrap;
    }

    .nav-button:hover {
      background: #004494;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 87, 184, 0.4);
    }

    .enterprise-btn {
      background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
    }

    .enterprise-btn:hover {
      background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%);
    }

    @media (max-width: 768px) {
      .home-container {
        padding: 1rem;
      }

      .image-stack {
        gap: 1rem;
      }

      .business-navigation {
        bottom: 20px;
        right: 20px;
        gap: 12px;
      }

      .nav-button {
        padding: 12px 24px;
        font-size: 14px;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  constructor(
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chatService.setUserFlowContext('consumer');

    // Check if user just signed in and chat should be reopened
    const shouldReopenChat = sessionStorage.getItem('reopenChatAfterLogin');
    if (shouldReopenChat) {
      sessionStorage.removeItem('reopenChatAfterLogin');
      
      setTimeout(() => {
        this.chatService.openChat();
        
        // Show signed in status after a short delay
        setTimeout(() => {
          this.chatService.showSignedInStatus();
          
          // Then reinitialize after login
          setTimeout(() => {
            this.chatService.reinitializeAfterLogin();
          }, 800); // Increased delay
        }, 800); // Increased delay
      }, 1200); // Increased initial delay
    } else {
      // For regular authenticated users, just open chat normally
      // The welcome header will show automatically
    }
  }

  navigateToSmallBusiness(): void {
    this.router.navigate(['/small-business']);
  }

  navigateToEnterprise(): void {
    this.router.navigate(['/enterprise']);
  }
}
