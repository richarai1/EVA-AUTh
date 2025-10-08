import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

    @media (max-width: 768px) {
      .home-container {
        padding: 1rem;
      }
      
      .image-stack {
        gap: 1rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  constructor(private chatService: ChatService) {}

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
}
