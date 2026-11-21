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
  const tabs: { id: AppTab; label: string; Icon: typeof Receipt; count?: number }[] = [
    { id: 'transactions', label: 'Início', Icon: Receipt, count: monthTransactionsCount },
    { id: 'investments', label: 'Investimentos', Icon: TrendingUp, count: investmentsCount },
    { id: 'debts', label: 'Dívidas', Icon: Building2, count: activeDebtsCount },
    { id: 'charts', label: 'Gráficos', Icon: BarChart3 },
  ];
  const quick = [
    { label: 'Gasto', onClick: onNewExpense },
    { label: 'Ganho', onClick: onNewIncome },
    { label: 'Dívida', onClick: onNewDebt },
    { label: 'Investimento', onClick: onNewInvestment },
  ];

  // No celular a navegação fica na barra inferior; aqui só aparece do tablet para cima.
  return (
    <div className="hidden sm:flex flex-wrap items-center justify-between gap-3 mb-6">
      <div role="tablist" aria-label="Seções" className="inline-flex items-center gap-1 p-1 bg-slate-900 rounded-full">
        {tabs.map(({ id, label, Icon, count }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              id={`tab-btn-${id}`}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 min-h-[40px] rounded-full text-sm font-medium transition-colors cursor-pointer ${
                active ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
              {count ? <span className="text-xs text-slate-500 tabular-nums">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        {quick.map((q) => (
          <button
            key={q.label}
            onClick={q.onClick}
            className="flex items-center gap-1 px-3 min-h-[36px] rounded-full text-[13px] font-medium text-slate-300 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
