import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ChatMessage, ChatCard, BillSummaryData, OptionCard, ChatButton } from '../models/chat.model';

interface Account {  // NEW: Extracted interface to fix 'this' type issue
  ban: string;
  name: string;
  balance: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private userFlowContext: 'consumer' | 'small-business' | 'enterprise' = 'consumer';
  private banPage: number = 0;

  private viewBillUtterances = [
    "view my bill",
    "view ill",
    "i wanna see my bill",
    "i wanna check my bill",
    "bill summary plz",
    "bill plz",
    "current bill",
    "this month bill",
    "latest bill",
    
    "view bill",
    "show my bill",
    "check my bill",
    "bill summary",
    "can I see my bill",
    "show me my bill",
    "I want to see my bill",
    "display my bill",
    "what's my bill",
    "latest bill",
    "recent bill",
    "billing info",
    "bill details",
    "see charges",
    "how much do I owe",
    "bill amount",
    "get my bill"
  ];

  // Natural language variations for "pay bill"
  private payBillUtterances = [
    "pay my bill",
    "pay bill",
    "make a payment",
    "settle bill",
    "bill payment",
    "I'd like to pay my bill",
    "please pay my bill",
    "pay now",
    "pay outstanding",
    "clear my bill",
    "pay charges",
    "make bill payment",
    "settle outstanding",
    "pay account balance",
    "pay amount due"
  ];
  private billAnalysisUtterances = [
    "why my bill is too high", "my bill is high","why bill is so high",
    "bill analysis"
  ];

  // NEW: Added download utterances
  private downloadBillUtterances = [
    "download bill", "download pdf", "get pdf", "save bill", "export pdf", "bill download"
  ];

  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  private lastUserQuestion: string = '';
  private lastUserMessage: ChatMessage | null = null;
  private pendingAction: string = '';

  private currentStep: 'ban' | 'account_selection' | 'payment_amount' | 'payment_method' | 'att_id' | null = null;

  private banNumber: string = '';
  private selectedAccount: string = '';
  private selectedAccountName: string = '';
  private selectedAccountBalance: string = '';
  private paymentAmount: string = '';
  private attId: string = '';
  private skipAutoInitialize: boolean = false;

