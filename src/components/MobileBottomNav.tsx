import React from 'react';
import {
  Receipt,
  TrendingUp,
  Building2,
  PieChart,
  Plus
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'transactions' | 'investments' | 'debts' | 'charts';
  onSelectTab: (tab: 'transactions' | 'investments' | 'debts' | 'charts') => void;
  onOpenNewTransaction: () => void;
  transactionsCount: number;
  investmentsCount: number;
  debtsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTransaction,
  transactionsCount,
  investmentsCount,
  debtsCount,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navegação mobile"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0D14]/92 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),10px)] shadow-[0_-8px_24px_rgba(0,0,0,0.5)] transition-all"
    >
      <div className="grid grid-cols-5 items-center justify-between max-w-md mx-auto">
        
        {/* 1. Extrato */}
        <button
          id="mobile-tab-transactions"
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer select-none relative active:scale-95 min-h-[46px] ${
            activeTab === 'transactions'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Receipt size={20} className={activeTab === 'transactions' ? 'stroke-[2.5]' : ''} />
            {transactionsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-500 text-[#0A0D14] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {transactionsCount > 99 ? '99+' : transactionsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 leading-none tracking-tight">Extrato</span>
          {activeTab === 'transactions' && (
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1" />
          )}
        </button>

        {/* 2. Investimentos */}
        <button
          id="mobile-tab-investments"
          onClick={() => onSelectTab('investments')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer select-none relative active:scale-95 min-h-[46px] ${
            activeTab === 'investments'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <TrendingUp size={20} className={activeTab === 'investments' ? 'stroke-[2.5]' : ''} />
            {investmentsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-950 text-emerald-300 border border-emerald-600/40 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {investmentsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 leading-none tracking-tight">Investir</span>
          {activeTab === 'investments' && (
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1" />
          )}
        </button>

        {/* 3. Center Floating Action Button (+) */}
        <div className="flex flex-col items-center justify-center">
          <button
            id="mobile-btn-quick-new"
            onClick={onOpenNewTransaction}
            className="w-12 h-12 -mt-4 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-[#0A0D14] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-950/60 border-2 border-[#0A0D14] cursor-pointer transition-all active:scale-90 active:rotate-12"
            title="Adicionar novo lançamento"
          >
            <Plus size={24} className="stroke-[3] text-[#0A0D14]" />
          </button>
          <span className="text-[9px] text-emerald-400 font-bold mt-0.5 leading-none">Novo</span>
        </div>

        {/* 4. Dívidas */}
        <button
          id="mobile-tab-debts"
          onClick={() => onSelectTab('debts')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer select-none relative active:scale-95 min-h-[46px] ${
            activeTab === 'debts'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Building2 size={20} className={activeTab === 'debts' ? 'stroke-[2.5]' : ''} />
            {debtsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-950 text-amber-300 border border-amber-600/40 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {debtsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 leading-none tracking-tight">Dívidas</span>
          {activeTab === 'debts' && (
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1" />
          )}
        </button>

        {/* 5. Gráficos */}
        <button
          id="mobile-tab-charts"
          onClick={() => onSelectTab('charts')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer select-none relative active:scale-95 min-h-[46px] ${
            activeTab === 'charts'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart size={20} className={activeTab === 'charts' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-1 leading-none tracking-tight">Gráficos</span>
          {activeTab === 'charts' && (
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1" />
          )}
        </button>

      </div>
    </nav>
  );
};
