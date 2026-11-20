import { AuthSessionUser, Transaction, DebtItem, InvestmentItem } from '../types';

/**
 * Returns a strictly isolated storage key based on the user's unique identity.
 * Google account -> `ag_usr_${uid}_${key}`
 * CPF account -> `ag_cpf_${digits}_${key}`
 * Unauthenticated -> `ag_guest_${key}`
 */
export function getAccountStorageKey(user: AuthSessionUser | null, key: string): string {
  if (!user) return `ag_guest_${key}`;
  if (user.uid) return `ag_usr_${user.uid}_${key}`;
  if (user.cpf) {
    const cleanCpf = user.cpf.replace(/\D/g, '') || user.cpf.replace(/[^a-zA-Z0-9]/g, '_');
    return `ag_cpf_${cleanCpf}_${key}`;
  }
  if (user.email) return `ag_eml_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}_${key}`;
  return `ag_guest_${key}`;
}

/**
 * Loads cached data strictly isolated to the specified user account.
 * Never accesses another account's data.
 */
export function loadUserAccountData(user: AuthSessionUser | null): {
  transactions: Transaction[];
  debts: DebtItem[];
  investments: InvestmentItem[];
  hideBalance: boolean;
} {
  if (!user) {
    return { transactions: [], debts: [], investments: [], hideBalance: false };
  }

  const txKey = getAccountStorageKey(user, 'transactions');
  const debtsKey = getAccountStorageKey(user, 'debts');
  const invsKey = getAccountStorageKey(user, 'investments');
  const hideBalanceKey = getAccountStorageKey(user, 'hide_balance');

  let transactions: Transaction[] = [];
  try {
    const raw = localStorage.getItem(txKey);
    if (raw) {
      transactions = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading user transactions from localStorage:', e);
  }

  let debts: DebtItem[] = [];
  try {
    const raw = localStorage.getItem(debtsKey);
    if (raw) {
      debts = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading user debts from localStorage:', e);
  }

  let investments: InvestmentItem[] = [];
  try {
    const raw = localStorage.getItem(invsKey);
    if (raw) {
      investments = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading user investments from localStorage:', e);
  }

  const hideBalance = localStorage.getItem(hideBalanceKey) === 'true';

  return { transactions, debts, investments, hideBalance };
}

/**
 * Saves data strictly isolated under the specified user account.
 */
export function saveUserAccountData(
  user: AuthSessionUser | null,
  data: {
    transactions?: Transaction[];
    debts?: DebtItem[];
    investments?: InvestmentItem[];
    hideBalance?: boolean;
  }
): void {
  if (!user) return;
  if (data.transactions !== undefined) {
    localStorage.setItem(getAccountStorageKey(user, 'transactions'), JSON.stringify(data.transactions));
  }
  if (data.debts !== undefined) {
    localStorage.setItem(getAccountStorageKey(user, 'debts'), JSON.stringify(data.debts));
  }
  if (data.investments !== undefined) {
    localStorage.setItem(getAccountStorageKey(user, 'investments'), JSON.stringify(data.investments));
  }
  if (data.hideBalance !== undefined) {
    localStorage.setItem(getAccountStorageKey(user, 'hide_balance'), String(data.hideBalance));
  }
}

/**
 * Completely clears stored data for the specified user account.
 */
export function clearUserAccountData(user: AuthSessionUser | null): void {
  if (!user) return;
  localStorage.removeItem(getAccountStorageKey(user, 'transactions'));
  localStorage.removeItem(getAccountStorageKey(user, 'debts'));
  localStorage.removeItem(getAccountStorageKey(user, 'investments'));
  localStorage.removeItem(getAccountStorageKey(user, 'hide_balance'));
}

/**
 * Clean legacy un-scoped shared storage keys to prevent any cross-account data leak.
 */
export function purgeLegacySharedStorage(): void {
  localStorage.removeItem('gfp_transactions');
  localStorage.removeItem('aquigastos_debts');
  localStorage.removeItem('aquigastos_investments');
  localStorage.removeItem('gfp_hide_balance');
}
