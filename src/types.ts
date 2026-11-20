export type TransactionType = 'income' | 'expense';
export type FinancialScope = 'personal';
export type TransactionStatus = 'paid' | 'pending';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit' | 'cash';

export interface InstallmentInfo {
  current: number;
  total: number;
  parentId: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  status: TransactionStatus;
  scope?: 'personal';
  paymentMethod?: PaymentMethod;
  notes?: string;
  installmentInfo?: InstallmentInfo;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  type: 'expense' | 'income' | 'both';
  categoryGroup: 'essential' | 'lifestyle' | 'investment' | 'revenue';
}

export interface DebtPaymentRecord {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface DebtItem {
  id: string;
  title: string; // Ex: "Empréstimo do Carro", "Dívida com Carlos", "Compra dos Móveis"
  creditor?: string; // Para quem deve (ex: "Banco", "Carlos", "Loja")
  totalAmount: number; // Valor total da dívida
  paidAmount: number; // Quanto já foi pago
  dueDate?: string; // Data prevista para pagamento ou vencimento
  notes?: string;
  status: 'active' | 'paid';
  createdAt: string;
  paymentHistory?: DebtPaymentRecord[];
}

export type InvestmentCategory =
  | 'emergency_fund' // Reserva de Emergência (Liquidez Diária)
  | 'fixed_income'   // Renda Fixa (CDB, Tesouro Selic, IPCA, LCI/LCA)
  | 'variable_income'// Ações, FIIs (Fundos Imobiliários) e ETFs
  | 'crypto'         // Criptoativos (Bitcoin, Ethereum)
  | 'pension_funds'  // Previdência Privada e Fundos
  | 'other';         // Outros

export interface InvestmentTransactionRecord {
  id: string;
  date: string;
  type: 'deposit' | 'withdraw' | 'yield'; // Aporte, Resgate ou Rendimento
  amount: number;
  notes?: string;
}

export interface InvestmentItem {
  id: string;
  title: string; // ex: "Tesouro Selic 2029", "CDB 100% CDI", "FII MXRF11", "Reserva Nubank"
  institution?: string; // ex: "Nubank", "Banco Inter", "XP", "BTG", "Binance"
  category: InvestmentCategory;
  investedAmount: number; // Total aportado
  currentValue: number; // Saldo atual acumulado
  targetAmount?: number; // Meta de valor a atingir (opcional)
  yieldRate?: string; // Taxa de rendimento estimada (ex: "100% do CDI", "IPCA + 6,5%")
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  history?: InvestmentTransactionRecord[];
}

export interface AuthSessionUser {
  name: string;
  cpf: string;
  uid?: string;
  email?: string;
  photoURL?: string;
  isCloudSynced?: boolean;
}
