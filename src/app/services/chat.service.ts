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
  private pendingAction: string = '';
  constructor(private authService: AuthService) {}

  openChat(): void {
    this.isOpenSubject.next(true);
    if (this.messagesSubject.value.length === 0) {
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
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      isUser: false,
      timestamp: new Date(),
      card: {
        type: 'text',
        text: "How can I help you?",
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

  private initializeAuthenticatedChat(): void {
    const user = this.authService.currentUserValue;
    const userName = user.email.split('@')[0]; // Extract name from email
    
    let welcomeText = `Welcome back, ${userName}`;
    if (this.lastUserQuestion) {
      welcomeText += `\n\nI see you were asking about: "${this.lastUserQuestion}"`;
    }
    welcomeText += "\n\nHow can I help you?";

    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      isUser: false,
      timestamp: new Date(),
      card: {
        type: 'text',
        text: welcomeText,
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
    this.addBotMessage({
      type: 'bill-analysis',
      text: "Your bill has increased by $90.49 compared to the previous month.\n\nHere's the breakdown of changes that add up to the difference:",
      billBreakdown: [
        {
          lineNumber: "Line number 469.426.7221",
          name: "ABIRAMI THIRUGNANASIVAM",
          changeText: "Charges increased by $37.50",
          details: [
            "International Day Pass charges for three days ($36.00)",
            "Monthly charges and taxes increased"
          ]
        },
        {
          lineNumber: "Line number 940.945.7123",
          name: "SREELEKHA RAJAMANICKAM",
          changeText: "New charges of $52.99",
          details: [
            "Activation Fee adjustments (charged and credited)",
            "Prorated monthly charges for partial billing period",
            "Surcharges, taxes & fees"
          ]
        }
      ],
      currentTotal: "$441.28",
      previousTotal: "$350.79",
      autoPayInfo: "AutoPay is scheduled to charge your card on 10/05/2025.",
      additionalInfo: "If you need a detailed line-by-line summary, let me know!"
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

      case 'login':
        // This will be handled by the component to navigate to login
        break;


      case 'download_pdf':
        this.handleDownloadPdf();
        break;

      case 'pay_bill_prompt':
        this.addBotMessage({
          type: 'text',
          text: "Please enter the amount you want to pay:"
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
    const user = this.authService.currentUserValue;
    const userName = user.email.split('@')[0];
    
    let welcomeText = `Great! Thanks for signing in, ${userName}.`;
    
    if (this.lastUserQuestion) {
      welcomeText += `\n\nI see you were asking about: "${this.lastUserQuestion}"`;
    }
    
    // Execute pending action if any
    if (this.pendingAction) {
      switch (this.pendingAction) {
        case 'view_bill':
          this.showBillSummary();
          break;
        case 'bill_analysis':
          this.showBillAnalysis();
          break;
        case 'download_bill':
          this.handleDownloadPdf();
          break;
        case 'pay_bill':
          this.addBotMessage({
            type: 'text',
            text: welcomeText + "\n\nPlease enter the amount you want to pay:"
          });
          break;
        default:
          this.addBotMessage({
            type: 'text',
            text: welcomeText + "\n\nHow can I help you?",
            buttons: [
              { text: "View Bill", action: "view_bill", primary: true },
              { text: "Pay Bill", action: "pay_bill", primary: true },
              { text: "Download Bill", action: "download_bill", primary: true },
              { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
            ]
          });
      }
      this.pendingAction = '';
    } else {
      this.addBotMessage({
        type: 'text',
        text: welcomeText + "\n\nHow can I help you?",
        buttons: [
          { text: "View Bill", action: "view_bill", primary: true },
          { text: "Pay Bill", action: "pay_bill", primary: true },
          { text: "Download Bill", action: "download_bill", primary: true },
          { text: "Why my bill is too high?", action: "bill_analysis", primary: true }
        ]
      });
    }
  }
}