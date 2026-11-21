import React, { useMemo } from 'react';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import type { CategoryItem, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface MonthHeroProps {
  monthTransactions: Transaction[];
  categories: CategoryItem[];
  monthIncome: number;
  monthExpense: number;
  netBalance: number;
  pendingExpense: number;
  hideBalance: boolean;
  onOpenCharts: () => void;
}

const HIDDEN = '••••••';

/** Separa "R$ 2.273,11" em "R$ 2.273" e ",11" para os centavos ficarem mais discretos. */
function splitCents(value: number) {
  const full = formatCurrency(Math.abs(value));
  const comma = full.lastIndexOf(',');
  return comma > 0 ? { main: full.slice(0, comma), cents: full.slice(comma) } : { main: full, cents: '' };
}

/**
 * Topo da tela principal no estilo Grafite: quanto sobra no mês, o que entrou e saiu,
 * e uma barra mostrando para onde foi o dinheiro.
 */
export const MonthHero: React.FC<MonthHeroProps> = ({
  monthTransactions,
  categories,
  monthIncome,
  monthExpense,
  netBalance,
  pendingExpense,
  hideBalance,
  onOpenCharts,
}) => {
  const breakdown = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of monthTransactions) {
      if (t.type !== 'expense') continue;
      totals.set(t.category, (totals.get(t.category) || 0) + t.amount);
    }
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4).reduce((s, [, v]) => s + v, 0);
    const colorOf = (name: string) => categories.find((c) => c.name === name)?.color || '#9BA0A9';
    const shortName = (name: string) => name.split(/[,&/]/)[0].trim();
    const items = top.map(([name, value]) => ({
      name: shortName(name),
      fullName: name,
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
      color: colorOf(name),
    }));
    if (rest > 0) {
      items.push({ name: 'Outros', fullName: 'Outros', value: rest, pct: (rest / total) * 100, color: '#4A4F5A' });
    }
    return { items, total };
  }, [monthTransactions, categories]);

  const balance = splitCents(netBalance);
  const isNegative = netBalance < 0;

  return (
    <section aria-label="Resumo do mês">
      <div className="text-center pt-2 sm:pt-4">
        <p className="text-sm text-slate-400">{isNegative ? 'Faltou no mês' : 'Sobra do mês'}</p>
        <p
          className={`mt-1.5 text-[44px] sm:text-6xl font-light tracking-[-0.045em] leading-none tabular-nums ${
            isNegative ? 'text-rose-400' : 'text-slate-100'
          }`}
        >
          {hideBalance ? (
            HIDDEN
          ) : (
            <>
              {isNegative && '− '}
              {balance.main}
              <span className="text-slate-500">{balance.cents}</span>
            </>
          )}
        </p>
        <div className="mt-4 inline-flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-[13px] text-slate-300 tabular-nums">
            <ArrowUp size={13} strokeWidth={2.6} className="text-emerald-400" aria-hidden="true" />
            <span className="sr-only">Entrou</span>
            {hideBalance ? HIDDEN : formatCurrency(monthIncome)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-[13px] text-slate-300 tabular-nums">
            <ArrowDown size={13} strokeWidth={2.6} className="text-rose-400" aria-hidden="true" />
            <span className="sr-only">Saiu</span>
            {hideBalance ? HIDDEN : formatCurrency(monthExpense)}
          </span>
          {pendingExpense > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-[13px] text-slate-300 tabular-nums">
              <Clock size={13} strokeWidth={2.4} className="text-amber-300" aria-hidden="true" />
              {hideBalance ? HIDDEN : `${formatCurrency(pendingExpense)} a pagar`}
            </span>
          )}
        </div>
      </div>

      {breakdown.items.length > 0 && (
        <div className="mt-6 bg-slate-900 rounded-3xl p-4 sm:p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold text-slate-100">Para onde foi</h2>
            <button
              type="button"
              onClick={onOpenCharts}
              className="text-[13px] text-slate-400 hover:text-slate-200 cursor-pointer min-h-[32px] px-1"
            >
              Detalhes
            </button>
          </div>
          <div
            role="img"
            aria-label={breakdown.items.map((i) => `${i.name} ${Math.round(i.pct)}%`).join(', ')}
            className="mt-3 h-3 flex gap-[3px]"
          >
            {breakdown.items.map((item, idx) => (
              <div
                key={item.fullName}
                className={`${idx === 0 ? 'rounded-l-md' : 'rounded-sm'} ${
                  idx === breakdown.items.length - 1 ? 'rounded-r-md' : ''
                }`}
                style={{ flexGrow: Math.max(item.pct, 1.5), flexBasis: 0, backgroundColor: item.color }}
              />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-2.5 mt-4 text-[13px]">
            {breakdown.items.slice(0, 4).map((item) => (
              <li key={item.fullName} className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="flex-1 text-slate-300 truncate">{item.name}</span>
                <span className="text-slate-100 tabular-nums">
                  {hideBalance ? '•••' : `${Math.round(item.pct)}%`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
