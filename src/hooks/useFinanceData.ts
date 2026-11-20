import { useCallback, useEffect, useState } from 'react';
import type { AuthSessionUser, DebtItem, InvestmentItem, Transaction } from '../types';
import { loadUserAccountData, saveUserAccountData } from '../utils/userStorage';
import { subscribeToDebts, subscribeToInvestments, subscribeToTransactions } from '../services/cloud';

/**
 * Dados financeiros da conta ativa (lançamentos, dívidas, investimentos e "ocultar saldo").
 *
 * - Começa com o cache do aparelho da conta salva, para a tela abrir na hora.
 * - Guarda cada mudança no cache do aparelho, sempre separado por conta.
 * - Com login na nuvem, recebe as atualizações do Firestore em tempo real.
 *
 * Importante: ao trocar de conta, use `loadAccount` (ou `clearData`) NO MESMO momento em
 * que troca o usuário, para os dados de uma conta nunca serem gravados na outra.
 */
export function useFinanceData(
  initialUser: AuthSessionUser | null,
  currentUser: AuthSessionUser | null,
  firebaseUid: string | null
) {
  const [initial] = useState(() => loadUserAccountData(initialUser));
  const [transactions, setTransactions] = useState<Transaction[]>(initial.transactions);
  const [debts, setDebts] = useState<DebtItem[]>(initial.debts);
  const [investments, setInvestments] = useState<InvestmentItem[]>(initial.investments);
  const [hideBalance, setHideBalance] = useState<boolean>(initial.hideBalance);

  /** Troca para o cache local de outra conta. */
  const loadAccount = useCallback((user: AuthSessionUser) => {
    const account = loadUserAccountData(user);
    setTransactions(account.transactions);
    setDebts(account.debts);
    setInvestments(account.investments);
    setHideBalance(account.hideBalance);
    return account;
  }, []);

  /** Limpa tudo da memória (ao sair da conta), sem tocar no que está salvo no aparelho. */
  const clearData = useCallback(() => {
    setTransactions([]);
    setDebts([]);
    setInvestments([]);
  }, []);

  // Cache no aparelho, isolado por conta
  useEffect(() => {
    if (!currentUser) return;
    saveUserAccountData(currentUser, { hideBalance });
  }, [hideBalance, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    saveUserAccountData(currentUser, { transactions });
  }, [transactions, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    saveUserAccountData(currentUser, { debts });
  }, [debts, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    saveUserAccountData(currentUser, { investments });
  }, [investments, currentUser]);

  // Sincronização em tempo real com o Firestore (só desta conta)
  useEffect(() => {
    if (!firebaseUid) return;
    const unsubTxs = subscribeToTransactions(firebaseUid, setTransactions, (err) =>
      console.warn('Firestore transactions sync notice:', err)
    );
    const unsubDebts = subscribeToDebts(firebaseUid, setDebts, (err) =>
      console.warn('Firestore debts sync notice:', err)
    );
    const unsubInvs = subscribeToInvestments(firebaseUid, setInvestments, (err) =>
      console.warn('Firestore investments sync notice:', err)
    );
    return () => {
      unsubTxs();
      unsubDebts();
      unsubInvs();
    };
  }, [firebaseUid]);

  return {
    transactions,
    setTransactions,
    debts,
    setDebts,
    investments,
    setInvestments,
    hideBalance,
    setHideBalance,
    loadAccount,
    clearData,
  };
}

export type FinanceData = ReturnType<typeof useFinanceData>;
