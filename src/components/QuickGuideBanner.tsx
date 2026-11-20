import React, { useState } from 'react';
import {
  HelpCircle,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface QuickGuideBannerProps {
  onOpenNewIncome: () => void;
  onOpenNewExpense: () => void;
  onOpenDebtsTab: () => void;
  onOpenInvestmentsTab?: () => void;
  /** Se o usuário já tem lançamentos, o guia começa fechado (a menos que ele tenha aberto antes). */
  hasData?: boolean;
}

export const QuickGuideBanner: React.FC<QuickGuideBannerProps> = ({
  onOpenNewIncome,
  onOpenNewExpense,
  onOpenDebtsTab,
  onOpenInvestmentsTab,
  hasData = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('aquigastos_show_guide');
    if (saved === 'true') return true;
    if (saved === 'false') return false;
    return !hasData;
  });

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    localStorage.setItem('aquigastos_show_guide', String(nextState));
  };

  return (
    <div className="mb-6 rounded-3xl bg-gradient-to-b from-[#141B29] to-[#0F1420] border border-slate-800/80 shadow-md overflow-hidden transition-all duration-300">
      {/* Header bar of the guide */}
      <div 
        onClick={handleToggle}
        className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-100">
                Como usar o AquiGastos?
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                Guia Rápido & Fácil
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Tudo o que você precisa saber para controlar seu dinheiro sem complicação
            </p>
          </div>
        </div>

        <button
          type="button"
          className="shrink-0 flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-[#0A0D14] border border-slate-800/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          aria-expanded={isOpen}
        >
          <span>{isOpen ? 'Ocultar' : 'Ver guia'}</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expandable Content with 4 Visual Steps */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-800/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3">
            
            {/* Step 1: Entradas & Saídas */}
            <div className="bg-[#0A0D14]/80 rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/30">
                    Passo 1
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 mb-1">
                  1. Anote Ganhos & Gastos
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cadastre seu salário, rendas extras ou despesas diárias (mercado, farmácia, transporte) com 1 toque.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenNewIncome}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Receita</span>
                </button>
                <span className="text-slate-600 text-xs">•</span>
                <button
                  type="button"
                  onClick={onOpenNewExpense}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Despesa</span>
                </button>
              </div>
            </div>

            {/* Step 2: Parcelamento Automático */}
            <div className="bg-[#0A0D14]/80 rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between hover:border-purple-500/30 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <CreditCard size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-800/30">
                    Passo 2
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 mb-1">
                  2. Parcelas no Cartão
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ao escolher <strong className="text-purple-300">Cartão</strong>, ative <strong className="text-purple-300">Compra Parcelada</strong>. O app divide e lança nos meses seguintes de forma automática.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center text-[10px] text-slate-500 font-medium">
                <span>Identificado com selo Parcela 1/X</span>
              </div>
            </div>

            {/* Step 3: Dívidas do Momento */}
            <div className="bg-[#0A0D14]/80 rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Building2 size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/30">
                    Passo 3
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 mb-1">
                  3. Dívidas & Empréstimos
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Dívidas que não são de cartão (bancos, parentes, fiado) ficam na aba <strong className="text-amber-300">Dívidas</strong> para você abater aos poucos.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={onOpenDebtsTab}
                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir Dívidas</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>

            {/* Step 4: Investimentos & Reserva */}
            <div className="bg-[#0A0D14]/80 rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between hover:border-teal-500/30 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-800/30">
                    Passo 4
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 mb-1">
                  4. Investimentos & Reserva
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Acompanhe seu dinheiro aplicado na <strong className="text-teal-300">Reserva de Emergência</strong>, CDBs, Tesouro e Ações com cálculo de rendimento.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                {onOpenInvestmentsTab ? (
                  <button
                    type="button"
                    onClick={onOpenInvestmentsTab}
                    className="text-[10px] font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Abrir Investimentos</span>
                    <ArrowRight size={11} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] text-teal-400 font-medium">
                    <CheckCircle2 size={12} />
                    <span>Seu patrimônio crescendo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Automatic Saving Reassurance Banner */}
            <div className="col-span-full p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 flex items-start sm:items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 mt-1 sm:mt-0" />
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="font-bold text-emerald-300">Salvamento automático:</strong>{' '}
                tudo o que você cadastra, edita ou exclui é salvo na hora, sem precisar apertar nenhum botão.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
