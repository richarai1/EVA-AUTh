import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage } from '../../models/chat.model';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Chat Panel -->
    <div *ngIf="isOpen" class="chat-panel">
      <div class="chat-header">
        <img src="assets/att_header_logo.svg" alt="AT&T Logo" class="att-logo" width="50px" height="50px"/>
        <button (click)="closeChat()" class="close-button" aria-label="Close chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let message of messages" class="message" [class.user-message]="message.isUser">
          <!-- BOT MESSAGE -->
          <div *ngIf="!message.isUser" class="bot-card">
            <div class="bot-avatar-text">
              <img src="assets/avatar.svg" alt="Bot Avatar" class="bot-avatar" />
              <div class="bot-message-content">
                <!-- Text Card -->
                <div *ngIf="message.card.type === 'text'" class="message-text">
                  {{ message.card.text }}
                </div>
                <!-- General Card -->
                <div *ngIf="message.card.type === 'card'" class="card-content">
                  <h4 *ngIf="message.card.title" class="card-title">{{ message.card.title }}</h4>
                  <h5 *ngIf="message.card.subtitle" class="card-subtitle">{{ message.card.subtitle }}</h5>
                  <p *ngIf="message.card.text" class="card-text">{{ message.card.text }}</p>
                  <img *ngIf="message.card.imageUrl" [src]="message.card.imageUrl" alt="Card image" class="card-image" />
                </div>
                <!-- Bill Summary Card -->
                <div *ngIf="message.card.type === 'bill-summary' && message.card.billData" class="bill-summary-card">
                  <div class="bill-header">
                    <div class="bill-header-content">
                      <div class="bill-header-row">
                      
                        <div class="company-info">
                          <span class="company-name">{{ message.card.billData.companyName }}</span>
                          <span class="company-address">{{ message.card.billData.companyAddress }}</span>
                        </div>
                      </div>
                      <div class="bill-header-row">
                        <div class="bill-meta-item">
                          <span class="meta-label">Page</span>
                          <span class="meta-value">{{ message.card.billData.pageInfo }}</span>
                        </div>
                        <div class="bill-meta-item">
                          <span class="meta-label">Issue Date</span>
                          <span class="meta-value">{{ message.card.billData.issueDate }}</span>
                        </div>
                        <div class="bill-meta-item">
                          <span class="meta-label">Account Number</span>
                          <span class="meta-value">{{ message.card.billData.accountNumber }}</span>
                        </div>
                        <div class="bill-meta-item">
                          <span class="meta-label">Foundation Account</span>
                          <span class="meta-value">{{ message.card.billData.foundationAccount }}</span>
                        </div>
                        <div class="bill-meta-item">
                          <span class="meta-label">Invoice</span>
                          <span class="meta-value">{{ message.card.billData.invoice }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="bill-main-content">
                    <div class="bill-left-content">
                      <div class="autopay-section">
                        <strong>AutoPay:</strong> Save time and money with AutoPay. Enroll today!
                      </div>
                      <div class="premier-section">
                        Visit <a href="https://att.com/premier">att.com/premier</a> for exclusive offers.
                      </div>
                    </div>
                    <div class="bill-right-content">
                      <div class="total-due-circle">
                        <div class="circle-content">
                          <div class="total-due-label">Total Due</div>
                          <div class="total-due-amount">{{ message.card.billData.totalDue.toFixed(2) }}</div>
                          <div class="due-date-info">
                            <div class="pay-by-label">Pay by</div>
                            <div class="due-date">{{ message.card.billData.dueDate }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="account-summary">
                    <h3 class="section-title">Account Summary</h3>
                    <div class="summary-item">
                      <span class="summary-label">Last Bill</span>
                      <span class="summary-amount">{{ message.card.billData.lastBill.toFixed(2) }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Payment - {{ message.card.billData.paymentDate }}</span>
                      <span class="summary-amount payment-credit">{{ message.card.billData.paymentAmount.toFixed(2) }}</span>
                    </div>
                    <div class="summary-item remaining-balance">
                      <span class="summary-label">Remaining Balance</span>
                      <span class="summary-amount">{{ message.card.billData.remainingBalance.toFixed(2) }}</span>
                    </div>
                  </div>
                  <div class="service-summary">
                    <h3 class="section-title">Service Summary</h3>
                    <div *ngFor="let service of message.card.billData.services" class="service-item">
                      <div class="service-left">
                        <span class="service-icon">📱</span>
                        <div>
                          <div class="service-name">{{ service.name }}</div>
                          <div class="service-page">{{ service.pageRef }}</div>
                        </div>
                      </div>
                      <span class="service-amount">{{ service.amount.toFixed(2) }}</span>
                    </div>
                    <div class="total-services-row">
                      <span class="total-services-label">Total Services</span>
                      <span class="total-services-amount">{{ message.card.billData.totalServices.toFixed(2) }}</span>
                    </div>
                  </div>
                  <div class="final-total">
                    <div class="final-total-content">
                      <div class="final-total-left">
                        <span class="final-total-label">Total Amount Due</span>
                        <span class="final-due-date">Due {{ message.card.billData.dueDate }}</span>
                      </div>
                      <span class="final-total-amount">{{ message.card.billData.totalDue.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
                <!-- Form Card (Optional, if needed) -->
                <div *ngIf="message.card.type === 'form'" class="card-content">
                  <h4 *ngIf="message.card.title" class="card-title">{{ message.card.title }}</h4>
                  <h5 *ngIf="message.card.subtitle" class="card-subtitle">{{ message.card.subtitle }}</h5>
                  <p *ngIf="message.card.text" class="card-text">{{ message.card.text }}</p>
                  <form class="form-content">
                    <div *ngFor="let field of message.card.formFields" class="form-field">
                      <label>{{ field.label }}</label>
                      <input
                        *ngIf="field.type === 'text' || field.type === 'number'"
                        [type]="field.type"
                        [name]="field.name"
                        [placeholder]="field.placeholder || ''"
                        class="form-input"
                      />
                      <select *ngIf="field.type === 'select'" [name]="field.name" class="form-select">
                        <option *ngFor="let option of field.options" [value]="option">{{ option }}</option>
                      </select>
                    </div>
                  </form>
                </div>
                <!-- Buttons -->
                <div *ngIf="message.card.buttons && message.card.buttons.length > 0" class="message-buttons">
                  <button 
                    *ngFor="let button of message.card.buttons"
                    (click)="handleButtonClick(button.action, button.data)"
                    class="action-button"
                  >
                    {{ button.text }}
                  </button>
                </div>
                <!-- Timestamp -->
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- USER MESSAGE -->
          <div *ngIf="message.isUser" class="user-card">
            <div *ngIf="message.card.type === 'text'" class="message-text">
              {{ message.card.text }}
            </div>
            <div *ngIf="message.card.type === 'card'" class="card-content">
              <h4 *ngIf="message.card.title" class="card-title">{{ message.card.title }}</h4>
              <h5 *ngIf="message.card.subtitle" class="card-subtitle">{{ message.card.subtitle }}</h5>
              <p *ngIf="message.card.text" class="card-text">{{ message.card.text }}</p>
              <img *ngIf="message.card.imageUrl" [src]="message.card.imageUrl" alt="Card image" class="card-image" />
            </div>
            <div *ngIf="message.card.buttons && message.card.buttons.length > 0" class="message-buttons">
              <button 
                *ngFor="let button of message.card.buttons"
                (click)="handleButtonClick(button.action, button.data)"
                class="action-button"
              >
                {{ button.text }}
              </button>
            </div>
            <div class="message-time-user">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <form (ngSubmit)="sendMessage()" class="input-form">
          <input
            type="text"
            [(ngModel)]="currentMessage"
            name="message"
            placeholder="Type your message..."
            class="message-input"
            #messageInput
          />
          <button type="submit" [disabled]="!currentMessage.trim()" class="send-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </form>
      </div>
    </div>

    <!-- Floating Chat Icon -->
    <button 
      *ngIf="!isOpen"
      (click)="openChat()"
      class="chat-icon"
      aria-label="Open chat"
      tabindex="0"
    >
      <img src="assets/EVA.png" alt="Chat with EVA" class="chat-icon-img" />
    </button>
  `,
  styles: [`
    :host {
      --primary-color: #00388F; /* AT&T blue */
      --primary-hover: #002E7A;
      --background-color: #ffffff;
      --text-color: #1f2937;
      --secondary-text: #6b7280;
      --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      --border-radius: 8px;
    }

    .chat-panel {
      position: fixed;
      bottom: .3rem;
      right: 0rem;
      width: 450px;
      max-width: calc(100vw - 2rem);
      height: 650px;
      background: var(--background-color);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow);
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      z-index: 1000;
    }

    .chat-header {
      background: linear-gradient(285.78deg, #007AE2 0%, #00388F 100%);
      color: white;
      padding: 10px;
      border-radius: var(--border-radius) var(--border-radius) 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .att-logo {
      width: 50px;
      height: 50px;
    }

    .close-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
    }

    .close-button:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: #f9fafb;
    }

    .message {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      max-width: 80%;
    }

    .message.user-message {
      align-self: flex-end;
      align-items: flex-end;
    }

    .bot-avatar-text {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .bot-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: contain;
    }

    .bot-message-content {
      background: var(--background-color);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow);
      padding: 1rem;
      position: relative;
      width: 350px;
    }

    .user-card {
      background: #0067E5; /* Blue background for user card */
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow);
      padding: 1rem;
      position: relative;
    }

    .virtual-assistant-label {
      font-weight: bold;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
      display: block;
    }

    .message-text {
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--text-color);
      white-space: pre-wrap;
    }

    .user-card .message-text {
      color: white; /* White text for user card */
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
      margin: 0;
    }

    .card-subtitle {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--secondary-text);
      margin: 0;
    }

    .card-text {
      font-size: 0.875rem;
      color: var(--text-color);
      white-space: pre-wrap;
      margin: 0;
    }

    .card-image {
      max-width: 100%;
      border-radius: 8px;
      margin-top: 0.5rem;
    }

    .message-time {
      font-size: 0.7rem;
      color: var(--secondary-text);
      text-align: right;
      margin-top: 0.3rem;
    }

    .message-time-user {
      font-size: 0.7rem;
      color: #FFF;
      text-align: right;
      margin-top: 0.3rem;
    }

    .message-buttons {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      padding-left: 0%;
    }

    .user-message .message-buttons {
      justify-content: flex-end;
    }

    .action-button {
      font-family: ATT Aleck Sans Medium;
      border: 1px solid #0057b8;
      outline: none;
      color: #0057b8;
      background-color: #fff;
      min-width: 5rem;
      padding: 8px 16px;
      font-size: 14px;
      position: relative;
      border-radius: 19px;
      -ms-flex-negative: 0;
      flex-shrink: 0;
      margin: 4px;
      max-width: 100%;
      text-wrap: wrap;
      height: auto;
    }

    .action-button:hover {
      background-color: #0057b8;
      color: white;
    }

    .bill-summary-card {
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    }

    .bill-header {
      padding: 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .bill-header-content {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .bill-header-row {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .att-bill-logo {
      width: 50px;
      height: 50px;
      flex-shrink: 0;
    }

    .company-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .company-name {
      font-weight: 600;
      font-size: 16px;
      color: #212529;
    }

    .company-address {
      color: #6c757d;
      font-size: 13px;
      white-space: pre-line;
    }

    .bill-meta-item {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      font-size: 13px;
    }

    .meta-label {
      color: #6c757d;
      font-weight: 600;
    }

    .meta-value {
      color: #212529;
      font-weight: 500;
    }

    .bill-main-content {
      display: flex;
      padding: 20px;
      gap: 30px;
      align-items: flex-start;
    }

    .bill-left-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .autopay-section,
    .premier-section {
      color: #495057;
      font-size: 13px;
      line-height: 1.5;
    }

    .autopay-section strong {
      color: #212529;
    }

    .bill-right-content {
      flex-shrink: 0;
    }

    .total-due-circle {
      width: 180px;
      height: 180px;
      border: 8px solid #5bc0de;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      position: relative;
    }

    .circle-content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .total-due-label {
      font-size: 14px;
      color: #6c757d;
      margin-bottom: 5px;
    }

    .total-due-amount {
      font-size: 32px;
      font-weight: bold;
      color: #212529;
      line-height: 1;
      margin-bottom: 8px;
    }

    .due-date-info {
      text-align: center;
    }

    .pay-by-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 2px;
    }

    .due-date {
      font-size: 13px;
      color: #212529;
      font-weight: 500;
    }

    .account-summary {
      padding: 20px;
      border-top: 1px solid #e9ecef;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #212529;
      margin: 0 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #dee2e6;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .summary-item.remaining-balance {
      border-top: 1px solid #dee2e6;
      margin-top: 8px;
      padding-top: 12px;
      font-weight: 600;
    }

    .summary-label {
      color: #495057;
      font-size: 14px;
    }

    .summary-amount {
      font-weight: 600;
      color: #212529;
      font-size: 14px;
    }

    .payment-credit {
      color: #28a745 !important;
      font-weight: 600;
    }

    .service-summary {
      padding: 20px;
      border-top: 1px solid #e9ecef;
    }

    .service-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
    }

    .service-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .service-icon {
      font-size: 18px;
      color: #5bc0de;
    }

    .service-name {
      color: #495057;
      font-size: 14px;
    }

    .service-page {
      color: #6c757d;
      font-size: 12px;
      font-style: italic;
    }

    .service-amount {
      font-weight: 600;
      color: #212529;
      font-size: 14px;
    }

    .total-services-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0 8px 0;
      border-top: 1px solid #dee2e6;
      margin-top: 8px;
    }

    .total-services-label {
      font-weight: 600;
      color: #212529;
      font-size: 14px;
    }

    .total-services-amount {
      font-weight: 600;
      color: #212529;
      font-size: 14px;
    }

    .final-total {
      background: #f8f9fa;
      padding: 20px;
      border-top: 1px solid #e9ecef;
    }

    .final-total-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .final-total-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .final-total-label {
      font-size: 18px;
      font-weight: 600;
      color: #212529;
    }

    .final-due-date {
      font-size: 13px;
      color: #6c757d;
    }

    .final-total-amount {
      font-size: 24px;
      font-weight: bold;
      color: #212529;
    }

    .chat-input {
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
      background: var(--background-color);
      border-radius: 0 0 var(--border-radius) var(--border-radius);
    }

    .input-form {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .message-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      font-size: 0.875rem;
    }

    .send-button {
      background: var(--primary-color);
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
    }

    .send-button:hover:not(:disabled) {
      background: var(--primary-hover);
    }

    .chat-icon {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background-color: transparent;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      z-index: 1000;
    }

    .chat-icon-img {
      width: 90px;
      height: 90px;
      object-fit: contain;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .form-input,
    .form-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    @media (max-width: 480px) {
      .chat-panel {
        width: calc(100vw - 2rem);
        height: calc(100vh - 4rem);
        bottom: 1rem;
        right: 1rem;
      }

      .chat-icon {
        bottom: 1rem;
        right: 1rem;
      }

      .chat-icon-img {
        width: 90px;
        height: 90px;
      }
    }
  `]
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  isOpen = false;
  currentMessage = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.chatService.messages$.subscribe(messages => {
        this.messages = messages;
        this.scrollToBottom();
      }),
      this.chatService.isOpen$.subscribe(isOpen => {
        this.isOpen = isOpen;
        if (isOpen) {
          setTimeout(() => this.scrollToBottom(), 100);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  openChat(): void {
    this.chatService.openChat();
  }

  closeChat(): void {
    this.chatService.closeChat();
  }

  sendMessage(): void {
    if (this.currentMessage.trim()) {
      this.chatService.sendMessage(this.currentMessage.trim());
      this.currentMessage = '';
    }
  }

  handleButtonClick(action: string, data?: any): void {
    if (action === 'login') {
      this.router.navigate(['/login']);
    } else {
      this.chatService.handleButtonClick(action, data);
    }
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  displayCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 50);
  }
}
