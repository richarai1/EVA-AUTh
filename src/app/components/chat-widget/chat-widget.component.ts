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
        <span class="chat-title"> <img src="assets/att_header_logo.svg"  class="chat-logo" /></span>
        <div class="header-controls">
          <button class="header-button" aria-label="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
          </button>
          <button class="header-button" aria-label="Minimize">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button (click)="closeChat()" class="header-button" aria-label="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Welcome Header (only shown for authenticated users at start) -->
      <div *ngIf="showWelcomeHeader && isAuthenticated" class="welcome-header">
        <h2 class="welcome-title">Good Evening,<br>{{ getUserName() }}</h2>
        <p class="welcome-time">{{ getCurrentTime() }}</p>
      </div>

      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let message of messages" class="message" [class.user-message]="message.isUser">
          <!-- BOT MESSAGE -->
          <div *ngIf="!message.isUser" class="bot-message">
            <div class="message-header">
              <span class="sender-name">AT&T</span>
              <span class="message-timestamp">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content">
              <!-- Text Card -->
              <div *ngIf="message.card.type === 'text'" class="message-text">
                {{ message.card.text }}
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

              <!-- Bill Analysis Card -->
              <div *ngIf="message.card.type === 'bill-analysis'" class="bill-analysis-card">
                <div class="analysis-content">
                  <p class="analysis-text">{{ message.card.text }}</p>
                  <div *ngIf="message.card.billBreakdown" class="bill-breakdown">
                    <div *ngFor="let item of message.card.billBreakdown" class="breakdown-item">
                      <div class="breakdown-line">
                        <strong>{{ item.lineNumber }} ({{ item.name }}):</strong>
                        <span class="breakdown-change">{{ item.changeText }}</span>
                      </div>
                      <ul class="breakdown-details">
                        <li *ngFor="let detail of item.details">{{ detail }}</li>
                      </ul>
                    </div>
                    <div class="bill-totals">
                      <p><strong>This month's total bill is {{ message.card.currentTotal }}, while last month's was {{ message.card.previousTotal }}.</strong></p>
                      <p>{{ message.card.autoPayInfo }}</p>
                      <p>{{ message.card.additionalInfo }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Payment Method Card -->
              <div *ngIf="message.card.type === 'payment-method'" class="payment-method-card">
                <div class="payment-header">
                  <h4>Payment Method</h4>
                  <img src="assets/norton-logo.png" alt="Norton Secured" class="norton-logo" />
                </div>
                <div class="payment-options">
                  <button class="payment-option selected">Credit card</button>
                  <button class="payment-option">Bank Account</button>
                </div>
                <div class="different-card-option">
                  <button class="different-card-btn">
                    <span>Pay with a different card</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="2" y1="7" x2="22" y2="7"/>
                    </svg>
                  </button>
                </div>
                <div class="payment-actions">
                  <button class="continue-payment-btn">Continue with payment</button>
                  <button class="cancel-payment-btn">Cancel</button>
                </div>
              </div>

              <!-- Status Messages -->
              <div *ngIf="message.card.type === 'status'" class="status-message" [class]="'status-' + message.card.statusType">
                <div class="status-icon">
                  <span *ngIf="message.card.statusType === 'success'">✅</span>
                  <span *ngIf="message.card.statusType === 'info'">ℹ️</span>
                </div>
                <span class="status-text">{{ message.card.text }}</span>
              </div>

              <!-- Buttons -->
              <div *ngIf="message.card.buttons && message.card.buttons.length > 0" class="message-buttons">
                <button 
                  *ngFor="let button of message.card.buttons"
                  (click)="handleButtonClick(button.action, button.data)"
                  class="action-button"
                  [class.primary-button]="button.primary"
                >
                  {{ button.text }}
                </button>
              </div>
            </div>
          </div>

          <!-- USER MESSAGE -->
          <div *ngIf="message.isUser" class="user-message-container">
            <div class="user-timestamp">{{ formatTime(message.timestamp) }}</div>
            <div class="user-message-bubble">
              <div *ngIf="message.card.type === 'text'" class="message-text">
                {{ message.card.text }}
              </div>
            </div>
          </div>
        </div>

        <!-- Signed In Status -->
        <div *ngIf="showSignedInStatus" class="signed-in-status">
          <span class="status-icon">✅</span>
          <span class="status-text">You are now signed in</span>
        </div>
      </div>

      <div class="chat-input">
        <form (ngSubmit)="sendMessage()" class="input-form">
          <input
            type="text"
            [(ngModel)]="currentMessage"
            name="message"
            placeholder="Enter a question or response"
            class="message-input"
            #messageInput
          />
          <button type="submit" [disabled]="!currentMessage.trim()" class="send-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </form>
        <p class="privacy-notice">Chats are recorded for quality and purposes stated in our privacy notice.</p>
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
      --primary-color: #4A90E2;
      --primary-hover: #357ABD;
      --background-color: #ffffff;
      --text-color: #333333;
      --secondary-text: #666666;
      --border-color: #e0e0e0;
      --chat-bg: #f5f5f5;
      --user-message-bg: #4A90E2;
      --bot-message-bg: #e8e8e8;
    }

    .chat-panel {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 400px;
      max-width: calc(100vw - 2rem);
      height: 600px;
      background: var(--background-color);
      border-radius: 8px 8px 0 0;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .chat-header {
      background: linear-gradient(285.78deg, #007AE2 0%, #00388F 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  
}

.chat-logo {
  width: 61px; /* adjust as needed */
  height: 31px;

}


    .header-controls {
      display: flex;
      gap: 8px;
    }

    .header-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-button:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .welcome-header {
      background: var(--background-color);
      padding: 24px 16px;
      text-align: center;
      border-bottom: 1px solid var(--border-color);
    }

    .welcome-title {
      font-size: 24px;
      font-weight: 400;
      color: var(--text-color);
      margin: 0 0 8px 0;
      line-height: 1.2;
    }

    .welcome-time {
      font-size: 14px;
      color: var(--secondary-text);
      margin: 0;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: var(--chat-bg);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      flex-direction: column;
    }

    .bot-message {
      align-self: flex-start;
      max-width: 85%;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .sender-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-color);
    }

    .message-timestamp {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .message-content {
      background: var(--bot-message-bg);
      border-radius: 16px 16px 16px 4px;
      padding: 12px 16px;
      position: relative;
    }

    .message-text {
      font-size: 14px;
      line-height: 1.4;
      color: var(--text-color);
      
      margin: 0;
    }

    .user-message-container {
      align-self: flex-end;
      max-width: 85%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .user-timestamp {
      font-size: 11px;
      color: var(--secondary-text);
      margin-bottom: 4px;
    }

    .user-message-bubble {
      background: var(--user-message-bg);
      color: white;
      border-radius: 16px 16px 4px 16px;
      padding: 12px 16px;
    }

    .user-message-bubble .message-text {
      color: white;
    }

    .message-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .action-button {
      background: var(--background-color);
      border: 1px solid var(--primary-color);
      color: var(--primary-color);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-button:hover {
      background: var(--primary-color);
      color: white;
    }

    .action-button.primary-button {
      background: var(--primary-color);
      color: white;
    }

    .action-button.primary-button:hover {
      background: var(--primary-hover);
    }

    .bill-analysis-card {
      background: var(--background-color);
      border-radius: 8px;
      padding: 16px;
      margin-top: 8px;
    }

    .analysis-text {
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 16px;
    }

    .breakdown-item {
      margin-bottom: 16px;
    }

    .breakdown-line {
      font-size: 14px;
      margin-bottom: 8px;
    }

    .breakdown-change {
      color: var(--primary-color);
      font-weight: 500;
    }

    .breakdown-details {
      list-style: none;
      padding-left: 16px;
      margin: 0;
    }

    .breakdown-details li {
      font-size: 13px;
      color: var(--secondary-text);
      margin-bottom: 4px;
      position: relative;
    }

    .breakdown-details li:before {
      content: "○";
      position: absolute;
      left: -12px;
      color: var(--primary-color);
    }

    .bill-totals {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }

    .bill-totals p {
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 8px;
    }

    .payment-method-card {
      background: var(--background-color);
      border-radius: 8px;
      padding: 16px;
      margin-top: 8px;
      border: 1px solid var(--border-color);
    }

    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .payment-header h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .norton-logo {
      height: 20px;
    }

    .payment-options {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .payment-option {
      background: var(--background-color);
      border: 1px solid var(--border-color);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }

    .payment-option.selected {
      background: #333;
      color: white;
      border-color: #333;
    }

    .different-card-option {
      margin-bottom: 16px;
    }

    .different-card-btn {
      background: var(--background-color);
      border: 1px solid var(--border-color);
      padding: 12px 16px;
      border-radius: 4px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
    }

    .payment-actions {
      display: flex;
      gap: 8px;
    }

    .continue-payment-btn {
      background: #ccc;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
      flex: 1;
    }

    .cancel-payment-btn {
      background: var(--background-color);
      border: 1px solid var(--primary-color);
      color: var(--primary-color);
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
    }

    .status-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
    }

    .status-icon {
      font-size: 16px;
    }

    .status-text {
      font-size: 14px;
      color: var(--text-color);
    }

    .signed-in-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #e8f5e8;
      border-radius: 8px;
      margin: 8px 16px;
    }

    .signed-in-status .status-icon {
      color: #28a745;
    }

    .signed-in-status .status-text {
      color: #28a745;
      font-weight: 500;
      font-style: italic;
    }

    .chat-input {
      padding: 12px 16px;
      border-top: 1px solid var(--border-color);
      background: var(--background-color);
    }

    .input-form {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .message-input {
      flex: 1;
      padding: 10px 16px;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      font-size: 14px;
      outline: none;
    }

    .message-input:focus {
      border-color: var(--primary-color);
    }

    .send-button {
      background: #ccc;
      color: white;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .send-button:hover:not(:disabled) {
      background: var(--primary-color);
    }

    .send-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .privacy-notice {
      font-size: 11px;
      color: var(--secondary-text);
      text-align: center;
      margin: 0;
      line-height: 1.3;
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

    /* Bill Summary Styles */
    .bill-summary-card {
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      margin-top: 8px;
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
      width: 120px;
      height: 120px;
      border: 6px solid #5bc0de;
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
      gap: 2px;
    }

    .total-due-label {
      font-size: 11px;
      color: #6c757d;
      margin-bottom: 2px;
    }

    .total-due-amount {
      font-size: 20px;
      font-weight: bold;
      color: #212529;
      line-height: 1;
      margin-bottom: 4px;
    }

    .due-date-info {
      text-align: center;
    }

    .pay-by-label {
      font-size: 10px;
      color: #6b7280;
      margin-bottom: 1px;
    }

    .due-date {
      font-size: 11px;
      color: #212529;
      font-weight: 500;
    }

    .account-summary {
      padding: 20px;
      border-top: 1px solid #e9ecef;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #212529;
      margin: 0 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #dee2e6;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
    }

    .summary-item.remaining-balance {
      border-top: 1px solid #dee2e6;
      margin-top: 6px;
      padding-top: 10px;
      font-weight: 600;
    }

    .summary-label {
      color: #495057;
      font-size: 13px;
    }

    .summary-amount {
      font-weight: 600;
      color: #212529;
      font-size: 13px;
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
      padding: 8px 0;
    }

    .service-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .service-icon {
      font-size: 16px;
      color: #5bc0de;
    }

    .service-name {
      color: #495057;
      font-size: 13px;
    }

    .service-page {
      color: #6c757d;
      font-size: 11px;
      font-style: italic;
    }

    .service-amount {
      font-weight: 600;
      color: #212529;
      font-size: 13px;
    }

    .total-services-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0 6px 0;
      border-top: 1px solid #dee2e6;
      margin-top: 6px;
    }

    .total-services-label {
      font-weight: 600;
      color: #212529;
      font-size: 13px;
    }

    .total-services-amount {
      font-weight: 600;
      color: #212529;
      font-size: 13px;
    }

    .final-total {
      background: #f8f9fa;
      padding: 16px 20px;
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
      gap: 2px;
    }

    .final-total-label {
      font-size: 16px;
      font-weight: 600;
      color: #212529;
    }

    .final-due-date {
      font-size: 12px;
      color: #6c757d;
    }

    .final-total-amount {
      font-size: 20px;
      font-weight: bold;
      color: #212529;
    }

    @media (max-width: 480px) {
      .chat-panel {
        width: 100vw;
        height: 100vh;
        bottom: 0;
        right: 0;
        border-radius: 0;
      }

      .chat-icon {
        bottom: 1rem;
        right: 1rem;
      }

      .chat-icon-img {
        width: 70px;
        height: 70px;
      }

      .total-due-circle {
        width: 100px;
        height: 100px;
      }

      .total-due-amount {
        font-size: 16px;
      }
    }
  `]
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  isOpen = false;
  currentMessage = '';
  showWelcomeHeader = true;
  showSignedInStatus = false;
  isAuthenticated = false;
  
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
      }),
      this.authService.currentUser$.subscribe(user => {
        this.isAuthenticated = user.isAuthenticated;
        if (user.isAuthenticated && this.isOpen) {
          this.showSignedInStatus = true;
          this.chatService.reinitializeAfterLogin();
          setTimeout(() => {
            this.showSignedInStatus = false;
          }, 3000);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  openChat(): void {
    this.chatService.openChat();
    this.showWelcomeHeader = this.isAuthenticated;
  }

  closeChat(): void {
    this.chatService.closeChat();
  }

  sendMessage(): void {
    if (this.currentMessage.trim()) {
      this.chatService.sendMessage(this.currentMessage.trim());
      this.currentMessage = '';
      this.showWelcomeHeader = false;
    }
  }

  handleButtonClick(action: string, data?: any): void {
    if (action === 'login') {
      this.router.navigate(['/login']);
    } else {
      this.chatService.handleButtonClick(action, data);
    }
    this.showWelcomeHeader = false;
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getCurrentTime(): string {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const time = now.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${dayName} ${time}`;
  }

  getUserName(): string {
    const user = this.authService.currentUserValue;
    return user.email ? user.email.split('@')[0] : 'User';
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