import React from 'react';
import { Home, TrendingUp, CreditCard, BarChart3, Plus } from 'lucide-react';

type Tab = 'transactions' | 'investments' | 'debts' | 'charts';

interface MobileBottomNavProps {
  activeTab: Tab;
  onSelectTab: (tab: Tab) => void;
  onOpenNewTransaction: () => void;
  transactionsCount: number;
  investmentsCount: number;
  debtsCount: number;
}

const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'transactions', label: 'Início', Icon: Home },
  { id: 'investments', label: 'Investimentos', Icon: TrendingUp },
  { id: 'debts', label: 'Dívidas', Icon: CreditCard },
  { id: 'charts', label: 'Gráficos', Icon: BarChart3 },
];

/** Barra de navegação flutuante do celular, com o botão de novo lançamento no meio. */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTransaction,
  debtsCount,
}) => {
  const renderTab = ({ id, label, Icon }: (typeof TABS)[number]) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        id={`mobile-tab-${id}`}
        type="button"
        onClick={() => onSelectTab(id)}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
          active ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Icon size={21} strokeWidth={active ? 2.3 : 2} />
        {id === 'debts' && debtsCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-300" aria-hidden="true" />
        )}
      </button>
    );
  };

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navegação"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom,0px),12px)] pointer-events-none"
    >
      <div className="pointer-events-auto max-w-md mx-auto h-16 rounded-full bg-slate-900/95 backdrop-blur-xl border border-slate-800/70 shadow-[0_10px_30px_rgba(0,0,0,0.45)] flex items-center justify-between px-2">
        {TABS.slice(0, 2).map(renderTab)}
        <button
          id="mobile-tab-new"
          type="button"
          onClick={onOpenNewTransaction}
          aria-label="Novo lançamento"
          className="w-12 h-12 rounded-full bg-slate-100 hover:bg-white text-slate-950 flex items-center justify-center cursor-pointer active:scale-95"
        >
          <Plus size={22} strokeWidth={2.4} />
        </button>
        {TABS.slice(2).map(renderTab)}
      </div>
    </nav>
  );
};
