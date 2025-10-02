import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { ChatMessage, ChatCard, BillSummaryData, OptionCard, ChatButton } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private userFlowContext: 'consumer' | 'small-business' | 'enterprise' = 'consumer';

  private viewBillUtterances = [
    "view my bill",
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
  private userName = "";
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  private lastUserQuestion: string = '';
  private lastUserMessage: ChatMessage | null = null;
  private pendingAction: string = '';

  private currentStep: 'ban' | 'account_selection' | 'payment_amount' | 'payment_method' | null = null;

  private banNumber: string = '';
  private selectedAccount: string = '';
  private selectedAccountName: string = '';
  private selectedAccountBalance: string = '';
  private paymentAmount: string = '';

  private smallBusinessAccounts = [
    { ban: '00060030', name: 'LENNAR CORPORATE CTR-R CCDA MAC CRU', balance: 0.00 },
    { ban: '287237545598', name: 'LENNAR CORPORATE CTR', balance: 64.55 },
    { ban: '287242788082', name: 'LENNAR CORPORATION', balance: 10.15 },
    { ban: '287244036928', name: 'LENNAR CORPORATIONS', balance: 17.15 },
    { ban: '287245050664', name: 'LENNAR CORPORATION', balance: 146.76 },
    { ban: '287245544976', name: 'LENNAR CORPORATE CTR', balance: 41.14 },
    { ban: '287261139597', name: 'LENNAR CORPORATE CTR-N 1 CCDA MAC I', balance: 587.26 },
    { ban: '287262877679', name: 'LENNAR CORPORATION-MAIN ACCT', balance: 133164.08 },
    { ban: '287263043039', name: 'LENNAR CORPORATE', balance: 82.38 },
    { ban: '287295433717', name: 'SANDRA A PETERSON', balance: 59.18 },
    { ban: '287302190660', name: 'LENNAR CORPORATION', balance: 2494.25 },
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

  constructor(private authService: AuthService) {}

  setUserFlowContext(context: 'consumer' | 'small-business' | 'enterprise'): void {
    this.userFlowContext = context;
  }

  getUserFlowContext(): 'consumer' | 'small-business' | 'enterprise' {
    return this.userFlowContext;
  }

  openChat(): void {
    this.isOpenSubject.next(true);
    // Always initialize chat when opening, but don't duplicate messages
    const currentMessages = this.messagesSubject.value;
    if (currentMessages.length === 0) {
      this.initializeChat();
    }
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
    if (this.currentStep === 'ban') {
      this.banNumber = text.trim();
      this.handleAfterBanSet();
      return;
    }

    if (matchesUtterances(this.viewBillUtterances)) {
      this.handleViewBillRequest();
    } else if (matchesUtterances(this.billAnalysisUtterances)) {
      this.handleBillAnalysisRequest();
    } else if (matchesUtterances(["download bill", "download pdf"])) { // optional array
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
  private handleBillPayRequest(): void {
    this.addBotMessage({
      type: 'text',
      text: "So I can get you the right info, what service are you asking about?",
      buttons: [
        { text: "AT&T Wireless", action: "service_wireless", primary: true },
        { text: "AT&T Internet", action: "service_internet", primary: true }
      ]
    });
  }

  private handlePayBillRequest(): void {
    if (this.authService.isAuthenticated()) {
      if (this.userFlowContext === 'small-business') {
        this.pendingAction = 'pay_bill';
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
    const accounts = [
      { ban: '2873754559', name: 'LENNA CORPORATE CTR', balance: 100000 },
      { ban: '2874278802', name: 'LENNA CORPORATION', balance: 33000 }
    ];
    const totalDue = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    let text = `Your accounts and amounts due:\n\n`;
    accounts.forEach(acc => {
      text += `${acc.ban} – ${acc.name}: $${acc.balance.toLocaleString()}\n`;
    });
    text += `\nTotal due across all accounts: $${totalDue.toLocaleString()}\n\nWould you like to pay the full total or select a specific account to pay?`;

    this.addBotMessage({
      type: 'text',
      text: text,
      buttons: [
        { text: `Pay Full Total ($${totalDue.toLocaleString()})`, action: 'pay_full_total', primary: true },
        { text: 'Select Specific Account', action: 'select_pay_account', primary: true }
      ]
    });
  }

  private askForPayBANSelection(): void {
    this.currentStep = 'ban';
    this.addBotMessage({
      type: 'text',
      text: "Which account would you like to pay? Select below:",
      buttons: [
        { text: "2873754559 – LENNA CORPORATE CTR ($100,000.00)", action: "select_ban_2", primary: false, asLink: true },
        { text: "2874278802 – LENNA CORPORATION ($33,000.00)", action: "select_ban_3", primary: false, asLink: true },
        { text: "Enter BAN manually", action: "enter_ban_manually", primary: false, asLink: true },
        { text: "How to find my BAN?", action: "show_ban_help", primary: false, asLink: true }
      ]
    });
  }

  private askForBANSelection(): void {
    this.currentStep = 'ban';
    this.addBotMessage({
      type: 'text',
      text: "Select your Billing Account Number (BAN) below, or enter it manually:",
      buttons: [
        { text: "00060030 – LENNA CORPORATE CTR-CCDA MAC CRU", action: "select_ban_1", primary: false },
        { text: "2873754559 – LENNA CORPORATE CTR", action: "select_ban_2", primary: false },
        { text: "2874278802 – LENNA CORPORATION", action: "select_ban_3", primary: false },
        { text: "Enter BAN manually", action: "enter_ban_manually", primary: false },
        { text: "How to find my BAN?", action: "show_ban_help", primary: false }
      ]
    });
  }

  private getAccountDataForBan(ban: string): {name: string, balance: string} | null {
    const accounts: {[key: string]: {name: string, balance: string}} = {
      '00060030': {name: 'LENNA CORPORATE CTR-CCDA MAC CRU', balance: '$0.00'},
      '2873754559': {name: 'LENNA CORPORATE CTR', balance: '$100000.00'},
      '2874278802': {name: 'LENNA CORPORATION', balance: '$33000.00'},
    };
    return accounts[ban] || null;
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
              { text: "Select Account", action: "select_pay_account", primary: true }
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
      // Small-business user - show detailed multi-line analysis using image data
      const totalLines = 127;
      const linesWithIncreases = 8;
      const linesUnchanged = totalLines - linesWithIncreases;

      this.addBotMessage({
        type: 'bill-analysis',
        text: `I've analyzed your business account with ${totalLines} lines. Your bill has increased by $90.49 compared to the previous month.\n\nOut of ${totalLines} lines, ${linesWithIncreases} lines had changes while ${linesUnchanged} lines remained unchanged.\n\nHere are the key changes that contributed to the increase:`,
        billBreakdown: [
          {
            lineNumber: "Line number 469.426.7221",
            name: "ABIRAMI THIRUGNANASIVAM",
            changeText: "Charges increased by $37.50",
            changeAmount: 37.50,
            details: [
              "International Day Pass charges for three days ($36.00)",
              "Monthly charges and taxes increased ($1.50)"
            ]
          },
          {
            lineNumber: "Line number 940.945.7123",
            name: "SREELEKHA RAJAMANICKAM",
            changeText: "New charges of $52.99",
            changeAmount: 52.99,
            details: [
              "Activation Fee adjustments (charged and credited)",
              "Prorated monthly charges for partial billing period",
              "Surcharges, taxes & fees"
            ]
          },
          {
            lineNumber: "Line number 214.555.0123",
            name: "BUSINESS LINE 3",
            changeText: "Charges decreased by $5.00",
            changeAmount: -5.00,
            details: [
              "Promotional discount applied",
              "Reduced data overage charges"
            ]
          },
          {
            lineNumber: "Line number 214.555.0156",
            name: "BUSINESS LINE 4",
            changeText: "Charges increased by $15.00",
            changeAmount: 15.00,
            details: [
              "Additional data usage charges ($12.00)",
              "Premium feature activation ($3.00)"
            ]
          }
        ],
        currentTotal: "$441.28",
        previousTotal: "$350.79",
        totalIncrease: "+$90.49",
        totalLines: totalLines,
        linesWithIncreases: linesWithIncreases,
        linesUnchanged: linesUnchanged,
        autoPayInfo: "AutoPay is scheduled to charge your business account on 10/05/2025.",
        additionalInfo: "For a complete line-by-line breakdown of all 127 lines, I can generate a detailed report. Would you like me to do that?"
      });
    } else {
      // Consumer user - show simple wireless bill analysis
      this.addBotMessage({
        type: 'text',
        text: "📊 I can help you understand your AT&T Wireless bill!\n\nYour current bill is $125.50, which is $15.00 higher than last month.\n\nHere's what changed:\n\n• Data overage charges: $10.00\n• International roaming: $5.00\n\nYour plan includes 10GB of data. This month you used 12GB, resulting in overage charges.",
        buttons: [
          { text: "View Full Bill", action: "view_bill", primary: true },
          { text: "Pay Bill", action: "pay_bill", primary: true }
        ]
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
      const ban = this.banNumber || "2873754559";
      const data = this.getAccountDataForBan(ban);
      const due = data ? parseFloat(data.balance.replace('$', '').replace(',', '')) : 0;
      const billData: BillSummaryData = {
        companyName: data ? data.name : "LENNA CORPORATE CTR",
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
        companyName: "AT&T Consumer",
        companyAddress: "123 Main Street\nDallas, TX 75201",
        pageInfo: "",
        issueDate: formatDate(issueDate),
        accountNumber: "****5678",
        foundationAccount: "",
        invoice: "INV20250915",
        totalDue: 125.50,
        dueDate: formatDate(dueDate),
        lastBill: 110.50,
        paymentAmount: 110.50,
        paymentDate: formatPaymentDate(new Date(issueDate.getTime() - 30 * 24 * 60 * 60 * 1000)),
        remainingBalance: 0.00,
        services: [
          { name: "Wireless Plan", amount: 95.00 },
          { name: "Device Installment", amount: 20.00 },
          { name: "Taxes & Fees", amount: 10.50 }
        ],
        totalServices: 125.50,
        billingPeriod: "08/15 to 09/14",
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

  handleButtonClick(action: string, data?: any): void {
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
        // This will be handled by the component to navigate to login
        break;


      case 'download_pdf':
        this.handleDownloadPdf();
        break;

      case 'pay_bill_prompt':
        if (this.userFlowContext === 'small-business') {
          const accounts = [
            { ban: '2873754559', name: 'LENNA CORPORATE CTR', balance: 100000 },
            { ban: '2874278802', name: 'LENNA CORPORATION', balance: 33000 }
          ];
          const totalDue = accounts.reduce((sum, acc) => sum + acc.balance, 0);
          const accountsList = accounts.map(acc => `${acc.ban} – ${acc.name}: $${acc.balance.toLocaleString()}`).join('\n');
          const currentBalance = this.selectedAccountBalance ? parseFloat(this.selectedAccountBalance).toLocaleString() : '0.00';
          const text = `Total due across all accounts: $${totalDue.toLocaleString()}\n\nAccounts:\n${accountsList}\n\nCurrent selected balance: $${currentBalance}\n\nWould you like to pay the full total, select a specific account, enter a BAN, or continue with the current selected BAN?`;
          this.addBotMessage({
            type: 'text',
            text: text,
            buttons: [
              { text: `Pay Full Total ($${totalDue.toLocaleString()})`, action: 'pay_full_total', primary: true },
              { text: `Continue with Current Selected BAN ($${currentBalance})`, action: 'pay_full_amount', primary: true },
              { text: 'Select Account from List', action: 'select_pay_account', primary: true },
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

      case 'pay_full_total':
        this.paymentAmount = '133000';
        this.selectedAccount = 'all';
        this.addBotMessage({
          type: 'text',
          text: `Great! Let me help you with your $133,000 payment for all accounts. Select one of the available options below.`
        });
        
        setTimeout(() => {
          this.addBotMessage({
            type: 'payment-method',
            paymentAmount: 133000
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

     

      case 'select_account_1':
        this.handleAccountSelection('00060030', 'LENNA CORPORATE CTR-CCDA MAC CRU', '$0.00');
        break;

      case 'select_account_2':
        this.handleAccountSelection('2873754559', 'LENNA CORPORATE CTR', '$100000.00');
        break;

      case 'select_account_3':
        this.handleAccountSelection('2874278802', 'LENNA CORPORATION', '$33000.00');
        break;

      case 'select_account_pay_2':
        this.handleAccountSelectionForPayment('2873754559', 'LENNA CORPORATE CTR', '100000');
        break;

      case 'select_account_pay_3':
        this.handleAccountSelectionForPayment('2874278802', 'LENNA CORPORATION', '33000');
        break;

      case 'select_ban_1':
        this.banNumber = '00060030';
        this.handleAfterBanSet();
        break;

      case 'select_ban_2':
        this.banNumber = '2873754559';
        this.handleAfterBanSet();
        break;

      case 'select_ban_3':
        this.banNumber = '2874278802';
        this.handleAfterBanSet();
        break;

      case 'enter_ban_manually':
        this.addBotMessage({
          type: 'text',
          text: "Please enter your Billing Account Number (BAN):"
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
        // In a real app, this would trigger an actual PDF download
        this.addBotMessage({
          type: 'text',
          text: "Your bill has been downloaded successfully! Check your Downloads folder."
        });
      }, 1500);
    } else {
      // Simulate PDF download
      this.addBotMessage({
        type: 'text',
        text: "Preparing your bill for download..."
      });

      setTimeout(() => {
        // In a real app, this would trigger an actual PDF download
        this.addBotMessage({
          type: 'text',
          text: "Your bill has been downloaded successfully! Check your Downloads folder."
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
    // Only proceed if we haven't already reinitialized
    if (this.pendingAction || this.lastUserMessage) {
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

    const buttons = context === 'view_bill'
      ? [
          { text: 'Account: 00060030 – LENNA CORPORATE CTR-CCDA MAC CRU', action: 'select_account_1', primary: true },
          { text: 'Account: 2873754559 – LENNA CORPORATE CTR', action: 'select_account_2', primary: true },
          { text: 'Account: 2874278802 – LENNA CORPORATION', action: 'select_account_3', primary: true }
        ]
      : [
          { text: '2873754559 – LENNA CORPORATE CTR ($100,000.00 due)', action: 'select_account_pay_2', primary: true },
          { text: '2874278802 – LENNA CORPORATION ($33,000.00 due)', action: 'select_account_pay_3', primary: true }
        ];

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
        { text: `Pay Full Amount ($${amount})`, action: 'pay_full_amount', primary: true },
        { text: 'Enter Other Amount', action: 'enter_other_amount', primary: true }
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
        text: 'Please choose a payment method:',
        buttons: [
          { text: 'Add new payment method', action: 'add_new_payment_method', primary: true }
        ]
      });
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
        { text: 'Continue', action: 'continue_chat', primary: true }
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
              { text: "AT&T Wireless", action: "service_wireless", primary: true },
              { text: "AT&T Internet", action: "service_internet", primary: true }
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
            { text: "View Bill", action: "view_bill", primary: true },
            { text: "Pay Bill", action: "pay_bill", primary: true },
            { text: "Download Bill", action: "download_bill", primary: true },
            { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
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