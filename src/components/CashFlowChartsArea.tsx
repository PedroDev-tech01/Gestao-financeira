import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, getMonthNameAndYear, getPreviousMonth, getNextMonth } from '../utils/formatters';

interface CashFlowChartsAreaProps {
  transactions: Transaction[];
  currentMonth: string;
  onChangeMonth: (month: string) => void;
  hideBalance: boolean;
  onOpenNewIncome: () => void;
  onOpenNewExpense: () => void;
}

export const CashFlowChartsArea: React.FC<CashFlowChartsAreaProps> = ({
  transactions,
  currentMonth,
  onChangeMonth,
  hideBalance,
  onOpenNewIncome,
  onOpenNewExpense,
}) => {
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily');
  const [chartStyle, setChartStyle] = useState<'bars' | 'area'>('bars');

  // Daily Data for the current month
  const dailyData = useMemo(() => {
    if (!currentMonth) return [];
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dayMap = new Map<number, { income: number; expense: number }>();
    for (let d = 1; d <= daysInMonth; d++) {
      dayMap.set(d, { income: 0, expense: 0 });
    }

    transactions.forEach(t => {
      if (t.date && t.date.startsWith(currentMonth)) {
        const parts = t.date.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          if (dayMap.has(day)) {
            const current = dayMap.get(day)!;
            if (t.type === 'income') current.income += t.amount;
            else if (t.type === 'expense') current.expense += t.amount;
          }
        }
      }
    });

    return Array.from(dayMap.entries()).map(([day, val]) => {
      const dayLabel = String(day).padStart(2, '0');
      return {
        key: `Dia ${dayLabel}`,
        shortLabel: dayLabel,
        day,
        income: val.income,
        expense: val.expense,
        net: val.income - val.expense,
      };
    });
  }, [transactions, currentMonth]);

  // Monthly Data for the last 6 months
  const monthlyData = useMemo(() => {
    const months: string[] = [];
    let cur = currentMonth;
    for (let i = 0; i < 6; i++) {
      months.unshift(cur);
      cur = getPreviousMonth(cur);
    }

    const monthNamesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    return months.map(m => {
      const [y, mth] = m.split('-');
      const monthIdx = parseInt(mth, 10) - 1;
      const label = `${monthNamesPt[monthIdx]}/${y.slice(2)}`;

      let income = 0;
      let expense = 0;

      transactions.forEach(t => {
        if (t.date && t.date.startsWith(m)) {
          if (t.type === 'income') income += t.amount;
          else if (t.type === 'expense') expense += t.amount;
        }
      });

      return {
        key: label,
        shortLabel: label,
        income,
        expense,
        net: income - expense,
      };
    });
  }, [transactions, currentMonth]);

  const activeChartData = granularity === 'daily' ? dailyData : monthlyData;

  const totals = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    activeChartData.forEach(item => {
      totalIncome += item.income;
      totalExpense += item.expense;
    });

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    };
  }, [activeChartData]);

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
    return `R$${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const incItem = payload.find((p: any) => p.dataKey === 'income');
    const expItem = payload.find((p: any) => p.dataKey === 'expense');

    const incVal = incItem ? incItem.value : 0;
    const expVal = expItem ? expItem.value : 0;
    const netVal = incVal - expVal;

    return (
      <div className="bg-[#0A0D14] border border-slate-700/80 p-3 rounded-2xl shadow-xl text-xs space-y-1.5 min-w-[170px]">
        <div className="font-bold text-slate-100 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            netVal >= 0 
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
              : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
          }`}>
            {netVal >= 0 ? 'Saldo Positivo' : 'Saldo Negativo'}
          </span>
        </div>
        <div className="flex items-center justify-between text-emerald-400">
          <span className="text-slate-300">Entradas:</span>
          <span className="font-bold">{hideBalance ? '••••••' : `+ ${formatCurrency(incVal)}`}</span>
        </div>
        <div className="flex items-center justify-between text-rose-400">
          <span className="text-slate-300">Saídas:</span>
          <span className="font-bold">{hideBalance ? '••••••' : `- ${formatCurrency(expVal)}`}</span>
        </div>
        <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between font-bold text-slate-200">
          <span>Resultado Líquido:</span>
          <span className={netVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {hideBalance ? '••••••' : (netVal >= 0 ? `+ ${formatCurrency(netVal)}` : `- ${formatCurrency(Math.abs(netVal))}`)}
          </span>
        </div>
      </div>
    );
  };

  const hasNoData = totals.totalIncome === 0 && totals.totalExpense === 0;

  return (
    <div className="space-y-4">
      
      {/* Clean Header Controls with Harmonious Theme */}
      <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-3xl p-5 border border-slate-800/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-400" />
              Gráfico de Entradas e Saídas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {granularity === 'daily' ? `Comparativo diário de ${getMonthNameAndYear(currentMonth)}` : 'Histórico acumulado dos últimos 6 meses'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Granularity switch */}
            <div className="flex items-center bg-[#0A0D14] p-0.5 rounded-xl border border-slate-800/80 text-xs">
              <button
                onClick={() => setGranularity('daily')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer active:scale-95 ${
                  granularity === 'daily' ? 'bg-slate-800 text-emerald-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Diário
              </button>
              <button
                onClick={() => setGranularity('monthly')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer active:scale-95 ${
                  granularity === 'monthly' ? 'bg-slate-800 text-emerald-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                6 Meses
              </button>
            </div>

            {/* Chart Style */}
            <div className="flex items-center bg-[#0A0D14] p-0.5 rounded-xl border border-slate-800/80 text-xs">
              <button
                onClick={() => setChartStyle('bars')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer active:scale-95 ${
                  chartStyle === 'bars' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Barras
              </button>
              <button
                onClick={() => setChartStyle('area')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer active:scale-95 ${
                  chartStyle === 'area' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Área Suave
              </button>
            </div>

            {/* Month switch if daily */}
            {granularity === 'daily' && (
              <div className="flex items-center bg-[#0A0D14] rounded-xl border border-slate-800/80 p-0.5">
                <button
                  onClick={() => onChangeMonth(getPreviousMonth(currentMonth))}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-95"
                  title="Mês anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-300 px-2 min-w-[75px] text-center select-none">
                  {getMonthNameAndYear(currentMonth).split(' ')[0]}
                </span>
                <button
                  onClick={() => onChangeMonth(getNextMonth(currentMonth))}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-95"
                  title="Próximo mês"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* 3 Quick Clean Badges with Harmonious Icons */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3.5 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp size={15} />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider">Entradas</span>
              <span className="font-extrabold text-emerald-400 text-xs sm:text-base">
                {hideBalance ? '••••••' : `+ ${formatCurrency(totals.totalIncome)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown size={15} />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider">Saídas</span>
              <span className="font-extrabold text-rose-400 text-xs sm:text-base">
                {hideBalance ? '••••••' : `- ${formatCurrency(totals.totalExpense)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 flex items-center justify-center shrink-0">
              <Scale size={15} />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider">Saldo Líquido</span>
              <span className={`font-extrabold text-xs sm:text-base ${totals.net >= 0 ? 'text-slate-100' : 'text-rose-400'}`}>
                {hideBalance ? '••••••' : (totals.net >= 0 ? `+ ${formatCurrency(totals.net)}` : `- ${formatCurrency(Math.abs(totals.net))}`)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-3xl p-5 sm:p-6 border border-slate-800/80 shadow-md">
        
        {/* Legend */}
        <div className="flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 inline-block" />
              <span className="text-slate-300 font-medium">Entradas (Receitas)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50 inline-block" />
              <span className="text-slate-300 font-medium">Saídas (Despesas)</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Passe o mouse sobre as colunas para ver detalhes
          </span>
        </div>

        {hasNoData ? (
          <div className="py-12 text-center">
            <p className="text-xs text-slate-400 mb-3">
              Nenhuma entrada ou saída registrada para este período.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={onOpenNewIncome}
                className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer active:scale-95"
              >
                + Entrada
              </button>
              <button
                onClick={onOpenNewExpense}
                className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer active:scale-95"
              >
                + Saída
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartStyle === 'bars' ? (
                <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatYAxis}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" name="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="expense" name="Saídas" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              ) : (
                <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatYAxis}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

      </div>

    </div>
  );
};
