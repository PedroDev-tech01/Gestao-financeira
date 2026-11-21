import React from 'react';
import { Building2, ArrowRight, Sparkles } from 'lucide-react';
import { MonthHero } from './MonthHero';
import { FinancialEducationCard } from './FinancialEducationCard';
import { TransactionList } from './TransactionList';
import { formatCurrency } from '../utils/formatters';
import type { CategoryItem, DebtItem, Transaction, TransactionType } from '../types';

interface TransactionsTabProps {
  monthTransactions: Transaction[];
  categories: CategoryItem[];
  hideBalance: boolean;
  monthIncome: number;
  monthExpense: number;
  netBalance: number;
  pendingIncome: number;
  pendingExpense: number;
  activeDebts: DebtItem[];
  totalDebtsRemaining: number;
  hasNoData: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleOpenNewTransaction: (type?: TransactionType) => void;
  handleOpenNewDebt: () => void;
  handleEditTransaction: (tx: Transaction) => void;
  handleDeleteTransaction: (id: string) => void;
  handleToggleTxStatus: (id: string) => void;
  handleClearAccountTransactions: () => void;
  openExport: () => void;
  goToTab: (tab: 'investments' | 'debts' | 'charts') => void;
  /** Aparece logo abaixo do resumo do mês (ex.: contas vencendo). */
  afterHero?: React.ReactNode;
  /** Aparece no fim da aba (ex.: guia de uso). */
  footer?: React.ReactNode;
}

/** Aba "Extrato": resumo do mês, dicas 50/30/20, aviso de dívidas e a lista de lançamentos. */
export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  monthTransactions,
  categories,
  hideBalance,
  monthIncome,
  monthExpense,
  netBalance,
  pendingIncome,
  pendingExpense,
  activeDebts,
  totalDebtsRemaining,
  hasNoData,
  searchQuery,
  setSearchQuery,
  handleOpenNewTransaction,
  handleOpenNewDebt,
  handleEditTransaction,
  handleDeleteTransaction,
  handleToggleTxStatus,
  handleClearAccountTransactions,
  openExport,
  goToTab,
  afterHero,
  footer,
}) => {
  return (
    <div className="space-y-6">
      <MonthHero
        monthTransactions={monthTransactions}
        categories={categories}
        monthIncome={monthIncome}
        monthExpense={monthExpense}
        netBalance={netBalance}
        pendingExpense={pendingExpense}
        hideBalance={hideBalance}
        onOpenCharts={() => goToTab('charts')}
      />

      {afterHero}

      {hasNoData && (
        <div className="bg-slate-900 rounded-3xl p-6 text-center">
          <div className="w-12 h-12 bg-slate-800 text-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Sparkles size={22} />
          </div>
          <h3 className="text-base font-semibold text-slate-100 mb-1">Comece pelo primeiro lançamento</h3>
          <p className="text-sm text-slate-400 mb-5 max-w-sm mx-auto">
            Registre um gasto ou um ganho. Dá para parcelar compras e cadastrar dívidas também.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenNewTransaction('expense')}
              className="text-sm font-semibold text-slate-950 bg-slate-100 hover:bg-white px-4 min-h-[42px] rounded-full cursor-pointer"
            >
              Registrar gasto
            </button>
            <button
              onClick={() => handleOpenNewTransaction('income')}
              className="text-sm font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 px-4 min-h-[42px] rounded-full cursor-pointer"
            >
              Registrar ganho
            </button>
            <button
              onClick={handleOpenNewDebt}
              className="text-sm font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 px-4 min-h-[42px] rounded-full cursor-pointer"
            >
              Cadastrar dívida
            </button>
          </div>
        </div>
      )}

      <TransactionList
        transactions={monthTransactions}
        categories={categories}
        hideBalance={hideBalance}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onToggleStatus={handleToggleTxStatus}
        onOpenExportModal={openExport}
        onOpenNewTransaction={() => handleOpenNewTransaction('expense')}
        onClearAllTransactions={handleClearAccountTransactions}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      {activeDebts.length > 0 && (
        <button
          type="button"
          onClick={() => goToTab('debts')}
          className="w-full bg-slate-900 hover:bg-slate-800/80 rounded-3xl px-4 sm:px-5 min-h-[64px] flex items-center gap-3 text-left cursor-pointer transition-colors"
        >
          <span className="w-10 h-10 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-medium text-slate-100">
              {activeDebts.length} {activeDebts.length === 1 ? 'dívida ativa' : 'dívidas ativas'}
            </span>
            <span className="block text-[13px] text-slate-400 tabular-nums">
              Faltam {hideBalance ? '••••••' : formatCurrency(totalDebtsRemaining)} para quitar
            </span>
          </span>
          <ArrowRight size={16} className="text-slate-500" />
        </button>
      )}

      <FinancialEducationCard
        monthIncome={monthIncome}
        monthExpense={monthExpense}
        monthTransactions={monthTransactions}
        hideBalance={hideBalance}
        onOpenInvestments={() => goToTab('investments')}
      />

      {footer}
    </div>
  );
};
