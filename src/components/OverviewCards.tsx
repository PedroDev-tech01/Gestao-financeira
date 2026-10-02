import React from 'react';
import {
  Wallet,
  Plus,
  Minus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface OverviewCardsProps {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  netBalance: number;
  hideBalance: boolean;
  pendingIncome?: number;
  pendingExpense?: number;
  onOpenNewExpense: () => void;
  onOpenNewIncome: () => void;
  onOpenCharts?: () => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  totalBalance,
  monthIncome,
  monthExpense,
  netBalance,
  hideBalance,
  pendingIncome = 0,
  pendingExpense = 0,
  onOpenNewExpense,
  onOpenNewIncome,
  onOpenCharts,
}) => {
  const expenseRatio = monthIncome > 0 ? Math.min(100, Math.round((monthExpense / monthIncome) * 100)) : (monthExpense > 0 ? 100 : 0);
  const isPositive = netBalance >= 0;

  // Visual label for expense ratio
  const ratioStatus = expenseRatio <= 60 
    ? { text: 'Excelente Margem', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40', icon: CheckCircle2 }
    : (expenseRatio <= 80 
        ? { text: 'Atenção Moderada', color: 'text-amber-400 bg-amber-950/60 border-amber-800/40', icon: AlertTriangle }
        : { text: 'Gastos Elevados', color: 'text-rose-400 bg-rose-950/60 border-rose-800/40', icon: AlertTriangle });

  const StatusIcon = ratioStatus.icon;

  return (
    <div className="space-y-4 mb-6">
      
      {/* 3 Core Overview Cards with Premium Finishing and Ambient Backlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        
        {/* 1. ENTRADAS */}
        <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-800/80 hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 shadow-md group relative overflow-hidden flex flex-col justify-between">
          {/* Soft ambient backlight glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
          
          <div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-xs">
                  <ArrowUpRight size={17} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Ganhos do Mês
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Salários, comissões e extras
                  </span>
                </div>
              </div>

              <button
                id="overview-btn-income"
                onClick={onOpenNewIncome}
                className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
                title="Adicionar nova receita ou salário"
              >
                <Plus size={13} />
                <span>Receita</span>
              </button>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight relative z-10 truncate">
              {hideBalance ? '••••••' : `+ ${formatCurrency(monthIncome)}`}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-400 shrink-0" />
              <span>Recebido em conta</span>
            </span>
            {pendingIncome > 0 && !hideBalance && (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Clock size={11} />
                <span>+ {formatCurrency(pendingIncome)} a receber</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. SAÍDAS */}
        <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-800/80 hover:border-rose-500/40 hover:-translate-y-0.5 transition-all duration-200 shadow-md group relative overflow-hidden flex flex-col justify-between">
          {/* Soft ambient backlight glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />

          <div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-xs">
                  <ArrowDownRight size={17} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Gastos do Mês
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Fixos, variáveis e faturas
                  </span>
                </div>
              </div>

              <button
                id="overview-btn-expense"
                onClick={onOpenNewExpense}
                className="text-xs font-bold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
                title="Adicionar nova despesa ou compra"
              >
                <Minus size={13} />
                <span>Despesa</span>
              </button>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight relative z-10 truncate">
              {hideBalance ? '••••••' : `- ${formatCurrency(monthExpense)}`}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span className="flex items-center gap-1">
              <TrendingDown size={12} className="text-rose-400 shrink-0" />
              <span>Já pago / debitado</span>
            </span>
            {pendingExpense > 0 && !hideBalance && (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Clock size={11} />
                <span>{formatCurrency(pendingExpense)} pendente</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. SALDO / RESULTADO DO MÊS */}
        <div className={`bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border hover:-translate-y-0.5 transition-all duration-200 shadow-md relative overflow-hidden flex flex-col justify-between ${
          isPositive ? 'border-slate-800/80 hover:border-emerald-500/40' : 'border-rose-900/40 hover:border-rose-500/40'
        }`}>
          {/* Ambient backlight */}
          <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 ${
            isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          }`} />

          <div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-xs ${
                  isPositive
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  <Wallet size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Saldo Livre
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Resultado líquido do mês
                  </span>
                </div>
              </div>

              {onOpenCharts && (
                <button
                  onClick={onOpenCharts}
                  className="text-xs font-bold text-slate-300 hover:text-white bg-[#0A0D14] hover:bg-slate-800 border border-slate-800/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                  title="Ver Gráficos comparativos"
                >
                  <BarChart3 size={13} className="text-emerald-400" />
                  <span>Gráficos</span>
                </button>
              )}
            </div>

            <div className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 truncate ${
              isPositive ? 'text-slate-100' : 'text-rose-400'
            }`}>
              {hideBalance
                ? '••••••'
                : (isPositive ? `+ ${formatCurrency(netBalance)}` : `- ${formatCurrency(Math.abs(netBalance))}`)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span>
              {isPositive 
                ? 'Sobra disponível para poupar' 
                : 'Déficit (gastos superaram ganhos)'}
            </span>
            <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? 'No Azul' : 'Atenção'}
            </span>
          </div>
        </div>

      </div>

      {/* Financial Health / Expense Ratio Bar with Eye-Friendly Status */}
      {monthIncome > 0 && (
        <div className="bg-gradient-to-r from-[#131A29] to-[#0E131F] rounded-2xl px-5 py-3.5 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <Percent size={14} className="text-emerald-400" />
              <span>Comprometimento das Receitas:</span>
              <span className={`font-black ${expenseRatio > 80 ? 'text-rose-400' : (expenseRatio > 60 ? 'text-amber-400' : 'text-emerald-400')}`}>
                {expenseRatio}%
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${ratioStatus.color}`}>
              <StatusIcon size={10} />
              <span>{ratioStatus.text}</span>
            </span>
          </div>

          <div className="w-full sm:w-64 bg-[#0A0D14] h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                expenseRatio > 80 ? 'bg-rose-500' : (expenseRatio > 60 ? 'bg-amber-500' : 'bg-emerald-500')
              }`}
              style={{ width: `${Math.min(100, Math.max(0, expenseRatio))}%` }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
