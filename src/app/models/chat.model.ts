export interface ChatMessage {
  id: string;
  isUser: boolean;
  timestamp: Date;
  card: ChatCard;
}

export interface ChatCard {
  type: 'text' | 'card' | 'image' | 'form' | 'bill-summary';
  title?: string;
  subtitle?: string;
  text?: string;
  imageUrl?: string;
  buttons?: ChatButton[];
  formFields?: ChatFormField[];
  billData?: BillSummaryData;
}

export interface ChatFormField {
  label: string;
  type: 'text' | 'number' | 'select';
  name: string;
  placeholder?: string;
  options?: string[];
  optional?: boolean;
}

export interface ChatButton {
  text: string;
  action: string;
  data?: any;
}

export interface BillSummaryData {
  companyName: string;
  companyAddress: string;
  pageInfo: string;
  issueDate: string;
  accountNumber: string;
  foundationAccount: string;
  invoice: string;
  totalDue: number;
  dueDate: string;
  lastBill: number;
  paymentAmount: number;
  paymentDate: string;
  remainingBalance: number;
  services: ServiceItem[];
  totalServices: number;
}

export interface ServiceItem {
  name: string;
  amount: number;
  pageRef?: string;
}

export interface User {
  email: string;
  isAuthenticated: boolean;
}