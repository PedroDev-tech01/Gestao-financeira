import React, { useState } from 'react';
import {
  Compass,
  PieChart,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FinancialEducationCardProps {
  monthIncome: number;
  monthExpense: number;
  monthTransactions: Transaction[];
  hideBalance: boolean;
  onOpenInvestments?: () => void;
}

export const FinancialEducationCard: React.FC<FinancialEducationCardProps> = ({
  monthIncome,
  monthExpense,
  monthTransactions,
  hideBalance,
  onOpenInvestments,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 50-30-20 rule calculations based on category groups
  // Essential (50%): Alimentação, Moradia, Transporte, Saúde, Dívidas
  // Lifestyle / Desejos (30%): Lazer, Assinaturas, Pets, Educação, Outros
  // Investment / Poupança (20%): Investimentos & Reserva, ou sobra de caixa
  const groupTotals = React.useMemo(() => {
    let essential = 0;
    let lifestyle = 0;
    let investment = 0;

    monthTransactions.forEach(t => {
      if (t.type === 'expense') {
        const cat = t.category.toLowerCase();
        if (
          cat.includes('alimenta') ||
          cat.includes('moradia') ||
          cat.includes('transporte') ||
          cat.includes('saúde') ||
          cat.includes('farmácia') ||
          cat.includes('dívida') ||
          cat.includes('empréstimo')
        ) {
          essential += t.amount;
        } else if (cat.includes('investimento') || cat.includes('reserva')) {
          investment += t.amount;
        } else {
          lifestyle += t.amount;
        }
      }
    });

    const netSavings = Math.max(0, monthIncome - monthExpense);
    const totalSavingsAndInvest = investment + netSavings;

    const essentialPct = monthIncome > 0 ? Math.round((essential / monthIncome) * 100) : 0;
    const lifestylePct = monthIncome > 0 ? Math.round((lifestyle / monthIncome) * 100) : 0;
    const savingsPct = monthIncome > 0 ? Math.round((totalSavingsAndInvest / monthIncome) * 100) : 0;

    return {
      essential,
      lifestyle,
      investment,
      totalSavingsAndInvest,
      essentialPct,
      lifestylePct,
      savingsPct,
    };
  }, [monthTransactions, monthIncome, monthExpense]);

  // Didactic tips generator based on real numbers
  const didacticTip = React.useMemo(() => {
    if (monthIncome === 0) {
      return {
        title: 'Comece cadastrando suas Entradas',
        desc: 'Ao lançar seu salário ou faturamento, o aplicativo calcula automaticamente suas metas recomendadas de gastos essenciais (50%), estilo de vida (30%) e reserva (20%).',
        badge: 'Primeiro Passo',
        badgeColor: 'text-amber-400 bg-amber-950/50 border-amber-800/40',
        icon: Compass,
      };
    }

    if (monthExpense > monthIncome) {
      const deficit = monthExpense - monthIncome;
      return {
        title: `Atenção ao déficit de ${formatCurrency(deficit)} neste mês`,
        desc: 'Seus gastos superaram seus ganhos. Dica prática: revise os gastos de Estilo de Vida e Assinaturas para reequilibrar o caixa sem afetar necessidades essenciais.',
        badge: 'Alerta Didático',
        badgeColor: 'text-rose-400 bg-rose-950/50 border-rose-800/40',
        icon: AlertCircle,
      };
    }

    if (groupTotals.essentialPct > 65) {
      return {
        title: `Gastos Essenciais elevados (${groupTotals.essentialPct}% da renda)`,
        desc: 'O recomendado pela regra 50-30-20 é até 50%. Tente negociar contas fixas (internet, energia, parcelas) para abrir mais margem para imprevistos.',
        badge: 'Dica de Otimização',
        badgeColor: 'text-amber-400 bg-amber-950/50 border-amber-800/40',
        icon: Info,
      };
    }

    if (groupTotals.savingsPct >= 20) {
      return {
        title: 'Excelente! Você atingiu a meta de poupança (20%+)',
        desc: 'Parabéns! Sua saúde financeira este mês está no padrão ouro. Considere destinar essa sobra para sua Reserva de Emergência ou Investimentos.',
        badge: 'Saúde Ouro',
        badgeColor: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40',
        icon: CheckCircle2,
      };
    }

    return {
      title: 'Equilíbrio Financeiro em Progresso',
      desc: 'Você está no caminho certo. Acompanhe dia a dia seus pequenos gastos com PIX e Cartão para fechar o mês no azul.',
      badge: 'Progresso Constante',
      badgeColor: 'text-teal-400 bg-teal-950/50 border-teal-800/40',
      icon: TrendingUp,
    };
  }, [monthIncome, monthExpense, groupTotals]);

  const TipIcon = didacticTip.icon;

  return (
    <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 mb-6 relative overflow-hidden">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 text-teal-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <TipIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-slate-100">
                {didacticTip.title}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${didacticTip.badgeColor}`}>
                {didacticTip.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
              {didacticTip.desc}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#15171C] hover:bg-slate-800 border border-slate-800/80 px-3 py-2 rounded-full transition-all cursor-pointer shrink-0 self-start sm:self-auto active:scale-[0.98]"
        >
          <PieChart size={14} className="text-teal-400" />
          <span>{isOpen ? 'Ocultar Regra 50/30/20' : 'Ver Diagnóstico 50/30/20'}</span>
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expandable Didactic 50/30/20 Breakdown */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800/70 relative z-10 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold  text-slate-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span>Diagnóstico Didático: Para onde seu dinheiro está indo?</span>
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Baseado na metodologia clássica de finanças pessoais
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Essenciais (50%) */}
            <div className="p-3.5 bg-[#15171C]/80 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">1. Necessidades Essenciais</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                    groupTotals.essentialPct > 55
                      ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                      : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                  }`}>
                    {groupTotals.essentialPct}% <span className="text-slate-500 font-normal">/ meta 50%</span>
                  </span>
                </div>
                <div className="text-lg font-semibold text-slate-100">
                  {hideBalance ? '••••••' : formatCurrency(groupTotals.essential)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Moradia, alimentação básica, contas de luz/água, transporte e remédios.
                </p>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    groupTotals.essentialPct > 55 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, groupTotals.essentialPct)}%` }}
                />
              </div>
            </div>

            {/* 2. Estilo de Vida (30%) */}
            <div className="p-3.5 bg-[#15171C]/80 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">2. Estilo de Vida & Desejos</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                    groupTotals.lifestylePct > 35
                      ? 'text-rose-400 bg-rose-950/40 border-rose-800/40'
                      : 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40'
                  }`}>
                    {groupTotals.lifestylePct}% <span className="text-slate-500 font-normal">/ meta 30%</span>
                  </span>
                </div>
                <div className="text-lg font-semibold text-slate-100">
                  {hideBalance ? '••••••' : formatCurrency(groupTotals.lifestyle)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Lazer, restaurantes, compras pessoais, streaming e passeios.
                </p>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    groupTotals.lifestylePct > 35 ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, groupTotals.lifestylePct)}%` }}
                />
              </div>
            </div>

            {/* 3. Futuro & Reserva (20%) */}
            <div className="p-3.5 bg-[#15171C]/80 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">3. Reserva & Poupança</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                    groupTotals.savingsPct >= 20
                      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                      : 'text-teal-400 bg-teal-950/40 border-teal-800/40'
                  }`}>
                    {groupTotals.savingsPct}% <span className="text-slate-500 font-normal">/ meta 20%</span>
                  </span>
                </div>
                <div className="text-lg font-semibold text-emerald-400">
                  {hideBalance ? '••••••' : formatCurrency(groupTotals.totalSavingsAndInvest)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Dinheiro guardado no mês + investimentos destinados ao seu futuro.
                </p>
                {onOpenInvestments && (
                  <button
                    type="button"
                    onClick={onOpenInvestments}
                    className="mt-2 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver Área de Investimentos &rarr;</span>
                  </button>
                )}
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, groupTotals.savingsPct))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
