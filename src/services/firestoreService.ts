import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, DebtItem, InvestmentItem } from '../types';

export interface UserProfileData {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  cpf?: string;
  monthlyBudget?: number;
  hideBalance?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Real-time listener for user's transactions
 */
export function subscribeToTransactions(
  userId: string,
  onData: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = `users/${userId}/transactions`;
  const collRef = collection(db, 'users', userId, 'transactions');

  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          description: data.description || '',
          amount: Number(data.amount) || 0,
          type: data.type === 'income' ? 'income' : 'expense',
          category: data.category || 'Geral',
          date: data.date || new Date().toISOString().slice(0, 10),
          status: data.status === 'pending' ? 'pending' : 'paid',
          scope: data.scope,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          installmentInfo: data.installmentInfo,
        });
      });
      // Sort newest first by date
      items.sort((a, b) => b.date.localeCompare(a.date));
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, collectionPath);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
}

/**
 * Save or update a single transaction
 */
export async function saveTransaction(userId: string, tx: Transaction): Promise<void> {
  const docPath = `users/${userId}/transactions/${tx.id}`;
  const docRef = doc(db, 'users', userId, 'transactions', tx.id);

  const payload: Record<string, any> = {
    id: tx.id,
    userId,
    description: tx.description.slice(0, 200),
    amount: Number(tx.amount),
    type: tx.type,
    category: tx.category.slice(0, 80),
    date: tx.date,
    status: tx.status || 'paid',
    updatedAt: new Date().toISOString(),
  };

  if (tx.paymentMethod) payload.paymentMethod = tx.paymentMethod;
  if (tx.scope) payload.scope = tx.scope;
  if (tx.notes) payload.notes = tx.notes.slice(0, 500);
  if (tx.installmentInfo) payload.installmentInfo = tx.installmentInfo;

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
  const docPath = `users/${userId}/transactions/${transactionId}`;
  const docRef = doc(db, 'users', userId, 'transactions', transactionId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Real-time listener for user's debts
 */
export function subscribeToDebts(
  userId: string,
  onData: (debts: DebtItem[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = `users/${userId}/debts`;
  const collRef = collection(db, 'users', userId, 'debts');

  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: DebtItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          title: data.title || '',
          creditor: data.creditor,
          totalAmount: Number(data.totalAmount) || 0,
          paidAmount: Number(data.paidAmount) || 0,
          dueDate: data.dueDate,
          notes: data.notes,
          status: data.status === 'paid' ? 'paid' : 'active',
          createdAt: data.createdAt || new Date().toISOString(),
          paymentHistory: data.paymentHistory || [],
        });
      });
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, collectionPath);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
}

/**
 * Save or update a debt record
 */
export async function saveDebt(userId: string, debt: DebtItem): Promise<void> {
  const docPath = `users/${userId}/debts/${debt.id}`;
  const docRef = doc(db, 'users', userId, 'debts', debt.id);

  const payload: Record<string, any> = {
    id: debt.id,
    userId,
    title: debt.title.slice(0, 200),
    totalAmount: Number(debt.totalAmount),
    paidAmount: Number(debt.paidAmount),
    status: debt.status || 'active',
    updatedAt: new Date().toISOString(),
    createdAt: debt.createdAt || new Date().toISOString(),
  };

  if (debt.creditor) payload.creditor = debt.creditor.slice(0, 100);
  if (debt.dueDate) payload.dueDate = debt.dueDate;
  if (debt.notes) payload.notes = debt.notes.slice(0, 500);
  if (debt.paymentHistory) payload.paymentHistory = debt.paymentHistory;

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete a debt record
 */
export async function deleteDebt(userId: string, debtId: string): Promise<void> {
  const docPath = `users/${userId}/debts/${debtId}`;
  const docRef = doc(db, 'users', userId, 'debts', debtId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Real-time listener for user's investments
 */
export function subscribeToInvestments(
  userId: string,
  onData: (investments: InvestmentItem[]) => void,
  onError?: (error: Error) => void
) {
  const collectionPath = `users/${userId}/investments`;
  const collRef = collection(db, 'users', userId, 'investments');

  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: InvestmentItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          title: data.title || '',
          institution: data.institution || 'Geral',
          category: data.category || 'fixed_income',
          investedAmount: Number(data.investedAmount) || 0,
          currentValue: Number(data.currentValue) || 0,
          targetAmount: data.targetAmount ? Number(data.targetAmount) : undefined,
          yieldRate: data.yieldRate,
          notes: data.notes,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
          history: data.history || [],
        });
      });
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, collectionPath);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
}

/**
 * Save or update an investment
 */
