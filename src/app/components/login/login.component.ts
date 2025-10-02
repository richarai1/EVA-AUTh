import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [CommonModule, FormsModule], // Add CommonModule here
  template: `
    <div class="sign-in-container">
      <div class="sign-in-card">
        <div class="logo">
          <img src="assets/att-header-logo.svg" alt="AT&T Business" />
        </div>
        <h1 class="title">Sign in</h1>
      
       
        <form (ngSubmit)="handleSubmit()" class="login-form">
          <div class="form-group">
            <label for="inputField">{{ showPasswordField ? 'Password' : 'Username' }}</label>
            <input
              #inputField
              [type]="showPasswordField ? 'password' : 'text'"
              [(ngModel)]="inputValue"
              [name]="showPasswordField ? 'password' : 'username'"
              placeholder=" "
              required
            />
            <span *ngIf="showPasswordField" class="show-password" (click)="togglePasswordVisibility()">Show</span>
          </div>

          <div class="remember-me" *ngIf="!showPasswordField">
            <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
            <span>Remember me</span>
          </div>

          <button type="submit" class="continue-btn" [disabled]="!inputValue.trim()">
            {{ showPasswordField ? 'Sign in' : 'Continue' }}
          </button>
        </form>

        <div class="forgot-link" *ngIf="!showPasswordField">
          <a href="#" (click)="handleForgotUsername($event)">Forgot Username?</a>
        </div>
        <div class="forgot-link" *ngIf="showPasswordField">
          <a href="#" (click)="handleForgotPassword($event)">Forgot Password?</a>
        </div>

        <div class="get-started" *ngIf="!showPasswordField">
          <a href="#" (click)="handleGetStarted($event)">Don’t have a username? Get started now</a>
        </div>
        <div class="get-started" *ngIf="showPasswordField">
          <a href="#" (click)="handlePayWithoutSignIn($event)">Pay without signing in</a>
        </div>

        <footer class="footer">
          <div class="footer-links">
            <a href="#">Terms of use</a> |
            <a href="#">Privacy center</a> |
            <a href="#">Accessibility</a> |
            <a href="#">Your privacy choices</a> |
            <a href="#">Health privacy notice</a> |
            <a href="#">Cyber security</a>
          </div>
          <p>© 2025 AT&T Intellectual Property. All rights reserved. AT&T, the AT&T logo and all other AT&T marks contained herein are trademarks of AT&T.</p>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .sign-in-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #fff;
      padding: 20px;
    }
    .sign-in-card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 30px;
      width: 100%;
      max-width: 400px;
      height:700px;
      text-align: center;
    }
    .logo img {
      height: 64px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 1.5em;
      color: #00205b;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 1.2em;
      color: #333;
      margin-bottom: 20px;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .form-group {
      text-align: left;
      position: relative;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #000;
      font-weight: bold;
      font-size: 0.9em;
    }
    .form-group input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1em;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: none;
      border-color: #0057b8;
      box-shadow: 0 0 5px rgba(0, 87, 184, 0.3);
    }
    .show-password {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #0057b8;
      cursor: pointer;
      font-size: 0.9em;
    }
    .remember-me {
      text-align: left;
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.9em;
      color: #666;
    }
    .continue-btn {
      width: 100%;
      height: 48px;
      background: #0057b8;
      color: #fff;
      border: none;
      border-radius: 24px;
      font-size: 1em;
      cursor: pointer;
      margin-top: 10px;
    }
    .continue-btn:hover {
      background: #004494;
    }
    .continue-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .forgot-link, .get-started {
      margin: 30px 0;
      text-align: center;
      font-size: 0.9em;
    }
    .forgot-link a, .get-started a {
      color: var(--link-text3-default-color, #0057b8);
      font-weight:bold;
      text-decoration: none;
    }
    .forgot-link a:hover, .get-started a:hover {
      text-decoration: underline;
    }
    .footer {
      margin-top: 150px;
      text-align: center;
      font-size: 0.7em;
      color: #666;
    }
    .footer-links a {
      color: #0057b8;
      text-decoration: none;
      margin: 0 5px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnInit {
  inputValue: string = '';
  rememberMe: boolean = false;
  showPasswordField: boolean = false;
  passwordVisible: boolean = false;

  constructor(
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService
  ) {
    this.chatService.closeChat();
  }

  ngOnInit(): void {
    // Set the user flow context in AuthService based on where we're redirecting
    const redirectPath = this.authService.getRedirectPath();
    let userContext: 'consumer' | 'small-business' | 'enterprise' = 'consumer';
    if (redirectPath === '/small-business') {
      userContext = 'small-business';
    } else if (redirectPath === '/enterprise') {
      userContext = 'enterprise';
    }
    this.authService.setUserFlowContext(userContext);

    this.authService.logout();
    localStorage.clear();
  }

  handleSubmit() {
    if (!this.showPasswordField) {
      if (this.inputValue.trim()) {
        this.showPasswordField = true;
      } else {
        alert('Please enter a username');
      }
    } else {
      if (this.inputValue.trim()) {
        // Ensure the user flow context is set before login
        const redirectPath = this.authService.getRedirectPath();
        let userContext: 'consumer' | 'small-business' | 'enterprise' = 'consumer';
        if (redirectPath === '/small-business') {
          userContext = 'small-business';
        } else if (redirectPath === '/enterprise') {
          userContext = 'enterprise';
        }
        this.authService.setUserFlowContext(userContext);

        this.authService.login(this.inputValue, this.inputValue).subscribe({
          next: (success) => {
            if (success) {
              this.router.navigate([redirectPath]);
            } else {
              alert('Invalid credentials');
            }
          },
          error: (err) => {
            alert('An error occurred during login');
          }
        });
      } else {
        alert('Please enter a password');
      }
    }
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  handleForgotUsername(event: Event) {
    event.preventDefault();
    alert('Forgot username functionality would be implemented here');
  }

  handleForgotPassword(event: Event) {
    event.preventDefault();
    alert('Forgot password functionality would be implemented here');
  }

  handleGetStarted(event: Event) {
    event.preventDefault();
    alert('Get started functionality would be implemented here');
  }

  handlePayWithoutSignIn(event: Event) {
    event.preventDefault();
    alert('Pay without signing in functionality would be implemented here');
  }
}