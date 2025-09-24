import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { ChatMessage, ChatCard, BillSummaryData, BanOption } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  private lastUserQuestion: string = '';
  private lastUserMessage: ChatMessage | null = null;
  private pendingAction: string = '';
  private selectedFAN: string = '';
  private selectedBAN: string = '';
  private selectedCompanyName: string = '';

  constructor(private authService: AuthService) {}

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
    const userName = user.email.split('@')[0]; // Extract name from email
    
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
          { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
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

    if (lowerText.includes('view bill') || lowerText.includes('bill summary')) {
      this.handleViewBillRequest();
    } else if (lowerText.includes('why my bill is too high') || lowerText.includes('bill analysis')) {
      this.handleBillAnalysisRequest();
    } else if (lowerText.includes('download bill') || lowerText.includes('download pdf')) {
      this.handleDownloadBillRequest();
    } else if (lowerText.includes('bill pay') || lowerText.includes('pay bill')) {
      this.handleBillPayRequest();
    } else if (lowerText.includes('pay') || lowerText.includes('payment')) {
      this.handlePayBillRequest();
    } else if (/^\d+(\.\d{2})?$/.test(text.trim())) {
      this.handlePaymentAmount(parseFloat(text.trim()));
    } else {
      this.addBotMessage({
        type: 'text',
        text: "Can you tell me more about what you need help with?",
        buttons: [
          { text: "View Bill", action: "view_bill", primary: true },
          { text: "Pay Bill", action: "pay_bill", primary: true },
          { text: "Download Bill", action: "download_bill", primary: true },
          { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
        ]
      });
    }
  }

  private handleViewBillRequest(): void {
    if (this.authService.isAuthenticated()) {
      this.showBillSummary();
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
      this.showBillAnalysis();
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
      this.addBotMessage({
        type: 'text',
        text: "Please enter the amount you want to pay:"
      });
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


  private showBillAnalysis(): void {
    // Simulate analyzing a large bill with many lines
    const totalLines = 127; // Simulating a business account with many lines
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
  }

  private showBillSummary(): void {
    const billData: BillSummaryData = {
      companyName: this.selectedCompanyName || "INSPECTOR DRAIN INC",
      companyAddress: this.getCompanyAddress(),
      pageInfo: "",
      issueDate: "Sep 15, 2025",
      accountNumber: this.selectedBAN || "287301224446",
      foundationAccount: this.selectedFAN || "59285142",
      invoice: `${this.selectedBAN || "287301224446"}X10092023`,
      totalDue: 6142.25,
      dueDate: "Sep 15, 2025",
      lastBill: 9466.04,
      paymentAmount: 9466.04,
      paymentDate: "Oct 1 - Thank you!",
      remainingBalance: 0.00,
      services: [
        { name: "Wireless", amount: 6142.25 }
      ],
      totalServices: 6142.25
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
  }

  private getCompanyAddress(): string {
    switch (this.selectedFAN) {
      case '59285142':
        return "5834 BETHELVIEW RD\nCUMMING, GA 30040-6312";
      case '48392751':
        return "1234 TECH BLVD\nAUSTIN, TX 78701-1234";
      case '73641829':
        return "5678 GLOBAL WAY\nSEATTLE, WA 98101-5678";
      default:
        return "5834 BETHELVIEW RD\nCUMMING, GA 30040-6312";
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

      case 'provide_fan':
        this.addBotMessage({
          type: 'form',
          title: 'Foundation Account Number',
          text: 'Please enter your Foundation Account Number (FAN):',
          formFields: [
            { label: "Foundation Account Number", type: "text", name: "fanNumber", placeholder: "Enter your FAN" }
          ],
          buttons: [
            { text: "Submit", action: "submit_fan", primary: true }
          ]
        });
        break;

      case 'show_fan_options':
        this.showFANOptions();
        break;

      case 'select_fan_59285142':
        this.selectedFAN = '59285142';
        this.selectedCompanyName = 'INSPECTOR DRAIN INC';
        this.showBANOptions('59285142', 'INSPECTOR DRAIN INC');
        break;

      case 'select_fan_48392751':
        this.selectedFAN = '48392751';
        this.selectedCompanyName = 'TECH SOLUTIONS LLC';
        this.showBANOptions('48392751', 'TECH SOLUTIONS LLC');
        break;

      case 'select_fan_73641829':
        this.selectedFAN = '73641829';
        this.selectedCompanyName = 'GLOBAL SERVICES CORP';
        this.showBANOptions('73641829', 'GLOBAL SERVICES CORP');
        break;

      case 'select_ban_287301224446':
        this.selectedBAN = '287301224446';
        this.proceedWithOriginalRequest();
        break;

      case 'select_ban_287301224447':
        this.selectedBAN = '287301224447';
        this.proceedWithOriginalRequest();
        break;

      case 'select_ban_148392751001':
        this.selectedBAN = '148392751001';
        this.proceedWithOriginalRequest();
        break;

      case 'select_ban_148392751002':
        this.selectedBAN = '148392751002';
        this.proceedWithOriginalRequest();
        break;

      case 'select_ban_273641829101':
        this.selectedBAN = '273641829101';
        this.proceedWithOriginalRequest();
        break;

      case 'select_ban_273641829102':
        this.selectedBAN = '273641829102';
        this.proceedWithOriginalRequest();
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
        this.addBotMessage({
          type: 'text',
          text: "How much do you want to pay? Feel free to enter a amount using only numbers."
        });
        break;

      case 'confirm_payment':
        this.addBotMessage({
          type: 'text',
          text: "How much do you want to pay?\n\nFeel free to enter a amount using only numbers."
        });
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
    // Set flag to reopen chat after login
    sessionStorage.setItem('reopenChatAfterLogin', 'true');
    
    this.addBotMessage({
      type: 'text',
      text: "Now let's have you sign in so I can get you the best answers",
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
    // Simulate PDF download
    this.addBotMessage({
      type: 'text',
      text: "📥 Preparing your bill for download..."
    });

    setTimeout(() => {
      // In a real app, this would trigger an actual PDF download
      this.addBotMessage({
        type: 'text',
        text: "✅ Your bill has been downloaded successfully! Check your Downloads folder."
      });
    }, 1500);
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
      // Add the "Great! Thanks for signing in" message with delay
      setTimeout(() => {
        this.addBotMessage({
          type: 'text',
          text: 'Great! Thanks for signing in.'
        });
        
        // Add the user's last message back to the conversation
        if (this.lastUserMessage) {
          setTimeout(() => {
            const currentMessages = this.messagesSubject.value;
            this.messagesSubject.next([...currentMessages, this.lastUserMessage!]);
            
            // Then respond to their original question with realistic delay
            setTimeout(() => {
              this.executeUserRequest();
            }, 2500); // Increased to 2.5 seconds for more realistic response time
          }, 1200); // Increased to 1.2 seconds before showing user message
        } else {
          // Fallback if no last message
          setTimeout(() => {
            this.executeUserRequest();
          }, 1500);
        }
      }, 800); // Increased to 0.8 seconds before "Great! Thanks for signing in"
    }
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
    // First ask for account verification
    setTimeout(() => {
      this.askForAccountVerification();
    }, 1500);
  }

  private askForAccountVerification(): void {
    this.addBotMessage({
      type: 'text',
      text: 'To help you with your request, I need to verify your account information. Please provide your Foundation Account Number (FAN).',
      buttons: [
        { text: "I know my FAN", action: "provide_fan", primary: true },
        { text: "I don't know my FAN", action: "show_fan_options", primary: false }
      ]
    });
  }

  private showFANOptions(): void {
    this.addBotMessage({
      type: 'option-cards',
      text: 'Please select your Foundation Account Number from the options below:',
      accountOptions: [
        {
          fanNumber: '59285142',
          companyName: 'INSPECTOR DRAIN INC',
          banNumbers: [],
          action: 'select_fan_59285142'
        },
        {
          fanNumber: '48392751',
          companyName: 'TECH SOLUTIONS LLC',
          banNumbers: [],
          action: 'select_fan_48392751'
        },
        {
          fanNumber: '73641829',
          companyName: 'GLOBAL SERVICES CORP',
          banNumbers: [],
          action: 'select_fan_73641829'
        }
      ]
    });
  }

  private showBANOptions(fanNumber: string, companyName: string): void {
    let banOptions: BanOption[] = [];
    
    if (fanNumber === '59285142') {
      banOptions = [
        { banNumber: '287301224446', serviceType: 'Wireless Service', action: 'select_ban_287301224446' },
        { banNumber: '287301224447', serviceType: 'Internet Service', action: 'select_ban_287301224447' }
      ];
    } else if (fanNumber === '48392751') {
      banOptions = [
        { banNumber: '148392751001', serviceType: 'Wireless Service', action: 'select_ban_148392751001' },
        { banNumber: '148392751002', serviceType: 'Fiber Internet', action: 'select_ban_148392751002' }
      ];
    } else if (fanNumber === '73641829') {
      banOptions = [
        { banNumber: '273641829101', serviceType: 'Business Wireless', action: 'select_ban_273641829101' },
        { banNumber: '273641829102', serviceType: 'Business Internet', action: 'select_ban_273641829102' }
      ];
    }

    this.addBotMessage({
      type: 'text',
      text: `Great! I found your account for ${companyName}. Now please select your Billing Account Number (BAN):`,
      buttons: banOptions.map(ban => ({
        text: `${ban.banNumber} (${ban.serviceType})`,
        action: ban.action,
        primary: true
      }))
    });
  }

  private proceedWithOriginalRequest(): void {
    this.addBotMessage({
      type: 'text',
      text: `Perfect! I've verified your account for ${this.selectedCompanyName}. Let me help you with your request.`
    });

    setTimeout(() => {
      if (this.pendingAction === 'bill_analysis' || this.lastUserQuestion.toLowerCase().includes('bill') && this.lastUserQuestion.toLowerCase().includes('high')) {
        this.addBotMessage({
          type: 'text',
          text: 'Let me analyze your bill for you...'
        });
        
        setTimeout(() => {
          this.showBillAnalysis();
          this.clearPendingState();
        }, 3000);
      } else if (this.pendingAction === 'view_bill' || this.lastUserQuestion.toLowerCase().includes('view bill')) {
        this.addBotMessage({
          type: 'text',
          text: 'Let me pull up your bill summary...'
        });
        
        setTimeout(() => {
          this.showBillSummary();
          this.clearPendingState();
        }, 2500);
      } else if (this.pendingAction === 'download_bill' || this.lastUserQuestion.toLowerCase().includes('download')) {
        setTimeout(() => {
          this.handleDownloadPdf();
          this.clearPendingState();
        }, 1500);
      } else if (this.pendingAction === 'pay_bill' || this.lastUserQuestion.toLowerCase().includes('pay')) {
        setTimeout(() => {
          this.addBotMessage({
            type: 'text',
            text: "Please enter the amount you want to pay:"
          });
          this.clearPendingState();
        }, 1500);
      } else {
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
    }, 2000);
  }

  // Clear pending state to prevent duplicate executions
  private clearPendingState(): void {
    this.pendingAction = '';
    this.lastUserMessage = null;
    this.lastUserQuestion = '';
    this.selectedFAN = '';
    this.selectedBAN = '';
    this.selectedCompanyName = '';
  }
}