export async function saveInvestment(userId: string, inv: InvestmentItem): Promise<void> {
  const docPath = `users/${userId}/investments/${inv.id}`;
  const docRef = doc(db, 'users', userId, 'investments', inv.id);

  const payload: Record<string, any> = {
    id: inv.id,
    userId,
    title: inv.title.slice(0, 200),
    category: inv.category,
    institution: (inv.institution || 'Geral').slice(0, 100),
    investedAmount: Number(inv.investedAmount),
    currentValue: Number(inv.currentValue),
    updatedAt: new Date().toISOString(),
    createdAt: inv.createdAt || new Date().toISOString(),
  };

  if (inv.targetAmount !== undefined) payload.targetAmount = Number(inv.targetAmount);
  if (inv.yieldRate) payload.yieldRate = inv.yieldRate.slice(0, 50);
  if (inv.notes) payload.notes = inv.notes.slice(0, 500);
  if (inv.history) payload.history = inv.history;

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete an investment
 */
export async function deleteInvestment(userId: string, invId: string): Promise<void> {
  const docPath = `users/${userId}/investments/${invId}`;
  const docRef = doc(db, 'users', userId, 'investments', invId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Save user profile in Firestore
 */
export async function saveUserProfile(userId: string, profile: Partial<UserProfileData>): Promise<void> {
  const docPath = `users/${userId}`;
  const docRef = doc(db, 'users', userId);

  const payload: Record<string, any> = {
    id: userId,
    displayName: (profile.displayName || 'Usuário').slice(0, 120),
    updatedAt: new Date().toISOString(),
  };

  if (profile.email) payload.email = profile.email.slice(0, 256);
  if (profile.photoURL) payload.photoURL = profile.photoURL.slice(0, 1000);
  if (profile.cpf) payload.cpf = profile.cpf.slice(0, 60);
  if (profile.monthlyBudget !== undefined) payload.monthlyBudget = Number(profile.monthlyBudget);
  if (profile.hideBalance !== undefined) payload.hideBalance = Boolean(profile.hideBalance);
  if (profile.createdAt) payload.createdAt = profile.createdAt;

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const docPath = `users/${userId}`;
  const docRef = doc(db, 'users', userId);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfileData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

/**
 * Batch upload / sync existing local storage data to user's Firestore cloud account
 */
export async function syncLocalDataToFirestore(
  userId: string,
  localTransactions: Transaction[],
  localDebts: DebtItem[],
  localInvestments: InvestmentItem[]
): Promise<{ count: number }> {
  let count = 0;
  // Use sequential saves or batches (up to 500 ops)
  const batch = writeBatch(db);

  for (const tx of localTransactions) {
    if (!tx || !tx.id) continue;
    const ref = doc(db, 'users', userId, 'transactions', tx.id);
    const data: Record<string, any> = {
      id: tx.id,
      userId,
      description: (tx.description || 'Lançamento').slice(0, 200),
      amount: Number(tx.amount) || 0,
      type: tx.type === 'income' ? 'income' : 'expense',
      category: (tx.category || 'Geral').slice(0, 80),
      date: (tx.date || new Date().toISOString().slice(0, 10)).slice(0, 40),
      status: tx.status === 'pending' ? 'pending' : 'paid',
      updatedAt: new Date().toISOString(),
    };
    if (tx.paymentMethod) data.paymentMethod = String(tx.paymentMethod).slice(0, 30);
    if (tx.scope) data.scope = tx.scope;
    if (tx.notes) data.notes = String(tx.notes).slice(0, 500);
    if (tx.installmentInfo) data.installmentInfo = tx.installmentInfo;
    batch.set(ref, data, { merge: true });
    count++;
  }

  for (const debt of localDebts) {
    if (!debt || !debt.id) continue;
    const ref = doc(db, 'users', userId, 'debts', debt.id);
    const data: Record<string, any> = {
      id: debt.id,
      userId,
      title: (debt.title || 'Dívida').slice(0, 200),
      totalAmount: Number(debt.totalAmount) || 0,
      paidAmount: Number(debt.paidAmount) || 0,
      status: debt.status || 'active',
      createdAt: debt.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (debt.creditor) data.creditor = String(debt.creditor).slice(0, 100);
    if (debt.dueDate) data.dueDate = String(debt.dueDate).slice(0, 40);
    if (debt.notes) data.notes = String(debt.notes).slice(0, 500);
    if (debt.paymentHistory) data.paymentHistory = debt.paymentHistory;
    batch.set(ref, data, { merge: true });
    count++;
  }

  for (const inv of localInvestments) {
    if (!inv || !inv.id) continue;
    const ref = doc(db, 'users', userId, 'investments', inv.id);
    const data: Record<string, any> = {
      id: inv.id,
      userId,
      title: (inv.title || 'Investimento').slice(0, 200),
      category: inv.category || 'Outros',
      institution: (inv.institution || 'Geral').slice(0, 100),
      investedAmount: Number(inv.investedAmount) || 0,
      currentValue: Number(inv.currentValue) || 0,
      createdAt: inv.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (inv.targetAmount !== undefined) data.targetAmount = Number(inv.targetAmount);
    if (inv.yieldRate) data.yieldRate = String(inv.yieldRate).slice(0, 50);
    if (inv.notes) data.notes = String(inv.notes).slice(0, 500);
    if (inv.history) data.history = inv.history;
    batch.set(ref, data, { merge: true });
    count++;
  }

  if (count > 0) {
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  }

  return { count };
}
