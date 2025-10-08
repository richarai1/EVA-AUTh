export interface ChatMessage {
  id: string;
  isUser: boolean;
  timestamp: Date;
  card: ChatCard;
}

export interface ChatCard {
  type: 'text' | 'card' | 'image' | 'form' | 'bill-summary' | 'bill-analysis' | 'payment-method' | 'status' | 'business-security' | 'connection-status' | 'option-cards' | 'signed-in-status' | 'ban-input';
  title?: string;
  subtitle?: string;
  text?: string;
  imageUrl?: string;
  buttons?: ChatButton[];
  formFields?: ChatFormField[];
  billData?: BillSummaryData;
  billBreakdown?: BillBreakdownItem[];
  options?: OptionCard[];
  accountOptions?: AccountOption[];
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
  banAccounts?: BanAccount[];
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
  asLink?: boolean;
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

export interface AccountOption {
  fanNumber: string;
  companyName: string;
  banNumbers: BanOption[];
  action: string;
}

export interface BanOption {
  banNumber: string;
  serviceType: string;
  action: string;
}

export interface BillSummaryData {
  companyName: string;
  companyAddress: string;
  pageInfo?: string;              // <-- now optional
  issueDate: string;
  accountNumber: any;
  foundationAccount?: string;     // <-- now optional
  invoice: string;
  totalDue: number;
  dueDate: string;
  lastBill: number;
  paymentAmount: number;
  paymentDate: string;
  remainingBalance: number;
  services: ServiceItem[];
  totalServices: number;
  billingPeriod?: string;
  adjustments?: number;
}


export interface ServiceItem {
  name: string;
  amount: number;
  pageRef?: string;
}

export interface User {
  email: string;
  userName: string;
  isAuthenticated: boolean;
}

export interface BanAccount {
  ban: string;
  name: string;
  balance: number;
}