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
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      isUser: false,
      timestamp: new Date(),
      card: {
        type: 'text',
        text: this.authService.isAuthenticated()
          ? "I can see you are logged in. How can I assist you?"
          : "Hi! I'm EVA, your AT&T virtual assistant. How can I help you today?",
      }
    };
    this.messagesSubject.next([welcomeMessage]);
  }

  sendMessage(text: string): void {
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

    if (lowerText.includes('view bill') || lowerText.includes('bill') || lowerText.includes('account')) {
      this.handleViewBillRequest();
    } else if (lowerText.includes('download') || lowerText.includes('pdf')) {
      if (this.authService.isAuthenticated()) {
        this.handleDownloadPdf();
      } else {
        this.promptForAuthentication('download');
      }
    } else if (lowerText.includes('pay') || lowerText.includes('payment')) {
      this.handlePayBillRequest();
    } else if (/^\d+(\.\d{2})?$/.test(text.trim())) {
      this.handlePaymentAmount(parseFloat(text.trim()));
    } else {
      this.addBotMessage({
        type: 'text',
        text: "I can help you with viewing your bill, downloading your bill, or making a payment. What would you like to do?"
      });
    }
  }

  private handleViewBillRequest(): void {
    debugger;
    if (this.authService.isAuthenticated()) {
      this.showBillSummary();
    } else {
      this.promptForAuthentication('view_bill');
    }
  }

  private handlePayBillRequest(): void {
    if (this.authService.isAuthenticated()) {
      this.addBotMessage({
        type: 'text',
        text: "Please enter the amount you want to pay:"
      });
    } else {
      this.promptForAuthentication('pay_bill');
    }
  }

  private promptForAuthentication(action: string): void {
    this.addBotMessage({
      type: 'card',
      title: "🔐 Authentication Required",
      text: "To access your account information, please sign in or continue without signing in for limited access.",
      buttons: [
        { text: "Sign In", action: "login", data: { returnAction: action } },
        { text: "Continue without sign in", action: "continue_guest", data: { returnAction: action } }
      ]
    });
  }

  private showBillSummary(): void {
    debugger
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
      case 'login':
        // This will be handled by the component to navigate to login
        break;

      case 'continue_guest':
        this.handleGuestFlow(data?.returnAction);
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

      case 'pay_with_visa':
      case 'pay_with_mastercard':
      case 'pay_with_discover':
      case 'pay_with_amex':
        this.showCardDetailsForm(action, data);
        break;

      case 'submit_payment':
        this.processPayment(data);
        break;

      case 'cancel_payment':
        this.addBotMessage({
          type: 'text',
          text: "❌ Payment process has been cancelled."
        });
        break;

      default:
        this.addBotMessage({
          type: 'text',
          text: "I'm not sure how to help with that. Try asking about your bill, making a payment, or downloading your statement."
        });
    }
  }

  private handleGuestFlow(returnAction: string): void {
    switch (returnAction) {
      case 'view_bill':
        this.addBotMessage({
          type: 'text',
          text: "As a guest, you have limited access. Please sign in for full account details, or I can help you with general billing questions."
        });
        break;
      case 'download':
        this.addBotMessage({
          type: 'text',
          text: "PDF downloads require authentication for security. Please sign in to download your bill."
        });
        break;
      case 'pay_bill':
        this.addBotMessage({
          type: 'text',
          text: "For guest payments, you'll be redirected to our secure payment portal. Please enter the amount you'd like to pay:"
        });
        break;
    }
  }

  private handlePaymentAmount(amount: number): void {
    if (amount > 0) {
      this.addBotMessage({
        type: 'card',
        title: "💳 Select Payment Method",
        subtitle: `Amount: $${amount.toFixed(2)}`,
        text: "Choose your preferred payment method:",
        buttons: [
          { text: "💳 Visa", action: "pay_with_visa", data: amount },
          { text: "💳 MasterCard", action: "pay_with_mastercard", data: amount },
          { text: "💳 Discover", action: "pay_with_discover", data: amount },
          { text: "💳 American Express", action: "pay_with_amex", data: amount }
        ]
      });
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
    this.initializeChat();
  }

  // Method to reinitialize chat after login
  reinitializeAfterLogin(): void {
    this.resetChat();
  }
}