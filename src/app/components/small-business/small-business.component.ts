import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { ChatWidgetComponent } from '../chat-widget/chat-widget.component';

interface Account {
  ban: string;
  name: string;
  balance: number;
}

@Component({
  selector: 'app-small-business',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payment-container">
      <div class="background-image"></div>

      <div class="ban-card-container" *ngIf="showBanCard">
        <div class="adaptive-card">
          <div class="card-header">
            <h3>Enter Billing Account Number (BAN)</h3>
            <button class="close-btn" (click)="closeBanCard()">✕</button>
          </div>

          <div class="card-body">
            <div class="input-group">
              <label for="banInput">BAN</label>
              <input
                type="text"
                id="banInput"
                [(ngModel)]="banInput"
                (input)="onBanInput()"
                placeholder="Enter BAN number"
                class="ban-input"
                autocomplete="off"
              />
              <div class="input-hint">Start typing to see suggestions</div>
            </div>

            <div class="suggestions" *ngIf="filteredAccounts.length > 0">
              <div class="suggestions-header">Suggestions</div>
              <div
                class="suggestion-item"
                *ngFor="let account of filteredAccounts"
                (click)="selectAccount(account)"
              >
                <div class="suggestion-content">
                  <div class="suggestion-ban">{{ account.ban }}</div>
                  <div class="suggestion-name">{{ account.name }}</div>
                  <div class="suggestion-balance">{{ '$' + account.balance.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <div class="no-results" *ngIf="banInput.length >= 3 && filteredAccounts.length === 0">
              No matching accounts found
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-cancel" (click)="closeBanCard()">Cancel</button>
            <button
              class="btn-submit"
              (click)="submitBan()"
              [disabled]="!banInput || banInput.length < 3"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
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

    .ban-card-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .adaptive-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .card-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .input-group {
      margin-bottom: 16px;
    }

    .input-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    .ban-input {
      width: 100%;
      padding: 12px;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      font-size: 16px;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .ban-input:focus {
      outline: none;
      border-color: #0078d7;
      box-shadow: 0 0 0 3px rgba(0, 120, 215, 0.1);
    }

    .input-hint {
      font-size: 12px;
      color: #6b7280;
      margin-top: 6px;
    }

    .suggestions {
      margin-top: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }

    .suggestions-header {
      padding: 12px 16px;
      background: #f9fafb;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    .suggestion-item {
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid #f3f4f6;
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    .suggestion-item:hover {
      background: #f9fafb;
    }

    .suggestion-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .suggestion-ban {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      min-width: 120px;
    }

    .suggestion-name {
      flex: 1;
      font-size: 14px;
      color: #6b7280;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .suggestion-balance {
      font-size: 14px;
      font-weight: 600;
      color: #059669;
      min-width: 80px;
      text-align: right;
    }

    .no-results {
      margin-top: 16px;
      padding: 16px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      background: #f9fafb;
      border-radius: 6px;
    }

    .card-actions {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-cancel,
    .btn-submit {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-cancel {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-cancel:hover {
      background: #f9fafb;
    }

    .btn-submit {
      background: #0078d7;
      color: white;
    }

    .btn-submit:hover:not(:disabled) {
      background: #005a9e;
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .adaptive-card {
        max-width: 100%;
        border-radius: 0;
      }

      .suggestion-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .suggestion-ban,
      .suggestion-balance {
        min-width: auto;
      }

      .suggestion-balance {
        text-align: left;
      }
    }
  `]
})
export class SmallBusinessComponent implements OnInit {
  showBanCard = false;
  banInput = '';
  filteredAccounts: Account[] = [];

  private allAccounts: Account[] = [
    { ban: '00060030', name: 'LENNAR CORPORATE CTR-R CCDA MAC CRU', balance: 0.00 },
    { ban: '287237545598', name: 'LENNAR CORPORATE CTR', balance: 64.55 },
    { ban: '287242788082', name: 'LENNAR CORPORATION', balance: 10.15 },
    { ban: '287244036928', name: 'LENNAR CORPORATIONS', balance: 17.15 },
    { ban: '287245050664', name: 'LENNAR CORPORATION', balance: 0.00 },
    { ban: '287245544976', name: 'LENNAR CORPORATE CTR', balance: 41.14 },
    { ban: '287261139597', name: 'LENNAR CORPORATE CTR-N 1 CCDA MAC I', balance: 587.26 },
    { ban: '287262877679', name: 'LENNAR CORPORATION-MAIN ACCT', balance: 0.00 },
    { ban: '287263043039', name: 'LENNAR CORPORATE', balance: 0.00 },
    { ban: '287295433717', name: 'SANDRA A PETERSON', balance: 59.18 },
    { ban: '287302190660', name: 'LENNAR CORPORATION', balance: 0.00 },
    { ban: '287311379786', name: 'LENNAR CORPORATIONS', balance: 45.17 },
    { ban: '287311518174', name: 'LENNAR CORPORATIONS', balance: 39.58 },
    { ban: '287312984413', name: 'LENNAR CORPORATIONS', balance: 98.45 },
    { ban: '287313066711', name: 'LENNAR CORPORATIONS', balance: 69.01 },
    { ban: '287313129638', name: 'LENNAR CORPORATIONS', balance: 90.09 },
    { ban: '287313136227', name: 'LENNAR CORPORATIONS', balance: 90.09 },
    { ban: '287313163402', name: 'LENNAR CORPORATIONS', balance: 89.04 },
    { ban: '287313211164', name: 'LENNAR CORPORATIONS', balance: 87.99 },
    { ban: '287313227585', name: 'LENNAR CORPORATIONS', balance: 85.94 },
    { ban: '287313335130', name: 'LENNAR CORPORATIONS', balance: 80.68 },
    { ban: '287313407599', name: 'LENNAR CORPORATIONS', balance: 88.53 },
    { ban: '287313459752', name: 'LENNAR CORPORATIONS', balance: 59.38 },
    { ban: '870573174', name: 'LENNAR CORPORATIONS', balance: 203.17 },
    { ban: '870785761', name: 'LENNAR CORPORATIONS', balance: 585.68 },
    { ban: '991668185', name: 'LENNAR', balance: 109.16 },
    { ban: '991935678', name: 'LENNAR CORP', balance: 324.74 },
    { ban: '993043300', name: 'LENNAR CORPORATION', balance: 12.32 },
    { ban: '993201573', name: 'US HOME LONE TREE DIVISION', balance: 111.14 },
    { ban: '993520342', name: 'KEVIN REID', balance: 106.20 },
    { ban: '993520433', name: 'JAMES ELIZONDO', balance: 106.20 },
    { ban: '993520502', name: 'KEITH SHEFIELD', balance: 106.20 },
    { ban: '994053973', name: 'LENNAR CORPORATION GSM-R', balance: 182.14 },
    { ban: '994089726', name: 'LENNAR CORPORATION GSM-R', balance: 446.52 },
    { ban: '994372219', name: 'US HOME DENVER DIVISION', balance: 198.21 },
    { ban: '994879380', name: 'LENNAR CORPORATION GSM-R', balance: 273.25 },
    { ban: '995098581', name: 'LENNAR URBAN DIVISION', balance: 401.94 },
    { ban: '995154671', name: 'LENNAR CORPORATION GSM-R', balance: 417.38 },
    { ban: '995494832', name: 'LENNAR CORPORATION', balance: 259.33 },
    { ban: '996046081', name: 'LENNAR CORPORATION GSM-R', balance: 100.05 },
    { ban: '996185136', name: 'LENNAR CORPORATION', balance: 350.96 },
    { ban: '996233953', name: 'LENNAR CORPORATION', balance: 83.45 },
    { ban: '996243751', name: 'LENNAR CORPORATION-SAN DIEGO URBAN', balance: 69.60 },
    { ban: '996367670', name: 'LENNAR CORPORATION GILBERT', balance: 33.03 },
    { ban: '996440272', name: 'LENNAR CORPORATION PHIL FREEBERN', balance: 260.31 }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.chatService.setUserFlowContext('small-business');

    const shouldReopenChat = sessionStorage.getItem('reopenChatAfterLogin');
    if (shouldReopenChat) {
      sessionStorage.removeItem('reopenChatAfterLogin');

      setTimeout(() => {
        this.chatService.openChat();

        setTimeout(() => {
          this.chatService.reinitializeAfterLogin();
        }, 800);
      }, 1200);
    }

    setTimeout(() => {
      this.showBanCard = true;
    }, 1000);
  }

  onBanInput(): void {
    const input = this.banInput.trim();

    if (input.length >= 3) {
      this.filteredAccounts = this.allAccounts.filter(account =>
        account.ban.toLowerCase().includes(input.toLowerCase()) ||
        account.name.toLowerCase().includes(input.toLowerCase())
      ).slice(0, 5);
    } else {
      this.filteredAccounts = [];
    }
  }

  selectAccount(account: Account): void {
    this.banInput = account.ban;
    this.filteredAccounts = [];
  }

  submitBan(): void {
    if (this.banInput && this.banInput.length >= 3) {
      console.log('Submitted BAN:', this.banInput);
      this.closeBanCard();
    }
  }

  closeBanCard(): void {
    this.showBanCard = false;
    this.banInput = '';
    this.filteredAccounts = [];
  }

  navigateToLogin(): void {
    this.authService.setRedirectPath('/small-business');
    this.router.navigate(['/login']);
  }

  openChat(): void {
    this.chatService.openChat();
  }
}
