import React from 'react';
import { Receipt, TrendingUp, Building2, BarChart3, Plus } from 'lucide-react';

export type AppTab = 'transactions' | 'investments' | 'debts' | 'charts';

interface AppTabsProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  monthTransactionsCount: number;
  investmentsCount: number;
  activeDebtsCount: number;
  onNewIncome: () => void;
  onNewExpense: () => void;
  onNewDebt: () => void;
  onNewInvestment: () => void;
}

/** Abas (Extrato, Investimentos, Dívidas, Gráficos) + atalhos de cadastro rápido. */
export const AppTabs: React.FC<AppTabsProps> = ({
  activeTab,
  setActiveTab,
  monthTransactionsCount,
  investmentsCount,
  activeDebtsCount,
  onNewIncome,
  onNewExpense,
  onNewDebt,
  onNewInvestment,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between sm:border-b border-slate-800/80 sm:pb-3 mb-5 gap-3">
      <div className="hidden sm:grid sm:grid-cols-4 lg:inline-flex lg:items-center gap-1.5 p-1 bg-gradient-to-r from-[#131A29] to-[#0E131F] rounded-2xl border border-slate-800/80 shadow-xs w-full lg:w-auto">
        
        {/* Tab 1: Extrato & Resumo */}
        <button
          id="tab-btn-transactions"
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-[0.98] ${
            activeTab === 'transactions'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt size={16} className={`shrink-0 ${activeTab === 'transactions' ? 'text-emerald-400' : ''}`} />
          <span className="truncate">
            <span className="2xl:hidden">Extrato</span>
            <span className="hidden 2xl:inline">Extrato & Resumo</span>
          </span>
          {monthTransactionsCount > 0 && (
            <span className="text-[10px] font-bold bg-[#0A0D14] text-emerald-400 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-xs shrink-0">
              {monthTransactionsCount}
            </span>
          )}
        </button>

        {/* Tab 2: Investimentos & Reserva */}
        <button
          id="tab-btn-investments"
          onClick={() => setActiveTab('investments')}
          className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-[0.98] ${
            activeTab === 'investments'
              ? 'bg-emerald-950/60 text-emerald-300 shadow-xs border border-emerald-800/60'
              : 'text-slate-400 hover:text-emerald-300'
          }`}
        >
          <TrendingUp size={16} className={`shrink-0 ${activeTab === 'investments' ? 'text-emerald-400' : ''}`} />
          <span className="truncate">
            <span className="2xl:hidden">Investimentos</span>
            <span className="hidden 2xl:inline">Investimentos & Reserva</span>
          </span>
          {investmentsCount > 0 && (
            <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-600/40 shadow-xs shrink-0">
              {investmentsCount}
            </span>
          )}
        </button>

        {/* Tab 3: Dívidas do Momento */}
        <button
          id="tab-btn-debts"
          onClick={() => setActiveTab('debts')}
          className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-[0.98] ${
            activeTab === 'debts'
              ? 'bg-amber-950/60 text-amber-300 shadow-xs border border-amber-800/60'
              : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          <Building2 size={16} className={`shrink-0 ${activeTab === 'debts' ? 'text-amber-400' : ''}`} />
          <span className="truncate">Dívidas</span>
          {activeDebtsCount > 0 && (
            <span className="text-[10px] font-bold bg-amber-900/60 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-600/40 shadow-xs shrink-0">
              {activeDebtsCount}
            </span>
          )}
        </button>

        {/* Tab 4: Gráficos */}
        <button
          id="tab-btn-charts"
          onClick={() => setActiveTab('charts')}
          className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-[0.98] ${
            activeTab === 'charts'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 size={16} className={`shrink-0 ${activeTab === 'charts' ? 'text-emerald-400' : ''}`} />
          <span className="truncate">Gráficos</span>
        </button>

      </div>

      {/* Quick Action in Tab Bar */}
      <div className="grid grid-cols-4 sm:flex sm:flex-wrap lg:flex-nowrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
        <button
          onClick={onNewIncome}
          className="justify-center text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/40 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <Plus size={13} />
          <span>Receita</span>
        </button>
        <button
          onClick={onNewExpense}
          className="justify-center text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <Plus size={13} />
          <span>Despesa</span>
        </button>
        <button
          onClick={onNewDebt}
          className="justify-center text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <Plus size={13} />
          <span>Dívida</span>
        </button>
        <button
          onClick={onNewInvestment}
          className="justify-center text-xs font-bold text-teal-400 hover:text-teal-300 bg-teal-950/30 hover:bg-teal-900/40 border border-teal-800/40 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <Plus size={13} />
          <span>Investir</span>
        </button>
      </div>
    </div>
  );
};
