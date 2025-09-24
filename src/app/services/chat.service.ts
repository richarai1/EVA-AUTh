import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { ChatMessage, ChatCard, BillSummaryData } from '../models/chat.model';

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
  private fanAttempts: number = 0;
  private banAttempts: number = 0;

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
      companyName: "INSPECTOR DRAIN INC",
      companyAddress: "5834 BETHELVIEW RD\nCUMMING, GA 30040-6312",
      pageInfo: "",
      issueDate: "Sep 15, 2025",
      accountNumber: "287301224446",
      foundationAccount: "59285142",
      invoice: "287301224446X10092023",
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
    // Step 1: Immediately acknowledge sign-in
    this.showSignedInStatus();
    
    // Step 2: After 700-900ms, add friendly acknowledgement
    setTimeout(() => {
      this.addBotMessage({
        type: 'text',
        text: 'Great — thanks for signing in! I\'ll pick up where we left off.'
      });
      
      // Step 3: Re-insert user's last message if available
      if (this.lastUserMessage) {
        setTimeout(() => {
          const currentMessages = this.messagesSubject.value;
          this.messagesSubject.next([...currentMessages, this.lastUserMessage!]);
          
          // Step 4: Ask for account verification after 800ms
          setTimeout(() => {
            this.askForAccountVerification();
          }, 800);
        }, 600);
      } else {
        // No last message, go straight to account verification
        setTimeout(() => {
          this.askForAccountVerification();
        }, 600);
      }
    }, 800);
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

  private askForAccountVerification(): void {
    this.addBotMessage({
      type: 'text',
      text: "To help you with your account, I'll need to verify some information. Please provide your Foundation Account Number (FAN):",
      buttons: [
        { text: "I know my FAN", action: "provide_fan", primary: true },
        { text: "I don't know my FAN", action: "show_fan_options" }
      ]
    });
  }

  private showFANOptions(): void {
    // Show instruction card first
    this.addBotMessage({
      type: 'text',
      text: "The FAN is a number tied to your company account. You can find it on your bill PDF (top right/Account details) or on the Account Summary page in the portal.",
      buttons: [
        { text: "Show my FAN options", action: "show_fan_list", primary: true },
        { text: "Help me find it on a bill", action: "show_fan_lookup_instructions" }
      ]
    });
  }

  private showFANList(): void {
    this.addBotMessage({
      type: 'option-cards',
      accountOptions: [
        {
          fanNumber: "59285142",
          companyName: "INSPECTOR DRAIN INC",
          action: "select_fan_59285142"
        },
        {
          fanNumber: "48392751",
          companyName: "TECH SOLUTIONS LLC",
          action: "select_fan_48392751"
        },
        {
          fanNumber: "73641829",
          companyName: "GLOBAL SERVICES CORP",
          action: "select_fan_73641829"
        }
      ]
    });
  }

  private selectFAN(fan: string, companyName: string): void {
    this.selectedFAN = fan;
    this.selectedCompanyName = companyName;
    
    // Show confirmation and ask for BAN
    setTimeout(() => {
      this.addBotMessage({
        type: 'text',
        text: `Thanks — I found your FAN. Now please provide your Billing Account Number (BAN).`,
        buttons: [
          { text: "I know my BAN", action: "provide_ban", primary: true },
          { text: "I don't know my BAN", action: "show_ban_options" }
        ]
      });
    }, 800);
  }

  private showFANInputForm(): void {
    this.addBotMessage({
      type: 'form',
      title: 'Foundation Account Number',
      text: 'Please enter your Foundation Account Number (FAN):',
      formFields: [
        { 
          label: 'FAN Number', 
          type: 'text', 
          name: 'fanNumber', 
          placeholder: 'Enter 8-digit FAN' 
        }
      ],
      buttons: [
        { text: 'Submit', action: 'submit_fan', primary: true },
        { text: 'Cancel', action: 'cancel_verification' }
      ]
    });
  }

  private handleFANSubmission(data: any): void {
    const fanNumber = data?.fanNumber?.trim();
    
    if (!fanNumber || !/^\d{8}$/.test(fanNumber)) {
      this.fanAttempts++;
      
      if (this.fanAttempts >= 3) {
        this.addBotMessage({
          type: 'text',
          text: "I'm having trouble with that FAN. Would you like me to show you some options or connect you with support?",
          buttons: [
            { text: "Show FAN options", action: "show_fan_options", primary: true },
            { text: "Contact Support", action: "contact_support" }
          ]
        });
        return;
      }
      
      this.addBotMessage({
        type: 'text',
        text: "Please enter a valid 8-digit Foundation Account Number.",
        buttons: [
          { text: "Try again", action: "provide_fan", primary: true },
          { text: "I don't know my FAN", action: "show_fan_options" }
        ]
      });
      return;
    }

    // Map FAN to company (in real app, this would be a database lookup)
    const fanMapping: { [key: string]: string } = {
      '59285142': 'INSPECTOR DRAIN INC',
      '48392751': 'TECH SOLUTIONS LLC',
      '73641829': 'GLOBAL SERVICES CORP'
    };

    const companyName = fanMapping[fanNumber];
    if (!companyName) {
      this.addBotMessage({
        type: 'text',
        text: "I couldn't find an account with that FAN. Please check the number and try again.",
        buttons: [
          { text: "Try again", action: "provide_fan", primary: true },
          { text: "Show FAN options", action: "show_fan_options" }
        ]
      });
      return;
    }

    this.selectFAN(fanNumber, companyName);
  }

  private showBANOptions(): void {
    if (!this.selectedFAN) {
      this.addBotMessage({
        type: 'text',
        text: "Please select a FAN first."
      });
      return;
    }

    // Show instruction card first
    this.addBotMessage({
      type: 'text',
      text: "The BAN is the billing account ID shown on the first page of your bill PDF under Billing Account Number or on Account Details.",
      buttons: [
        { text: "Show BAN options", action: "show_ban_list", primary: true },
        { text: "Get help", action: "escalate_find_ban" }
      ]
    });
  }

  private showBANList(): void {
    if (!this.selectedFAN) {
      this.addBotMessage({
        type: 'text',
        text: "Please select a FAN first."
      });
      return;
    }

    let banOptions: BanOption[] = [];
    
    // Mock BAN options based on selected FAN
    if (this.selectedFAN === '59285142') {
      banOptions = [
        { banNumber: '287301224446', serviceType: 'Wireless Service', action: 'select_ban_287301224446' },
        { banNumber: '287301224447', serviceType: 'Internet Service', action: 'select_ban_287301224447' }
      ];
    } else if (this.selectedFAN === '48392751') {
      banOptions = [
        { banNumber: '148392751001', serviceType: 'Wireless Service', action: 'select_ban_148392751001' },
        { banNumber: '148392751002', serviceType: 'Fiber Service', action: 'select_ban_148392751002' }
      ];
    } else if (this.selectedFAN === '73641829') {
      banOptions = [
        { banNumber: '273641829101', serviceType: 'Business Wireless', action: 'select_ban_273641829101' },
        { banNumber: '273641829102', serviceType: 'Business Internet', action: 'select_ban_273641829102' }
      ];
    }

    this.addBotMessage({
      type: 'ban-options',
      banOptions: banOptions
    });
  }

  private selectBAN(ban: string, serviceType: string): void {
    this.selectedBAN = ban;
    
    // Show confirmation
    setTimeout(() => {
      this.addBotMessage({
        type: 'text',
        text: `Thanks — I have your account: FAN: ${this.selectedFAN}, BAN: ${this.selectedBAN} (Company: ${this.selectedCompanyName}). What would you like to do next?`,
        buttons: [
          { text: "View Bill", action: "view_bill", primary: true },
          { text: "Pay Bill", action: "pay_bill", primary: true },
          { text: "Download Bill", action: "download_bill", primary: true },
          { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
        ]
      });
    }, 600);
  }

  private showBANInputForm(): void {
    this.addBotMessage({
      type: 'form',
      title: 'Billing Account Number',
      text: 'Please enter your Billing Account Number (BAN):',
      formFields: [
        { 
          label: 'BAN Number', 
          type: 'text', 
          name: 'banNumber', 
          placeholder: 'Enter 12-digit BAN' 
        }
      ],
      buttons: [
        { text: 'Submit', action: 'submit_ban', primary: true },
        { text: 'Cancel', action: 'cancel_verification' }
      ]
    });
  }

  private handleBANSubmission(data: any): void {
    const banNumber = data?.banNumber?.trim();
    
    if (!banNumber || !/^\d{12}$/.test(banNumber)) {
      this.banAttempts++;
      
      if (this.banAttempts >= 3) {
        this.addBotMessage({
          type: 'text',
          text: "I'm having trouble with that BAN. Would you like me to show you some options or connect you with support?",
          buttons: [
            { text: "Show BAN options", action: "show_ban_options", primary: true },
            { text: "Contact Support", action: "contact_support" }
          ]
        });
        return;
      }
      
      this.addBotMessage({
        type: 'text',
        text: "Please enter a valid 12-digit Billing Account Number.",
        buttons: [
          { text: "Try again", action: "provide_ban", primary: true },
          { text: "I don't know my BAN", action: "show_ban_options" }
        ]
      });
      return;
    }

    // Validate BAN exists for the selected FAN
    const validBANs = this.getValidBANsForFAN(this.selectedFAN);
    const banExists = validBANs.some(ban => ban.banNumber === banNumber);
    
    if (!banExists) {
      this.addBotMessage({
        type: 'text',
        text: "I couldn't find that BAN for your account. Please check the number and try again.",
        buttons: [
          { text: "Try again", action: "provide_ban", primary: true },
          { text: "Show BAN options", action: "show_ban_options" }
        ]
      });
      return;
    }

    const serviceType = validBANs.find(ban => ban.banNumber === banNumber)?.serviceType || 'Service';
    this.selectBAN(banNumber, serviceType);
  }

  private getValidBANsForFAN(fan: string): BanOption[] {
    const banMapping: { [key: string]: BanOption[] } = {
      '59285142': [
        { banNumber: '287301224446', serviceType: 'Wireless Service', action: 'select_ban_287301224446' },
        { banNumber: '287301224447', serviceType: 'Internet Service', action: 'select_ban_287301224447' }
      ],
      '48392751': [
        { banNumber: '148392751001', serviceType: 'Wireless Service', action: 'select_ban_148392751001' },
        { banNumber: '148392751002', serviceType: 'Fiber Service', action: 'select_ban_148392751002' }
      ],
      '73641829': [
        { banNumber: '273641829101', serviceType: 'Business Wireless', action: 'select_ban_273641829101' },
        { banNumber: '273641829102', serviceType: 'Business Internet', action: 'select_ban_273641829102' }
      ]
    };
    
    return banMapping[fan] || [];
  }

  // Execute the user's original request after sign-in
  private executeUserRequest(): void {
    if (this.pendingAction === 'bill_analysis' || this.lastUserQuestion.toLowerCase().includes('bill') && this.lastUserQuestion.toLowerCase().includes('high')) {
      // Add typing indicator delay for bill analysis
      this.addBotMessage({
        type: 'text',
        text: 'Let me analyze your bill for you...'
      });
      
      setTimeout(() => {
        this.showBillAnalysis();
        this.clearPendingState();
      }, 3000); // Increased to 3 seconds
    } else if (this.pendingAction === 'view_bill' || this.lastUserQuestion.toLowerCase().includes('view bill')) {
      this.addBotMessage({
        type: 'text',
        text: 'Let me pull up your bill summary...'
      });
      
      setTimeout(() => {
        this.showBillSummary();
        this.clearPendingState();
      }, 2500); // Increased to 2.5 seconds
    } else if (this.pendingAction === 'download_bill' || this.lastUserQuestion.toLowerCase().includes('download')) {
      setTimeout(() => {
        this.handleDownloadPdf();
        this.clearPendingState();
      }, 1500); // Increased to 1.5 seconds
    } else if (this.pendingAction === 'pay_bill' || this.lastUserQuestion.toLowerCase().includes('pay')) {
      setTimeout(() => {
        this.addBotMessage({
          type: 'text',
          text: "Please enter the amount you want to pay:"
        });
        this.clearPendingState();
      }, 1500); // Increased to 1.5 seconds
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
      }, 1500); // Increased to 1.5 seconds
    }
  }

  // Clear pending state to prevent duplicate executions
  private clearPendingState(): void {
    this.pendingAction = '';
    this.lastUserMessage = null;
    this.lastUserQuestion = '';
  }
}