  private smallBusinessAccounts: Account[] = [  // UPDATED: Typed with interface, corrected due amounts
    { ban: '00060030', name: 'LENNAR CORPORATE CTR-R CCDA MAC CRU', balance: 0.00 },
    { ban: '287237545598', name: 'LENNAR CORPORATE CTR', balance: 64.55 },
    { ban: '287242788082', name: 'LENNAR CORPORATION', balance: 10.15 },
    { ban: '287244036928', name: 'LENNAR CORPORATIONS', balance: 17.15 },
    { ban: '287245050664', name: 'LENNAR CORPORATION', balance: 0.00 }, // Corrected: Paid-in-full
    { ban: '287245544976', name: 'LENNAR CORPORATE CTR', balance: 41.14 },
    { ban: '287261139597', name: 'LENNAR CORPORATE CTR-N 1 CCDA MAC I', balance: 587.26 },
    { ban: '287262877679', name: 'LENNAR CORPORATION-MAIN ACCT', balance: 0.00 }, // Corrected: Paid-in-full
    { ban: '287263043039', name: 'LENNAR CORPORATE', balance: 0.00 }, // Corrected: Paid-in-full
    { ban: '287295433717', name: 'SANDRA A PETERSON', balance: 59.18 },
    { ban: '287302190660', name: 'LENNAR CORPORATION', balance: 0.00 }, // Corrected: Paid-in-full
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

  constructor(private authService: AuthService, private router: Router) {}

  setUserFlowContext(context: 'consumer' | 'small-business' | 'enterprise'): void {
    this.userFlowContext = context;
  }

  getUserFlowContext(): 'consumer' | 'small-business' | 'enterprise' {
    return this.userFlowContext;
  }

  openChatForAction(action: string): void {
    this.skipAutoInitialize = true;
    this.openChat();
    setTimeout(() => {
      this.handleButtonClick(action);
    }, 500);
  }

  openChat(): void {
    this.isOpenSubject.next(true);
    // Always initialize chat when opening, but don't duplicate messages
    const currentMessages = this.messagesSubject.value;
    if (currentMessages.length === 0 && !this.skipAutoInitialize) {
      this.initializeChat();
    }
    this.skipAutoInitialize = false;
  }

  closeChat(): void {
    this.isOpenSubject.next(false);
  }

  private initializeChat(): void {
    if (this.authService.isAuthenticated()) {
      this.initializeAuthenticatedChat();
    } else {
      this.initializeGuestChat();
    }
  }

  // UPDATED: Return type now uses Account[] (no 'this' in type)
  private getPaginatedAccounts(filterZeroBalance: boolean = true): { accounts: Account[], hasMore: boolean } {
    let accounts = [...this.smallBusinessAccounts];
    if (filterZeroBalance) {
      accounts = accounts.filter(acc => acc.balance > 0);
    }
    accounts.sort((a, b) => b.balance - a.balance); // Descending by balance
  
    const pageSize = 10;
    const start = this.banPage * pageSize;
    const paginated = accounts.slice(start, start + pageSize);
    const hasMore = start + pageSize < accounts.length;
  
    return { accounts: paginated, hasMore };
  }

  private initializeGuestChat(): void {
    // Show business security notice first

    // Show connection status
    setTimeout(() => {
      const connectionMessage: ChatMessage = {
        id: this.generateId(),
        isUser: false,
        timestamp: new Date(),
        card: {
          type: 'connection-status',
          text: "Hi there! \n Let's get you some help. Please select an option so I can connect you."
        }
      };
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, connectionMessage]);

      // Show main options after connection
      setTimeout(() => {
        const optionsMessage: ChatMessage = {
          id: this.generateId(),
          isUser: false,
          timestamp: new Date(),
          card: {
            type: 'option-cards',
            options: [
              {
                title: "Help me shop",
                description: "I'm looking for a new phone, plan, line or protection.",
                iconUrl: "https://www.att.com/scmsassets/global/icons/svg/retail-financial/pictogram_shopping-bag_96.svg",
                action: "help_shop"
              },
              {
                title: "I need support",
                description: "Get help with my phone, account or bill.",
                iconUrl: "https://www.att.com/scmsassets/global/icons/svg/people/pictogram_handshake_96.svg",
                action: "need_support"
              }
            ]
          }
        };
        const messages = this.messagesSubject.value;
        this.messagesSubject.next([...messages, optionsMessage]);
      }, 2000);
    }, 1000);
  }

  private initializeAuthenticatedChat(): void {
    const user = this.authService.currentUserValue;
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      isUser: false,
      timestamp: new Date(),
      card: {
        type: 'text',
        text: `Welcome back, how can I help you?`,
        buttons: [
          { text: "View Bill", action: "view_bill", primary: true },
          { text: "Pay Bill", action: "pay_bill", primary: true },
          { text: "Download Bill", action: "download_bill", primary: true },
          { text: "Why my bill is too high?", action: "bill_analysis", primary: true },
          { text: "Export Bills", action: "export_bills", primary: false }
        ]
      }
    };
    this.messagesSubject.next([welcomeMessage]);
  }

  sendMessage(text: string): void {
    this.lastUserQuestion = text;
    
    const userMessage: ChatMessage = {
      id: this.generateId(),
      isUser: true,
      timestamp: new Date(),
      card: {
        type: 'text',
        text
      }
    };

    // Store the last user message for potential replay after sign-in
    this.lastUserMessage = userMessage;

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);

    setTimeout(() => {
      this.processUserMessage(text);
    }, 500);
  }

  private processUserMessage(text: string): void {
    const lowerText = text.toLowerCase();
    const matchesUtterances = (utterances: string[]) =>
      utterances.some(u => lowerText.includes(u.toLowerCase()));
    if (this.currentStep === 'att_id') {
      this.attId = text.trim();
      this.addBotMessage({
        type: 'text',
        text: `Thank you. Verifying your account: ${this.attId}...`
      });

      setTimeout(() => {
        this.addBotMessage({
          type: 'text',
          text: "Account found. Redirecting you to the secure login page..."
        });

        setTimeout(() => {
          sessionStorage.setItem('attId', this.attId);
          const userContext = this.getUserFlowContext();
          const redirectPath = userContext === 'small-business' ? '/small-business' : '/home';
          this.authService.setRedirectPath(redirectPath);
          sessionStorage.setItem('reopenChatAfterLogin', 'true');
          this.router.navigate(['/login']);
          this.currentStep = null;
        }, 2000);
      }, 1500);
      return;
    }
    if (this.currentStep === 'ban') {
      this.banNumber = text.trim();
      this.handleAfterBanSet();
      return;
    }

    if (matchesUtterances(this.viewBillUtterances)) {
      this.handleViewBillRequest();
    } else if (matchesUtterances(this.billAnalysisUtterances)) {
      this.handleBillAnalysisRequest();
    } else if (matchesUtterances(this.downloadBillUtterances)) {  // UPDATED: Use array
      this.handleDownloadBillRequest();
    } else if (matchesUtterances(this.payBillUtterances)) {
      this.handlePayBillRequest();
    } else if (/^\d+(\.\d{2})?$/.test(text.trim())) {
      this.handlePaymentAmount(parseFloat(text.trim()));
    }  else {
      this.addBotMessage({
        type: 'text',
        text: "Can you tell me more about what you need help with?",
        buttons: [
          { text: "View Bill", action: "view_bill", primary: true },
          { text: "Pay Bill", action: "pay_bill", primary: true },
          { text: "Download Bill", action: "download_bill", primary: true },
          { text: "Why my bill is too high?", action: "bill_analysis", primary: true },
          { text: "Export Bills", action: "export_bills", primary: false }
        ]
      });
    }
  }

  private handleViewBillRequest(): void {
    if (this.authService.isAuthenticated()) {
      if (this.userFlowContext === 'small-business') {
        this.pendingAction = 'view_bill';
        this.banPage = 0;  // NEW: Reset page
        this.askForBANSelection();
      } else {
        this.showBillSummary();
      }
    } else {
      this.pendingAction = 'view_bill';
      sessionStorage.setItem('reopenChatAfterLogin', 'true');
      this.addBotMessage({
        type: 'text',
        text: "Now let's have you sign in so I can get you the best answers!",
        buttons: [
          { text: "Sign In", action: "login", primary: true }
        ]
      });
      
      setTimeout(() => {
        this.addBotMessage({
          type: 'text',
          text: "We'll resume our conversation after you sign-in. Opening a window for you to do that."
        });
      }, 1000);
    }
  }

  private handleBillAnalysisRequest(): void {
    if (this.authService.isAuthenticated()) {
      // For consumer flow, ask which service
      if (this.userFlowContext === 'consumer') {
        this.addBotMessage({
          type: 'text',
          text: "So I can get you the right info, what service are you asking about?",
          buttons: [
            { text: "AT&T Wireless", action: "service_wireless", primary: true },
            { text: "AT&T Internet", action: "service_internet", primary: true }
          ]
        });
      } else {
        // For small-business flow, show bill analysis directly
        this.showBillAnalysis();
      }
    } else {
      this.pendingAction = 'bill_analysis';
      sessionStorage.setItem('reopenChatAfterLogin', 'true');
      this.addBotMessage({
        type: 'text',
        text: "Now let's have you sign in so I can get you the best answers!",
        buttons: [
          { text: "Sign In", action: "login", primary: true }
        ]
      });

      setTimeout(() => {
        this.addBotMessage({
          type: 'text',
          text: "We'll resume our conversation after you sign-in. Opening a window for you to do that."
        });
      }, 1000);
    }
  }

  private handleDownloadBillRequest(): void {
    if (this.authService.isAuthenticated()) {
      this.handleDownloadPdf();
    } else {
      this.pendingAction = 'download_bill';
      sessionStorage.setItem('reopenChatAfterLogin', 'true');
      this.addBotMessage({
        type: 'text',
        text: "Now let's have you sign in so I can get you the best answers!",
        buttons: [
          { text: "Sign In", action: "login", primary: true }
        ]
      });
      
      setTimeout(() => {
        this.addBotMessage({
          type: 'text',
          text: "We'll resume our conversation after you sign-in. Opening a window for you to do that."
        });
      }, 1000);
    }
  }

  // REMOVED: Unused handleBillPayRequest

  private handlePayBillRequest(): void {
    if (this.authService.isAuthenticated()) {
      if (this.userFlowContext === 'small-business') {
        this.pendingAction = 'pay_bill';
        this.banPage = 0;  // NEW: Reset page
        this.showPayOptions();
      } else {
        this.addBotMessage({
          type: 'text',
          text: "Please enter the amount you want to pay:"
        });
      }
    } else {
      this.pendingAction = 'pay_bill';
      sessionStorage.setItem('reopenChatAfterLogin', 'true');
      this.addBotMessage({
        type: 'text',
        text: "Now let's have you sign in so I can get you the best answers!",
        buttons: [
          { text: "Sign In", action: "login", primary: true }
        ]
      });
      
      setTimeout(() => {
        this.addBotMessage({
          type: 'text',
          text: "We'll resume our conversation after you sign-in. Opening a window for you to do that."
        });
      }, 1000);
    }
  }

  private showPayOptions(): void {
    this.banPage = 0; // Reset page
    const { accounts, hasMore } = this.getPaginatedAccounts(true); // UPDATED: Explicit true for filter
    const totalDue = this.smallBusinessAccounts
      .filter(acc => acc.balance > 0)
      .reduce((sum, acc) => sum + acc.balance, 0);
  
    let text = `You have ${accounts.length + (hasMore ? '...' : '')} accounts with outstanding balances.\n\nTotal due across all accounts: $${totalDue.toLocaleString()}\n\nWould you like to pay the full total or select a specific account?`;
  
    const buttons: ChatButton[] = [
      { text: `Pay Full Total ($${totalDue.toLocaleString()})`, action: 'pay_full_total', primary: true }
    ];
    accounts.forEach(acc => {
      buttons.push({ 
        text: `${acc.ban} – ${acc.name} ($${acc.balance.toLocaleString()})`, 
        action: `select_account_pay_${acc.ban}`, 
        primary: true, 
        asLink: true 
      });
    });
    const remainingCount = this.smallBusinessAccounts.filter(acc => acc.balance > 0).length - (this.banPage * 10 + accounts.length);
    if (remainingCount > 0) {
      buttons.push({ text: `Enter BAN manually `, action: 'enter_ban_manually', primary: false });
    }
    if (hasMore) {
      buttons.push({ text: 'Show more options', action: 'show_more_bans', primary: false });
    }
  
    this.addBotMessage({
      type: 'text',
      text: text,
      buttons
    });
  }

  private askForPayBANSelection(): void {
    this.banPage = 0; // Reset page
    this.currentStep = 'ban';
    const { accounts, hasMore } = this.getPaginatedAccounts(true);  // UPDATED: Explicit true for filter
  
    const buttons: ChatButton[] = accounts.map(acc => ({
      text: `${acc.ban} – ${acc.name} ($${acc.balance.toLocaleString()})`,
      action: `select_account_pay_${acc.ban}`,
      primary: false,
      asLink: true
    }));
    const remainingCount = this.smallBusinessAccounts.filter(acc => acc.balance > 0).length - accounts.length;
    if (remainingCount > 0) {
      buttons.push({ text: `Enter BAN manually (for remaining ${remainingCount})`, action: 'enter_ban_manually', primary: false });
    }
    if (hasMore) {
      buttons.push({ text: 'Show more options', action: 'show_more_bans', primary: false });
    }
    buttons.push(
      { text: 'How to find my BAN?', action: 'show_ban_help', primary: false }
    );
  
    const text = hasMore
      ? `Which account would you like to pay? Select below, or tap "Show more options" for others:`
      : `Which account would you like to pay? Select below, or enter manually:`;
  
    this.addBotMessage({
      type: 'text',
      text: text,
      buttons
    });
  }

  private askForBANSelection(): void {
    this.banPage = 0; // Reset page
    this.currentStep = 'ban';
    const { accounts, hasMore } = this.getPaginatedAccounts(false);  // UPDATED: false to show all (incl. $0)
  
    const buttons: ChatButton[] = accounts.map(acc => ({
      text: `${acc.ban} – ${acc.name}`,
      action: `select_ban_${acc.ban}`,
      primary: false,
      asLink: true
    }));
    buttons.push(
      { text: 'Enter BAN manually', action: 'enter_ban_manually', primary: false },
      { text: 'How to find my BAN?', action: 'show_ban_help', primary: false }
    );
    if (hasMore) {
      buttons.push({ text: 'Show more options', action: 'show_more_bans', primary: false });
    }
  
    const totalAccounts = this.smallBusinessAccounts.length;  // UPDATED: totalAccounts (all)
    const text = totalAccounts > 10 
      ? `Select your Billing Account Number (BAN) below, or enter it manually. Tap "Show more options" for additional accounts (${totalAccounts} total).`
      : `Select your Billing Account Number (BAN) below, or enter it manually (${totalAccounts} total):`;
  
    this.addBotMessage({
      type: 'text',
      text,
      buttons
    });
  }

  // UPDATED: Now uses smallBusinessAccounts array (no hardcoded)
  private getAccountDataForBan(ban: string): {name: string, balance: string} | null {
    const account = this.smallBusinessAccounts.find(acc => acc.ban === ban);
    if (account) {
      return { name: account.name, balance: `$${account.balance.toFixed(2)}` };
    }
    return null;
  }

  private handleAfterBanSet(): void {
    this.addBotMessage({
      type: 'text',
      text: `Thank you. Retrieving Bill details for  ${this.banNumber}.`
    });

    if (this.pendingAction === 'view_bill') {
      setTimeout(() => {
        const data = this.getAccountDataForBan(this.banNumber);
        if (data) {
          this.selectedAccount = this.banNumber;
          this.selectedAccountName = data.name;
          this.selectedAccountBalance = data.balance.replace('$', '');
        }
        this.showBillSummary();
        this.clearPendingState();
      }, 500);
    } else if (this.pendingAction === 'pay_bill') {
      setTimeout(() => {
        const data = this.getAccountDataForBan(this.banNumber);
        if (data) {
          const bal = parseFloat(data.balance.replace('$', '').replace(',', ''));
          if (bal === 0) {
            this.addBotMessage({
              type: 'text',
              text: `${data.name} is already paid in full. Is there anything else I can help with?`,
              buttons: [
                { text: "View Bill", action: "view_bill", primary: true },
                { text: "Pay Bill", action: "pay_bill", primary: true },
                { text: "Download Bill", action: "download_bill", primary: true },
                { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
              ]
            });
          } else {
            this.handleAccountSelectionForPayment(this.banNumber, data.name, data.balance.replace('$', ''));
          }
        } else {
          this.addBotMessage({
            type: 'text',
            text: "Sorry, I couldn't find that BAN. Please try again.",
            buttons: [
              { text: "Select Account", action: "select_pay_account", primary: false }
            ]
          });
        }
        this.clearPendingState();
      }, 500);
    } else {
      setTimeout(() => {
        const data = this.getAccountDataForBan(this.banNumber);
        let text = `BAN set to ${this.banNumber}.`;
        if (data) {
          text += ` This is ${data.name} with balance ${data.balance}.`;
        }
        this.addBotMessage({
          type: 'text',
          text,
          buttons: [
            { text: "View Bill", action: "view_bill", primary: true },
            { text: "Pay Bill", action: "pay_bill", primary: true },
            { text: "Download Bill", action: "download_bill", primary: true },
            { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
          ]
        });
      }, 500);
    }
  }

  private showBillAnalysis(): void {
    if (this.userFlowContext === 'small-business') {
      // UPDATED: Corrected based on PDF data and recent AT&T changes
      const totalAccounts = 45;
      const unpaidAccounts = 40; // UPDATED: Accurate count
      const totalDue = 6444.36; // Corrected total due amount
      const estimatedIncrease = 6444.36; // Assuming this as current total; previous not available, but attributing to price hikes

      this.addBotMessage({
        type: 'bill-analysis',
        text: `I've analyzed your business accounts totaling ${totalAccounts} BANs. Your current outstanding balance is $${totalDue.toFixed(2)} across ${unpaidAccounts} accounts.\n\nThis represents an increase likely due to recent AT&T wireless plan price adjustments (up to $20/month per line for older unlimited plans starting August 2025) and potential data overages or added features.\n\nHere are some key factors contributing to higher charges:`,
        billBreakdown: [
          {
            lineNumber: "Multiple Accounts",
            name: "Plan Price Increases",
            changeText: "Up to $20/line increase",
            changeAmount: 20.00, // Per line estimate
            details: [
              "AT&T announced price hikes for legacy unlimited plans effective August 2025",
              "Applies to business wireless accounts"
            ]
          },
          {
            lineNumber: "Various BANs",
            name: "Data Overages",
            changeText: "Potential overage charges",
            changeAmount: 500.00, // Estimated
            details: [
              "Exceeded data allowances on high-usage lines",
              "International roaming or premium features"
            ]
          },
          {
            lineNumber: "Select Accounts",
            name: "Taxes & Fees",
            changeText: "Increased surcharges",
            changeAmount: 100.00,
            details: [
              "Broadcast TV fee up $1 (if applicable)",
              "Regulatory fees and taxes adjustments"
            ]
          },
          {
            lineNumber: "Overall",
            name: "Usage Growth",
            changeText: "Higher monthly usage",
            changeAmount: estimatedIncrease,
            details: [
              "More lines or increased data consumption",
              "New activations or upgrades"
            ]
          }
        ],
        currentTotal: "$6,444.36",
        previousTotal: "$0.00", // Placeholder; actual previous would require historical data
        totalIncrease: "+$6,444.36", // Attributed to unpaid from previous cycles + hikes
        totalLines: totalAccounts, // Using accounts as proxy
        linesWithIncreases: unpaidAccounts,
        linesUnchanged: 5, // Paid accounts (45-40=5)
        autoPayInfo: "AutoPay is scheduled to charge your business account on 10/05/2025.",
        additionalInfo: "For a complete breakdown, I recommend reviewing individual account details in Premier. Would you like a detailed report or help with payments?"
      });
    } else {
      // Consumer user - UPDATED: Customized with sample data and common reasons
      this.addBotMessage({
        type: 'bill-analysis',
        text: `I've analyzed your account for GreenLeaf Landscaping LLC. Your current bill is $215.00, which is $20.00 higher than last month's $195.00.\n\nThis increase is primarily due to recent AT&T price adjustments on wireless plans (up to $10 per line for legacy unlimited plans effective August 2025) and higher taxes/fees. Your usage remains under limits (e.g., 2.1 GB / 5 GB on Line 1), so no overages this cycle.\n\nHere are the key factors:`,
        billBreakdown: [
          {
            lineNumber: "Wireless Line 1 & 2",
            name: "Plan Price Increase",
            changeText: "$10 total (up to $5/line)",
            changeAmount: 10.00,
            details: [
              "AT&T price hikes for older unlimited plans starting August 2025",
              "Applies to your two active wireless lines"
            ]
          },
          {
            lineNumber: "Business Internet",
            name: "Monthly Service",
            changeText: "No change",
            changeAmount: 0.00,
            details: [
              "Standard $75.00 for unlimited data (220 GB used)",
              "No overages or adjustments"
            ]
          },
          {
            lineNumber: "Digital Phone",
            name: "Monthly Service",
            changeText: "No change",
            changeAmount: 0.00,
            details: [
              "Standard $30.00 for unlimited minutes (430 min used)",
              "No international calls detected"
            ]
          },
          {
            lineNumber: "Overall",
            name: "Taxes & Fees",
            changeText: "Increased surcharges",
            changeAmount: 10.00,
            details: [
              "Regulatory fees and taxes up $10.00",
              "Common adjustment due to recent rate changes"
            ]
          }
        ],
        currentTotal: "$215.00",
        previousTotal: "$195.00",
        totalIncrease: "+$20.00",
        totalLines: 4, // 2 wireless + internet + phone
        linesWithIncreases: 1, // Wireless affected by hike
        linesUnchanged: 3,
        autoPayInfo: "AutoPay: Enabled",
        additionalInfo: "Your devices (iPhone 13, Samsung Galaxy S22, AT&T Gateway) are active with no equipment installments adding to the bill this cycle. For savings, consider plan upgrades or discount eligibility. Need help reducing costs?"
      });
    }
  }

  private showBillSummary(): void {
    // Helper to format date as 'Sep 15, 2025'
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    // Helper for payment date format like 'Sep 01 - Thank you!'
    const formatPaymentDate = (date: Date): string => {
      return `${formatDate(date)} - Thank you!`;
    };

    const currentDate = new Date('2025-10-02'); // Current date
    const issueDate = new Date('2025-08-28'); // Billed date from image
    const dueDate = new Date('2025-09-23'); // Due date from image
    const paymentDateObj = new Date('2025-10-01'); // Payment date from schedule image

    if (this.userFlowContext === 'small-business') {
      const ban = this.banNumber || this.smallBusinessAccounts.find(acc => acc.balance > 0)?.ban || "287237545598";  // UPDATED: Fallback to first unpaid
      const data = this.getAccountDataForBan(ban);
      const due = data ? parseFloat(data.balance.replace('$', '').replace(',', '')) : 0;
      const billData: BillSummaryData = {
        companyName: data ? data.name : "LENNAR CORPORATE CTR",
        companyAddress: "5834 BETHELVIEW RD\nCUMMING, GA 30040-6312",
        pageInfo: "",
        issueDate: formatDate(issueDate),
        accountNumber: ban,
        foundationAccount: "00060030",
        invoice: ban,
        totalDue: due,
        dueDate: formatDate(dueDate),
        lastBill: due,
        paymentAmount: due,
        paymentDate: formatPaymentDate(paymentDateObj),
        remainingBalance: 0.00,
        services: [
          { name: "Wireless", amount: due }
        ],
        totalServices: due
      };

      this.addBotMessage({
        type: 'bill-summary',
        title: "📄 Your AT&T Bill Summary",
        billData: billData,
        buttons: [
          { text: "Download PDF", action: "download_pdf" },
          { text: "Pay Bill", action: "pay_bill_prompt" }
        ]
      });
    } else {
      // ✅ Consumer Flow Bill Summary
      const billData: BillSummaryData = {
        companyName: "GreenLeaf Landscaping LLC", // Adapted from sample
        companyAddress: "857 Warehouse Rd E, \nToledo, OH 43615", // Consumer address (kept generic)
        pageInfo: "",
        issueDate: formatDate(issueDate), // Kept from code, but aligns with 2025 context
        accountNumber: "534182857536", // From sample
        foundationAccount: "",
        invoice: "INV20250915",
        totalDue: 124.17, // From sample: Current Balance
        dueDate: formatDate(new Date('2025-10-15')), // Updated due date to Oct 15, 2025 (adjusted for current date Oct 02, 2025; sample had 06/15/2024)
        lastBill: 124.17, // From sample: Last Bill Amount
        paymentAmount: 124.17,
        paymentDate: formatPaymentDate(new Date('2025-10-15')), // Adjusted for current cycle
        remainingBalance: 0.00,
        services: [ // Adapted from sample Services Overview
          { name: "Wireless Line 1 ((555) 123-4567)", amount: 45.00 },
          { name: "Wireless Line 2 ((555) 987-6543)", amount: 45.00 },
          { name: "Business Internet (87654321)", amount: 75.00 },
          { name: "Digital Phone ((555) 555-1212)", amount: 30.00 },
          { name: "Taxes & Fees", amount: 20.00 } // Added to reach total 215.00
        ],
        totalServices: 215.00,
        billingPeriod: "09/01 to 09/30", // Updated for September 2025 cycle (given current date Oct 02, 2025)
        adjustments: 0.00
      };
  
      this.addBotMessage({
        type: 'bill-summary',
        title: "📄 Your AT&T Bill Summary",
        billData,
        buttons: [
          { text: "Download PDF", action: "download_pdf" },
          { text: "Pay Bill", action: "pay_bill_prompt" }
        ]
      });
    }
  }

  // NEW: Dynamic cases for select_ban_ and select_account_pay_ (before other cases)
  handleButtonClick(action: string, data?: any): void {
    // Dynamic BAN selection (view flow)
    if (action.match(/^select_ban_(.+)$/)) {
      const ban = action.split('_')[2];
      this.banNumber = ban;
      this.handleAfterBanSet();
      return;
    }

    // Dynamic pay account selection
    if (action.match(/^select_account_pay_(.+)$/)) {
      const payBan = action.split('_')[3];
      const accountData = this.getAccountDataForBan(payBan);
      if (accountData) {
        this.handleAccountSelectionForPayment(payBan, accountData.name, accountData.balance.replace('$', ''));
      }
      return;
    }

    switch (action) {
      case 'help_shop':
        this.handleShoppingRequest();
        break;

      case 'need_support':
        this.handleSupportRequest();
        break;

      case 'view_bill':
        this.handleViewBillRequest();
        break;

      case 'bill_analysis':
        this.handleBillAnalysisRequest();
        break;

      case 'download_bill':
        this.handleDownloadBillRequest();
        break;

      case 'show_more_bans':
        this.banPage++;
        const isPayFlow = this.pendingAction === 'pay_bill';
        const { accounts, hasMore } = this.getPaginatedAccounts(isPayFlow);  // UPDATED: Pass boolean directly (true for pay filter)
      
        let followUpText = `Here are the next ${accounts.length} accounts (page ${this.banPage + 1}).`;
        if (!hasMore) {
          followUpText += ` These are the last ones.`;
        }
      
        const buttons: ChatButton[] = [];
        if (isPayFlow) {
          accounts.forEach(acc => {
            buttons.push({ 
              text: `${acc.ban} – ${acc.name} ($${acc.balance.toLocaleString()})`, 
              action: `select_account_pay_${acc.ban}`, 
              primary: true, 
              asLink: true 
            });
          });
        } else {
          accounts.forEach(acc => {
            buttons.push({
              text: `${acc.ban} – ${acc.name}`,
              action: `select_ban_${acc.ban}`,
              primary: false,
              asLink: true
            });
          });
        }
        buttons.push(
          { text: 'Enter BAN manually', action: 'enter_ban_manually', primary: false },
          { text: 'Back to top accounts', action: 'back_to_top_bans', primary: false } // Optional back button
        );
        if (hasMore) {
          buttons.push({ text: 'Show more options', action: 'show_more_bans', primary: false });
        }
      
        this.addBotMessage({
          type: 'text',
          text: followUpText,
          buttons
        });
        break;
      
      // Optional: Add back to top (recompute isPayFlow here to avoid scoping)
      case 'back_to_top_bans':
        this.banPage = 0;
        const backIsPayFlow = this.pendingAction === 'pay_bill'; // Recompute to fix scope
        if (backIsPayFlow) {
          this.askForPayBANSelection();
        } else {
          this.askForBANSelection();
        }
        break;

      case 'pay_bill':
        this.handlePayBillRequest();
        break;

      case 'service_wireless':
        this.handleWirelessService();
        break;

      case 'service_internet':
        this.handleInternetService();
        break;

      case 'service_wireless_authenticated':
        this.handleWirelessServiceAuthenticated();
        break;

      case 'service_internet_authenticated':
        this.handleInternetServiceAuthenticated();
        break;

      case 'login':
        this.currentStep = 'att_id';
        if (!this.pendingAction || this.pendingAction === 'login') {
          this.pendingAction = 'login';
        }
        this.addBotMessage({
          type: 'text',
          text: "Please enter your email or username:"
        });
        break;

      case 'download_pdf':
        this.handleDownloadPdf();
        break;

      // UPDATED: Dynamic accounts from smallBusinessAccounts
      case 'pay_bill_prompt':
        if (this.userFlowContext === 'small-business') {
          const unpaidAccounts = this.smallBusinessAccounts.filter(acc => acc.balance > 0);
          const totalDue = unpaidAccounts.reduce((sum, acc) => sum + acc.balance, 0);
          const accountsList = unpaidAccounts.slice(0, 5).map(acc => `${acc.ban} – ${acc.name}: $${acc.balance.toLocaleString()}`).join('\n');  // Top 5 for brevity
          const currentBalance = this.selectedAccountBalance ? parseFloat(this.selectedAccountBalance).toLocaleString() : '0.00';
          const text = `Total due across all accounts: $${totalDue.toLocaleString()}\n\nCurrent selected balance: $${currentBalance}\n\nWould you like to pay the full total, select a specific account, enter a BAN, or continue with the current selected BAN?`;
          this.addBotMessage({
            type: 'text',
            text: text,
            buttons: [
              { text: `Pay Full ($${totalDue.toLocaleString()})`, action: 'pay_full_total', primary: false },
              { text: `Continue with Current Selected BAN ($${currentBalance})`, action: 'pay_full_amount', primary: false },
              { text: 'Select Account from List', action: 'select_pay_account', primary: false },
              { text: 'Enter BAN', action: 'enter_ban_manually', primary: false }
            ]
          });
        } else {
          this.addBotMessage({
            type: 'text',
            text: "How much do you want to pay? Feel free to enter an amount using only numbers."
          });
        }
        break;

      // UPDATED: Dynamic total
      case 'pay_full_total':
        const fullTotal = this.smallBusinessAccounts
          .filter(acc => acc.balance > 0)
          .reduce((sum, acc) => sum + acc.balance, 0);
        this.paymentAmount = fullTotal.toFixed(2);
        this.selectedAccount = 'all';
        this.addBotMessage({
          type: 'text',
          text: `Great! Let me help you with your $${fullTotal.toLocaleString()} payment for all accounts. Select one of the available options below.`
        });
        
        setTimeout(() => {
          this.addBotMessage({
            type: 'payment-method',
            paymentAmount: fullTotal
          });
        }, 500);
        break;

      case 'select_pay_account':
        this.askForPayBANSelection();
        break;

      case 'navigate_to_bills':
        // This will be handled by the component to navigate to bills page
        break;

      case 'continue_chat':
        this.addBotMessage({
          type: 'text',
          text: "How else can I help you today?",
          buttons: [
            { text: "View Bill", action: "view_bill", primary: true },
            { text: "Pay Bill", action: "pay_bill_prompt", primary: true },
            { text: "Download Bill", action: "download_pdf", primary: true },
            { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
          ]
        });
        break;

      case 'confirm_payment':
        this.addBotMessage({
          type: 'text',
          text: "How much do you want to pay?\n\nFeel free to enter an amount using only numbers."
        });
        break;

      case 'continue_payment':
        this.processSavedCardPayment(data);
        break;

      case 'cancel_payment':
        this.addBotMessage({
          type: 'text',
          text: "No problem! Is there anything else I can help you with today?"
        });
        break;

      case 'pay_with_visa':
      case 'pay_with_mastercard':
      case 'pay_with_discover':
      case 'pay_with_amex':
        this.showCardDetailsForm(action, data);
        break;

      case 'submit_payment':
        this.processPayment(data);
        break;

     

      // REMOVED: Hardcoded select_account_1/2/3, select_account_pay_2/3, select_ban_1/2/3 (now dynamic)

      case 'enter_ban_manually':
        this.addBotMessage({
          type: 'ban-input',
          text: "Please enter your Billing Account Number (BAN):",
          banAccounts: this.smallBusinessAccounts
        });
        this.currentStep = 'ban';
        break;

      case 'pay_full_amount':
        this.handlePaymentAmountSelection('full');
        break;

      case 'enter_other_amount':
        this.handlePaymentAmountSelection('other');
        break;

      case 'add_new_payment_method':
        this.handleAddNewPaymentMethod();
        break;

      case 'show_ban_help':
        this.addBotMessage({
          type: 'text',
          text: "You can find your Billing Account Number (BAN) in your myAT&T profile under 'My linked accounts', or on your AT&T bill in the account summary section, usually in the upper right-hand corner of any bill or invoice."
        });
        // Re-ask for BAN after showing help
        setTimeout(() => {
          if (this.pendingAction === 'pay_bill') {
            this.askForPayBANSelection();
          } else {
            this.askForBANSelection();
          }
        }, 1000);
        break;

      default:
        this.addBotMessage({
          type: 'text',
          text: "I'm not sure how to help with that. Try asking about your bill, making a payment, or downloading your statement.",
          buttons: [
            { text: "View Bill", action: "view_bill", primary: true },
            { text: "Pay Bill", action: "pay_bill", primary: true },
            { text: "Download Bill", action: "download_bill", primary: true },
            { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
          ]
        });
    }
  }

  private handleShoppingRequest(): void {
    this.addBotMessage({
      type: 'text',
      text: "I'd be happy to help you find the perfect phone, plan, or protection! What are you most interested in today?",
      buttons: [
        { text: "New Phone", action: "shop_phone", primary: true },
        { text: "New Plan", action: "shop_plan", primary: true },
        { text: "Add a Line", action: "add_line", primary: true },
        { text: "Device Protection", action: "device_protection", primary: true }
      ]
    });
  }

  private handleSupportRequest(): void {
    this.addBotMessage({
      type: 'text',
      text: "Can you tell me more about what you need help with?"
    });
  }

  private handleWirelessService(): void {
    if (this.authService.isAuthenticated()) {
      this.showBillAnalysis();
    } else {
      this.addBotMessage({
        type: 'text',
        text: "Great! Thanks for signing in.\n\nSo I can get you the right info, what service are you asking about?",
        buttons: [
          { text: "AT&T Wireless", action: "service_wireless_authenticated", primary: true }
        ]
      });
    }
  }

  private handleInternetService(): void {
    this.addBotMessage({
      type: 'text',
      text: "OK, let me pull up your account info"
    });
    
    setTimeout(() => {
      this.addBotMessage({
        type: 'text',
        text: "It looks like your account is paid in full.\n\nDo you still want to make a payment?",
        buttons: [
          { text: "Yes", action: "confirm_payment", primary: true },
          { text: "No", action: "cancel_payment" }
        ]
      });
    }, 2000);
  }

  private handleWirelessServiceAuthenticated(): void {
    this.executeUserRequest();
  }

  private handleInternetServiceAuthenticated(): void {
    this.addBotMessage({
      type: 'text',
      text: "OK, let me pull up your account info"
    });
    
    setTimeout(() => {
      this.addBotMessage({
        type: 'text',
        text: "It looks like your account is paid in full.\n\nDo you still want to make a payment?",
        buttons: [
          { text: "Yes", action: "confirm_payment", primary: true },
          { text: "No", action: "cancel_payment" }
        ]
      });
    }, 2000);
    this.pendingAction = '';
  }

  private handlePaymentAmount(amount: number): void {
    if (amount > 0) {
      this.paymentAmount = amount.toFixed(2);
      this.addBotMessage({
        type: 'text',
        text: `Great, let me help you with your $${amount.toFixed(2)} payment. Select one of the available options below.`
      });
      
      setTimeout(() => {
        this.addBotMessage({
          type: 'payment-method',
          paymentAmount: amount
        });
      }, 500);
    } else {
      this.addBotMessage({
        type: 'text',
        text: "Please enter a valid payment amount greater than $0:"
      });
    }
  }

  private showCardDetailsForm(cardType: string, amount: number): void {
    this.addBotMessage({
      type: 'form',
      title: `💳 ${this.getCardName(cardType)} Payment`,
      subtitle: `Amount: $${amount.toFixed(2)}`,
      text: "Please enter your payment details:",
      formFields: [
        { label: "First Name", type: "text", name: "firstName", placeholder: "Enter first name" },
        { label: "Last Name", type: "text", name: "lastName", placeholder: "Enter last name" },
        { label: "Card Number", type: "text", name: "cardNumber", placeholder: "Enter card number" },
        { label: "CVV", type: "text", name: "cvv", placeholder: "3 or 4 digits" },
        { label: "Expiration Month", type: "select", name: "expMonth", options: ["01","02","03","04","05","06","07","08","09","10","11","12"] },
        { label: "Expiration Year", type: "select", name: "expYear", options: ["2025","2026","2027","2028","2029","2030"] },
        { label: "Street Address", type: "text", name: "street", placeholder: "Enter street address" },
        { label: "City", type: "text", name: "city", placeholder: "Enter city" },
        { label: "State", type: "text", name: "state", placeholder: "Enter state" },
        { label: "ZIP Code", type: "text", name: "zip", placeholder: "Enter ZIP code" }
      ],
      buttons: [
        { text: "Submit Payment", action: "submit_payment", data: { amount, cardType } },
        { text: "Cancel", action: "cancel_payment" }
      ]
    });
  }

  private getCardName(cardType: string): string {
    switch (cardType) {
      case 'pay_with_visa': return 'Visa';
      case 'pay_with_mastercard': return 'MasterCard';
      case 'pay_with_discover': return 'Discover';
      case 'pay_with_amex': return 'American Express';
      default: return 'Card';
    }
  }

  private processSavedCardPayment(amount: number): void {
    this.addBotMessage({
      type: 'text',
      text: "Processing your payment... Please wait."
    });

    setTimeout(() => {
      this.addBotMessage({
        type: 'text',
        text: `Payment of $${amount.toFixed(2)} has been processed successfully using card ending in 3695! You should receive a confirmation email shortly.`
      });
    }, 2000);
  }

  private processPayment(data: any): void {
    // Simulate payment processing
    setTimeout(() => {
      this.addBotMessage({
        type: 'text',
        text: `✅ Your ${this.getCardName(data.cardType)} payment of $${data.amount.toFixed(2)} has been processed successfully! You should receive a confirmation email shortly.`
      });
    }, 2000);

    // Show processing message
    this.addBotMessage({
      type: 'text',
      text: "🔄 Processing your payment... Please wait."
    });
  }

  private handleDownloadPdf(): void {
    if (this.userFlowContext === 'small-business') {
      this.addBotMessage({
        type: 'text',
        text: "Preparing your bill for download..."
      });

      setTimeout(() => {
        const filePath = 'assets/LENNAR_CORP.pdf';
        const fileName = 'LENNAR_CORP.pdf';
    
        fetch(filePath)
          .then(response => response.blob())
          .then(blob => {
            // Convert PDF blob into a generic binary blob
            const newBlob = new Blob([blob], { type: 'application/octet-stream' });
    
            const blobUrl = window.URL.createObjectURL(newBlob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
    
            const downloadLink = `<a href="${filePath}" download style="color:#0078D7;text-decoration:underline;">Click here to download again</a>`;
            this.addBotMessage({
              type: 'text',
              text: `Your bill has been downloaded successfully!. Check your Downloads folder.`
            });
          })
          .catch(() => {
            this.addBotMessage({
              type: 'text',
              text: "Sorry, something went wrong while downloading your bill."
            });
          });
      }, 1500);
    } else {
      // Simulate PDF download
      this.addBotMessage({
        type: 'text',
        text: "Preparing your bill for download..."
      });

      setTimeout(() => {
        const filePath = 'assets/ATTBill_7536_Sep2025.pdf';
        const fileName = 'ATTBill_7536_Sep2025.pdf';
    
        fetch(filePath)
          .then(response => response.blob())
          .then(blob => {
            // Convert PDF blob into a generic binary blob
            const newBlob = new Blob([blob], { type: 'application/octet-stream' });
    
            const blobUrl = window.URL.createObjectURL(newBlob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
    
            const downloadLink = `<a href="${filePath}" download style="color:#0078D7;text-decoration:underline;">Click here to download again</a>`;
            this.addBotMessage({
              type: 'text',
              text: `Your bill has been downloaded successfully!. Check your Downloads folder.`
            });
          })
          .catch(() => {
            this.addBotMessage({
              type: 'text',
              text: "Sorry, something went wrong while downloading your bill."
            });
          });
      }, 1500);
    }
  }

  private addBotMessage(card: ChatCard): void {
    const botMessage: ChatMessage = {
      id: this.generateId(),
      isUser: false,
      timestamp: new Date(),
      card
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, botMessage]);
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  resetChat(): void {
    this.messagesSubject.next([]);
    this.lastUserQuestion = '';
    this.pendingAction = '';
    this.initializeChat();
  }

  // Method to reinitialize chat after login
  reinitializeAfterLogin(): void {
    // Only proceed if we have a pending action (excluding login itself)
    if (this.pendingAction && this.pendingAction !== 'login') {
      // Add the sign-in message with delay
      setTimeout(() => {
        // Different messages based on user flow context
        if (this.userFlowContext === 'small-business') {
          this.addBotMessage({
            type: 'text',
            text: 'You are now signed in'
          });
        } else {
          this.addBotMessage({
            type: 'text',
            text: 'Great! Thanks for signing in.'
          });
        }

        // Start the appropriate flow based on pendingAction for small-business users
        setTimeout(() => {
          if (this.userFlowContext === 'small-business') {
            if (this.pendingAction === 'pay_bill') {
              this.showPayOptions();
            } else if (this.pendingAction === 'view_bill') {
              this.askForBANSelection();
            } else if (this.pendingAction === 'bill_analysis') {  // NEW: Direct for analysis
              this.showBillAnalysis();
            } else if (this.pendingAction === 'download_bill') {  // NEW: Direct for download
              this.handleDownloadPdf();
            } else {
              this.askForBANSelection();
            }
          } else {
            // For consumer users, directly execute their pending request
            this.executeUserRequest();
          }
        }, 1200); // Increased to 1.2 seconds before asking for BAN or executing request
      }, 800); // Increased to 0.8 seconds before sign-in message
    }
  }

  private askForAccountSelection(context: 'view_bill' | 'pay_bill'): void {
    this.currentStep = 'account_selection';
    this.pendingAction = context;

    const messageText = context === 'view_bill'
      ? 'Sure, I can help you with that. Which account would you like to see?'
      : 'Sure, let\'s schedule your payment. Which account do you want to pay?';

    // UPDATED: Dynamic buttons from array (top 3)
    const topAccounts = this.smallBusinessAccounts
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 3);
    const buttons = context === 'view_bill'
      ? topAccounts.map(acc => ({
          text: `Account: ${acc.ban} – ${acc.name}`, 
          action: `select_ban_${acc.ban}`, 
          primary: true 
        }))
      : topAccounts.map(acc => ({
          text: `${acc.ban} – ${acc.name} ($${acc.balance.toLocaleString()} due)`, 
          action: `select_account_pay_${acc.ban}`, 
          primary: true 
        }));

    this.addBotMessage({
      type: 'text',
      text: messageText,
      buttons: buttons
    });
  }

  private handleAccountSelection(accountNumber: string, accountName: string, balance: string): void {
    this.selectedAccount = accountNumber;
    this.selectedAccountName = accountName;
    this.selectedAccountBalance = balance;
    this.currentStep = null;

    this.addBotMessage({
      type: 'text',
      text: `Here's your bill summary for Account ${accountNumber} (${accountName}):\n\nBalance Forward: ${balance}\n\nCurrent Charges: $0.00\n\nTotal Amount Due: ${balance}\n\nBill Due Date: 09/23/2025\n\n👉 Would you like to download the bill PDF or make a payment?`,
      buttons: [
        { text: 'Download PDF', action: 'download_pdf', primary: true },
        { text: 'Pay Bill', action: 'pay_bill_prompt', primary: true }
      ]
    });
    this.clearPendingState();
  }

  private handleAccountSelectionForPayment(accountNumber: string, accountName: string, amount: string): void {
    this.selectedAccount = accountNumber;
    this.selectedAccountName = accountName;
    this.selectedAccountBalance = amount;
    this.currentStep = 'payment_amount';

    this.addBotMessage({
      type: 'text',
      text: `Great! Your total amount due is $${amount}, and payment is due by 09/23/2025.\n\nHow would you like to continue?`,
      buttons: [
        { text: `Pay Full Amount ($${amount})`, action: 'pay_full_amount', primary: false },
        { text: 'Enter Other Amount', action: 'enter_other_amount', primary: false }
      ]
    });
    this.clearPendingState();
  }

  private handlePaymentAmountSelection(type: 'full' | 'other'): void {
    if (type === 'full') {
      this.paymentAmount = this.selectedAccountBalance;
      this.currentStep = 'payment_method';

      this.addBotMessage({
        type: 'text',
        text: `Great! Let me help you with your $${parseFloat(this.paymentAmount).toLocaleString()} payment. Select one of the available options below.`
      });
      
      setTimeout(() => {
        this.addBotMessage({
          type: 'payment-method',
          paymentAmount: parseFloat(this.paymentAmount)
        });
      }, 500);
    } else {
      this.currentStep = 'payment_amount';
      this.addBotMessage({
        type: 'text',
        text: 'Please enter the amount you would like to pay:'
      });
    }
  }

  private handleAddNewPaymentMethod(): void {
    this.addBotMessage({
      type: 'text',
      text: '✅ Got it. Please add your payment details to complete the payment.',
      buttons: [
        { text: 'Continue', action: 'continue_chat', primary: false }
      ]
    });
  }

  // Add method to show signed in status
  showSignedInStatus(): void {
    const statusMessage: ChatMessage = {
      id: this.generateId(),
      isUser: false,
      timestamp: new Date(),
      card: {
        type: 'signed-in-status',
        text: 'You are now signed in'
      }
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, statusMessage]);
  }

  // Execute the user's original request after sign-in
  private executeUserRequest(): void {
    if (this.pendingAction === 'bill_analysis' || (this.lastUserQuestion && this.lastUserQuestion.toLowerCase().includes('bill') && this.lastUserQuestion.toLowerCase().includes('high'))) {
      // For consumer flow, ask about service type
      if (this.userFlowContext === 'consumer') {
        setTimeout(() => {
          this.addBotMessage({
            type: 'text',
            text: "So I can get you the right info, what service are you asking about?",
            buttons: [
              { text: "AT&T Wireless", action: "service_wireless", primary: false },
              { text: "AT&T Internet", action: "service_internet", primary: false }
            ]
          });
          this.clearPendingState();
        }, 1000);
      } else {
        // For small-business flow, show bill analysis directly
        this.addBotMessage({
          type: 'text',
          text: 'Let me analyze your bill for you...'
        });

        setTimeout(() => {
          this.showBillAnalysis();
          this.clearPendingState();
        }, 3000);
      }
    } else if (this.pendingAction === 'view_bill' || (this.lastUserQuestion && this.lastUserQuestion.toLowerCase().includes('view bill'))) {
      if (this.userFlowContext === 'small-business') {
        // For small-business users, ask which account
        setTimeout(() => {
          this.pendingAction = 'view_bill';
          this.askForBANSelection();
        }, 500);
      } else {
        // For consumer users, show bill summary directly
        this.addBotMessage({
          type: 'text',
          text: 'Let me pull up your bill summary...'
        });

        setTimeout(() => {
          this.showBillSummary();
          this.clearPendingState();
        }, 2500);
      }
    } else if (this.pendingAction === 'download_bill' || (this.lastUserQuestion && this.lastUserQuestion.toLowerCase().includes('download'))) {
      setTimeout(() => {
        this.handleDownloadPdf();
        this.clearPendingState();
      }, 1500);
    } else if (this.pendingAction === 'pay_bill' || (this.lastUserQuestion && this.lastUserQuestion.toLowerCase().includes('pay'))) {
      if (this.userFlowContext === 'small-business') {
        // For small-business users, ask for BAN then account to pay
        setTimeout(() => {
          this.pendingAction = 'pay_bill';
          this.showPayOptions();
        }, 500);
      } else {
        // For consumer users
        setTimeout(() => {
          this.addBotMessage({
            type: 'text',
            text: "Please enter the amount you want to pay:"
          });
          this.clearPendingState();
        }, 1500);
      }
    } else {
      // Default response with delay
      setTimeout(() => {
        this.addBotMessage({
          type: 'text',
          text: "How can I help you today?",
          buttons: [
            { text: "View Bill", action: "view_bill", primary: false },
            { text: "Pay Bill", action: "pay_bill", primary: false },
            { text: "Download Bill", action: "download_bill", primary: false },
            { text: "Why my bill is too high?", action: "bill_analysis", primary: false }
          ]
        });
        this.clearPendingState();
      }, 1500);
    }
  }

  // Clear pending state to prevent duplicate executions
  private clearPendingState(): void {
    this.pendingAction = '';
    this.lastUserMessage = null;
    this.lastUserQuestion = '';
  }
}