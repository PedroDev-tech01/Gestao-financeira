import { useMemo } from 'react';
import type { DebtItem, Transaction } from '../types';

/** Números do mês selecionado e resumo das dívidas, recalculados só quando os dados mudam. */
export function useMonthSummary(transactions: Transaction[], debts: DebtItem[], currentMonth: string) {
  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date && t.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  );

  const totals = useMemo(() => {
    let monthIncome = 0;
    let monthExpense = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;
    for (const t of monthTransactions) {
      if (t.type === 'income') {
        monthIncome += t.amount;
        if (t.status === 'pending') pendingIncome += t.amount;
      } else if (t.type === 'expense') {
        monthExpense += t.amount;
        if (t.status === 'pending') pendingExpense += t.amount;
      }
    }
    return { monthIncome, monthExpense, pendingIncome, pendingExpense, netBalance: monthIncome - monthExpense };
  }, [monthTransactions]);

  const activeDebts = useMemo(
    () => debts.filter((d) => d.status === 'active' && d.totalAmount - d.paidAmount > 0),
    [debts]
  );

  const totalDebtsRemaining = useMemo(
    () => activeDebts.reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0),
    [activeDebts]
  );

  // Meses que aparecem na exportação de relatório
  const availableMonths = useMemo(() => {
    const set = new Set<string>([currentMonth]);
    for (const t of transactions) {
      if (t.date && t.date.length >= 7) set.add(t.date.substring(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [transactions, currentMonth]);

  return { monthTransactions, ...totals, activeDebts, totalDebtsRemaining, availableMonths };
}
