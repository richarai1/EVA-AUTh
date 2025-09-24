export interface ChatMessage {
  id: string;
  isUser: boolean;
  timestamp: Date;
  card: ChatCard;
}

export interface ChatCard {
  type: 'text' | 'card' | 'image' | 'form' | 'bill-summary' | 'bill-analysis' | 'payment-method' | 'status' | 'business-security' | 'connection-status' | 'option-cards';
  title?: string;
  subtitle?: string;
  text?: string;
  imageUrl?: string;
  buttons?: ChatButton[];
  formFields?: ChatFormField[];
  billData?: BillSummaryData;
  billBreakdown?: BillBreakdownItem[];
  options?: OptionCard[];
  currentTotal?: string;
  previousTotal?: string;
  totalIncrease?: string;
  totalLines?: number;
  linesWithIncreases?: number;
  linesUnchanged?: number;
  autoPayInfo?: string;
  additionalInfo?: string;
  paymentAmount?: number;
  statusType?: 'success' | 'error' | 'info' | 'warning';
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
  primary?: boolean;
}

export interface BillBreakdownItem {
  lineNumber: string;
  name: string;
  changeText: string;
  changeAmount: number;
  details: string[];
}

export interface OptionCard {
  title: string;
  description: string;
  iconUrl: string;
  action: string;
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