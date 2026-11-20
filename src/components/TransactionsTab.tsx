import React from 'react';
import { Building2, ArrowRight, Sparkles } from 'lucide-react';
import { OverviewCards } from './OverviewCards';
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
}) => {
  return (
    <div className="space-y-5">

    {/* Overview KPI Cards */}
    <OverviewCards
      totalBalance={netBalance}
      monthIncome={monthIncome}
      monthExpense={monthExpense}
      netBalance={netBalance}
      hideBalance={hideBalance}
      pendingIncome={pendingIncome}
      pendingExpense={pendingExpense}
      onOpenNewExpense={() => handleOpenNewTransaction('expense')}
      onOpenNewIncome={() => handleOpenNewTransaction('income')}
      onOpenCharts={() => goToTab('charts')}
    />

    {/* Didactic 50/30/20 Financial Intelligence & Recommendations */}
    <FinancialEducationCard
      monthIncome={monthIncome}
      monthExpense={monthExpense}
      monthTransactions={monthTransactions}
      hideBalance={hideBalance}
      onOpenInvestments={() => goToTab('investments')}
    />

    {/* Reassuring Active Debts Banner if any exist */}
    {activeDebts.length > 0 && (
      <div className="bg-gradient-to-r from-[#131A29] to-[#0E131F] rounded-2xl p-4 border border-amber-900/40 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-100 block">
              Você tem {activeDebts.length} {activeDebts.length === 1 ? 'dívida ativa cadastrada' : 'dívidas ativas cadastradas'}
            </span>
            <span className="text-[11px] text-slate-400">
              Saldo total pendente a quitar: <strong className="text-amber-400">{hideBalance ? '••••••' : formatCurrency(totalDebtsRemaining)}</strong>
            </span>
          </div>
        </div>
        <button
          onClick={() => goToTab('debts')}
          className="text-xs font-bold text-amber-300 hover:text-white bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <span>Ver Dívidas & Abater</span>
          <ArrowRight size={13} />
        </button>
      </div>
    )}

    {/* Empty state hint */}
    {hasNoData && (
      <div className="bg-[#11141D] rounded-3xl p-6 border border-slate-800 text-center mb-5">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
          <Sparkles size={22} />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">
          Seu gerenciador financeiro está pronto
        </h3>
        <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
          Sem complicação para qualquer idade. Adicione sua primeira despesa (com opção de parcelar) ou dívida para começar seu controle.
        </p>
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleOpenNewTransaction('income')}
            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
          >
            + Registrar Receita
          </button>
          <button
            onClick={() => handleOpenNewTransaction('expense')}
            className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-950/40 cursor-pointer"
          >
            + Registrar Despesa (ou Parcelada)
          </button>
          <button
            onClick={handleOpenNewDebt}
            className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer"
          >
            + Registrar Dívida
          </button>
        </div>
      </div>
    )}

    {/* Smart Transaction List */}
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
    </div>
  );
};
