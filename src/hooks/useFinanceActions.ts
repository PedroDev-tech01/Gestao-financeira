import type { AuthSessionUser, DebtItem, DebtPaymentRecord, InvestmentItem, Transaction } from '../types';
import type { FinanceData } from './useFinanceData';
import type { AddToast } from './useToasts';
import {
  clearAllUserTransactions,
  deleteDebt as fsDeleteDebt,
  deleteInvestment as fsDeleteInvestment,
  deleteTransaction as fsDeleteTransaction,
  saveDebt as fsSaveDebt,
  saveInvestment as fsSaveInvestment,
  saveTransaction as fsSaveTransaction,
} from '../services/cloud';
import { saveUserAccountData } from '../utils/userStorage';
import { formatCurrency } from '../utils/formatters';

type NewOrExisting<T, K extends keyof T = never> = Omit<T, 'id' | K> | T;
export type SaveTransactionInput = NewOrExisting<Transaction> | NewOrExisting<Transaction>[];

const today = () => new Date().toISOString().split('T')[0];

/**
 * Todas as operações sobre os dados (criar, editar, excluir, pagar, aportar...).
 * Cada mudança atualiza a tela na hora e, com login na nuvem, é enviada ao Firestore.
 */
export function useFinanceActions(
  currentUser: AuthSessionUser | null,
  firebaseUid: string | null,
  data: FinanceData,
  addToast: AddToast
) {
  const { transactions, setTransactions, debts, setDebts, investments, setInvestments } = data;
  const uid = currentUser?.uid;

  const cloud = (task: (uid: string) => Promise<unknown>, log: (...a: unknown[]) => void = console.error) => {
    if (uid) task(uid).catch(log);
  };

  // ---- Lançamentos ----

  /** Devolve 'updated' quando editou um lançamento existente. */
  const saveTransaction = (txData: SaveTransactionInput): 'created' | 'updated' | 'installments' => {
    if (Array.isArray(txData)) {
      const newItems: Transaction[] = txData.map((item, idx) =>
        'id' in item
          ? (item as Transaction)
          : {
              ...(item as Omit<Transaction, 'id'>),
              id: `tx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
              scope: 'personal',
            }
      );
      setTransactions((prev) => [...newItems, ...prev]);
      newItems.forEach((item) => cloud((u) => fsSaveTransaction(u, item)));
      addToast('success', `${newItems.length} parcelas lançadas com sucesso!`);
      return 'installments';
    }

    if ('id' in txData) {
      const updatedTx = txData as Transaction;
      setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
      cloud((u) => fsSaveTransaction(u, updatedTx));
      addToast('success', 'Lançamento atualizado!');
      return 'updated';
    }

    const newTx: Transaction = {
      ...(txData as Omit<Transaction, 'id'>),
      id: `tx-${Date.now()}`,
      scope: 'personal',
    };
    setTransactions((prev) => [newTx, ...prev]);
    cloud((u) => fsSaveTransaction(u, newTx));
    addToast('success', `${newTx.type === 'income' ? 'Ganho' : 'Gasto'} salvo!`);
    return 'created';
  };

  const deleteTransaction = (txId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    cloud((u) => fsDeleteTransaction(u, txId));
    addToast('info', 'Lançamento excluído.');
  };

  const toggleTransactionStatus = (txId: string) => {
    const target = transactions.find((t) => t.id === txId);
    if (!target) return;
    const nextStatus: Transaction['status'] = target.status === 'paid' ? 'pending' : 'paid';
    const updated: Transaction = { ...target, status: nextStatus };
    setTransactions((prev) => prev.map((t) => (t.id === txId ? updated : t)));
    cloud((u) => fsSaveTransaction(u, updated), console.warn);
    addToast('info', nextStatus === 'paid' ? 'Marcado como pago/recebido!' : 'Marcado como a pagar/pendente!');
  };

  const clearAccountTransactions = async () => {
    if (transactions.length === 0) return;
    const confirmed = window.confirm(
      'Deseja apagar todos os lançamentos desta conta? Os dados das suas outras contas permanecerão intactos.'
    );
    if (!confirmed) return;

    const txIds = transactions.map((t) => t.id);
    if (firebaseUid) {
      try {
        await clearAllUserTransactions(firebaseUid, txIds);
      } catch (e) {
        console.error('Error clearing cloud transactions:', e);
      }
    }
    setTransactions([]);
    if (currentUser) saveUserAccountData(currentUser, { transactions: [] });
    addToast('info', 'Todos os lançamentos desta conta foram apagados com sucesso.');
  };

  // ---- Dívidas ----

  const saveDebt = (debtData: NewOrExisting<DebtItem, 'createdAt'>) => {
    if ('id' in debtData) {
      const updatedDebt = debtData as DebtItem;
      setDebts((prev) => prev.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)));
      cloud((u) => fsSaveDebt(u, updatedDebt));
      addToast('success', 'Dívida atualizada!');
      return;
    }
    const newDebt: DebtItem = {
      ...(debtData as Omit<DebtItem, 'id' | 'createdAt'>),
      id: `debt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      paymentHistory:
        debtData.paidAmount > 0
          ? [{ id: `pay-${Date.now()}`, date: today(), amount: debtData.paidAmount, note: 'Valor inicial já quitado' }]
          : [],
    };
    setDebts((prev) => [newDebt, ...prev]);
    cloud((u) => fsSaveDebt(u, newDebt));
    addToast('success', 'Dívida registrada com sucesso!');
  };

  const deleteDebt = (debtId: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
    cloud((u) => fsDeleteDebt(u, debtId));
    addToast('info', 'Dívida excluída.');
  };

  const payDebt = (debtId: string, amountPaid: number, createExpenseTransaction: boolean, note?: string) => {
    const targetDebt = debts.find((d) => d.id === debtId);
    if (!targetDebt) return;

    const newPaid = targetDebt.paidAmount + amountPaid;
    const record: DebtPaymentRecord = {
      id: `pay-${Date.now()}`,
      date: today(),
      amount: amountPaid,
      note: note || 'Pagamento / Abatimento de dívida',
    };
    const updatedDebt: DebtItem = {
      ...targetDebt,
      paidAmount: newPaid,
      status: newPaid >= targetDebt.totalAmount ? 'paid' : targetDebt.status,
      paymentHistory: [...(targetDebt.paymentHistory || []), record],
    };
    setDebts((prev) => prev.map((d) => (d.id === debtId ? updatedDebt : d)));
    cloud((u) => fsSaveDebt(u, updatedDebt), console.warn);

    if (createExpenseTransaction) {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        description: `Pagamento de Dívida: ${targetDebt.title || 'Dívida'}`,
        amount: amountPaid,
        type: 'expense',
        // Mesmo nome da categoria cadastrada, para aparecer com ícone e no grupo "Essencial"
        category: 'Dívidas & Quitações',
        date: today(),
        status: 'paid',
        scope: 'personal',
        paymentMethod: 'pix',
        notes: note ? `Abatimento de dívida: ${note}` : `Abatimento efetuado para ${targetDebt.title}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      cloud((u) => fsSaveTransaction(u, newTx), console.warn);
    }

    addToast('success', `Pagamento de ${formatCurrency(amountPaid)} confirmado!`);
  };

  // ---- Investimentos ----

  const saveInvestment = (investmentData: NewOrExisting<InvestmentItem, 'createdAt'>) => {
    if ('id' in investmentData) {
      const updatedInv = investmentData as InvestmentItem;
      setInvestments((prev) => prev.map((inv) => (inv.id === updatedInv.id ? updatedInv : inv)));
      cloud((u) => fsSaveInvestment(u, updatedInv));
      addToast('success', 'Investimento atualizado!');
      return;
    }
    const newItem: InvestmentItem = {
      ...(investmentData as Omit<InvestmentItem, 'id' | 'createdAt'>),
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      history: [
        {
          id: `rec-${Date.now()}`,
          date: today(),
          type: 'deposit',
          amount: investmentData.investedAmount,
          notes: 'Aplicação inicial',
        },
      ],
    };
    setInvestments((prev) => [newItem, ...prev]);
    cloud((u) => fsSaveInvestment(u, newItem));
    addToast('success', 'Investimento adicionado à sua carteira!');
  };

  const deleteInvestment = (id: string) => {
    setInvestments((prev) => prev.filter((item) => item.id !== id));
    cloud((u) => fsDeleteInvestment(u, id));
    addToast('info', 'Investimento removido da carteira.');
  };

  const investmentOperation = (
    investmentId: string,
    operationType: 'deposit' | 'withdraw' | 'yield',
    amount: number,
    createTransaction: boolean,
    notes?: string
  ) => {
    const targetInv = investments.find((inv) => inv.id === investmentId);
    if (!targetInv) return;

    let newInvested = targetInv.investedAmount;
    let newCurrent = targetInv.currentValue;
    if (operationType === 'deposit') {
      newInvested += amount;
      newCurrent += amount;
    } else if (operationType === 'withdraw') {
      newInvested = Math.max(0, newInvested - amount);
      newCurrent = Math.max(0, newCurrent - amount);
    } else {
      newCurrent += amount;
    }

    const defaultNote = operationType === 'deposit' ? 'Aporte' : operationType === 'withdraw' ? 'Resgate' : 'Rendimento';
    const updatedInv: InvestmentItem = {
      ...targetInv,
      investedAmount: newInvested,
      currentValue: newCurrent,
      updatedAt: new Date().toISOString(),
      history: [
        ...(targetInv.history || []),
        { id: `rec-${Date.now()}`, date: today(), type: operationType, amount, notes: notes || defaultNote },
      ],
    };
    setInvestments((prev) => prev.map((inv) => (inv.id === investmentId ? updatedInv : inv)));
    cloud((u) => fsSaveInvestment(u, updatedInv), console.warn);

    if (createTransaction && operationType !== 'yield') {
      const isDeposit = operationType === 'deposit';
      const createdTx: Transaction = {
        id: `tx-${Date.now()}`,
        description: isDeposit
          ? `Aporte em: ${targetInv.title || 'Investimento'}`
          : `Resgate de: ${targetInv.title || 'Investimento'}`,
        amount,
        type: isDeposit ? 'expense' : 'income',
        category: isDeposit ? 'Investimentos & Reserva de Emergência' : 'Rendimentos & Dividendos',
        date: today(),
        status: 'paid',
        scope: 'personal',
        paymentMethod: 'pix',
        notes: isDeposit
          ? notes ? `Aporte: ${notes}` : `Aporte em ${targetInv.title}`
          : notes ? `Resgate: ${notes}` : `Resgate de ${targetInv.title}`,
      };
      setTransactions((prev) => [createdTx, ...prev]);
      cloud((u) => fsSaveTransaction(u, createdTx), console.warn);
    }

    addToast(
      'success',
      operationType === 'deposit'
        ? `Aporte de ${formatCurrency(amount)} adicionado!`
        : operationType === 'withdraw'
          ? `Resgate de ${formatCurrency(amount)} concluído!`
          : `Rendimento de ${formatCurrency(amount)} lançado!`
    );
  };

  return {
    saveTransaction,
    deleteTransaction,
    toggleTransactionStatus,
    clearAccountTransactions,
    saveDebt,
    deleteDebt,
    payDebt,
    saveInvestment,
    deleteInvestment,
    investmentOperation,
  };
}
