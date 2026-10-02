import React, { useState } from 'react';
import {
  Building2,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  TrendingDown,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { DebtItem } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';

interface DebtsAreaProps {
  debts: DebtItem[];
  onOpenNewDebt: () => void;
  onEditDebt: (debt: DebtItem) => void;
  onDeleteDebt: (debtId: string) => void;
  onOpenPayDebt: (debt: DebtItem) => void;
  hideBalance: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const DebtsArea: React.FC<DebtsAreaProps> = ({
  debts,
  onOpenNewDebt,
  onEditDebt,
  onDeleteDebt,
  onOpenPayDebt,
  hideBalance,
  searchQuery = '',
  onClearSearch,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'paid'>('active');

  const activeDebts = debts.filter(d => d.status === 'active' && (d.totalAmount - d.paidAmount) > 0);
  const paidDebts = debts.filter(d => d.status === 'paid' || (d.totalAmount - d.paidAmount) <= 0);

  const displayedDebts = React.useMemo(() => {
    let base = filter === 'all' 
      ? debts 
      : (filter === 'active' ? activeDebts : paidDebts);

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      base = base.filter(d =>
        d.title.toLowerCase().includes(q) ||
        (d.creditor && d.creditor.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q))
      );
    }
    return base;
  }, [debts, filter, searchQuery, activeDebts, paidDebts]);

  const totalRemaining = activeDebts.reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0);
  const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Cards with Harmonious Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* 1. TOTAL DEVEDOR NO MOMENTO */}
        <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-900/40 hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
          
          <div className="flex items-center justify-between mb-2.5 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
              Total a Pagar no Momento
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight relative z-10 truncate">
            {hideBalance ? '••••••' : formatCurrency(totalRemaining)}
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-medium relative z-10">
            <TrendingDown size={13} className="text-amber-400 shrink-0" />
            <span>Soma de todas as pendências em aberto</span>
          </p>
        </div>

        {/* 2. TOTAL JÁ PAGO / AMORTIZADO */}
        <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-800/80 hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

          <div className="flex items-center justify-between mb-2.5 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
              Total Já Quitado
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight relative z-10 truncate">
            {hideBalance ? '••••••' : formatCurrency(totalPaid)}
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-medium relative z-10">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>Valores que você já abateu e quitou</span>
          </p>
        </div>

        {/* 3. AÇÃO RÁPIDA DE CADASTRO */}
        <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-800/80 flex flex-col justify-between shadow-md">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
              Controle de Compromissos
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeDebts.length} {activeDebts.length === 1 ? 'dívida ativa cadastrada' : 'dívidas ativas cadastradas'}
              {paidDebts.length > 0 && ` • ${paidDebts.length} quitadas`}
            </p>
          </div>

          <button
            onClick={onOpenNewDebt}
            className="mt-3.5 w-full py-2.5 px-3.5 bg-amber-600 hover:bg-amber-500 active:scale-[0.98] font-bold text-xs text-white rounded-xl shadow-md shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={15} />
            <span>Adicionar Dívida ou Empréstimo</span>
          </button>
        </div>

      </div>

      {/* Helpful Friendly Explanatory Note with Clear Context */}
      <div className="bg-gradient-to-r from-[#131A29] to-[#0E131F] rounded-2xl p-4 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 size={18} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Como funciona esta área de Dívidas?</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Cadastre compromissos fora do cartão (empréstimos, carnês, acordos, dívida com familiares ou compras fiadas). Conforme você paga, clique em <strong>Abater Valor</strong> para registrar o pagamento e reduzir o saldo devedor.
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 bg-[#0A0D14] p-1 rounded-xl border border-slate-800/80 shrink-0 self-end sm:self-center">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'active'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Em Aberto ({activeDebts.length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'paid'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 shadow-xs'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Quitadas ({paidDebts.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({debts.length})
          </button>
        </div>
      </div>

      {/* Search Filter Indicator Banner */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between p-3.5 bg-amber-950/40 border border-amber-800/40 rounded-2xl text-xs text-amber-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>
              Filtrando dívidas por: <strong className="text-white font-semibold">"{searchQuery}"</strong> ({displayedDebts.length} {displayedDebts.length === 1 ? 'encontrada' : 'encontradas'})
            </span>
          </div>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="text-xs text-amber-300 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Limpar busca
            </button>
          )}
        </div>
      )}

      {/* Debts List */}
      {displayedDebts.length === 0 ? (
        <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-3xl p-8 border border-slate-800/80 text-center shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-700/50 shadow-xs">
            <Building2 size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-100 mb-1">
            {filter === 'paid' ? 'Nenhuma dívida quitada arquivada' : 'Nenhuma dívida cadastrada no momento'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
            {filter === 'paid' 
              ? 'Conforme você for abatendo e quitando suas dívidas ativas, elas ficarão guardadas aqui para seu histórico.' 
              : 'Se você tem algum empréstimo, carnê ou compra parcelada fora do cartão, adicione aqui para acompanhar o saldo devedor até quitar tudo com tranquilidade.'}
          </p>
          {filter !== 'paid' && (
            <button
              onClick={onOpenNewDebt}
              className="px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer active:scale-[0.98]"
            >
              + Adicionar Minha Primeira Dívida
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedDebts.map((debt) => {
            const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
            const isFullyPaid = remaining <= 0 || debt.status === 'paid';
            const progressPercent = debt.totalAmount > 0 
              ? Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100)) 
              : 100;

            return (
              <div
                key={debt.id}
                className={`bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-3xl p-5 border transition-all duration-200 shadow-md flex flex-col justify-between hover:-translate-y-0.5 ${
                  isFullyPaid 
                    ? 'border-emerald-800/40' 
                    : 'border-slate-800/80 hover:border-amber-500/40'
                }`}
              >
                <div>
                  
                  {/* Card Header: Title, Creditor & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-100">
                          {debt.title}
                        </h3>
                        {isFullyPaid ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 flex items-center gap-1 shadow-xs">
                            <CheckCircle2 size={10} />
                            <span>Quitada 🎉</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/50 flex items-center gap-1 shadow-xs">
                            <Clock size={10} />
                            <span>Em Aberto</span>
                          </span>
                        )}
                      </div>

                      {debt.creditor && (
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Credor / Destino: <span className="text-slate-300 font-semibold">{debt.creditor}</span>
                        </p>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditDebt(debt)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar dívida"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteDebt(debt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Excluir dívida"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Financial Values Display */}
                  <div className="grid grid-cols-2 gap-2 p-3.5 bg-[#0A0D14] rounded-2xl border border-slate-800/80 mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Falta Pagar
                      </span>
                      <span className={`text-lg font-black ${isFullyPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {hideBalance ? '••••••' : formatCurrency(remaining)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Valor Total Original
                      </span>
                      <span className="text-sm font-bold text-slate-300">
                        {hideBalance ? '••••••' : formatCurrency(debt.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Progresso de Quitação:</span>
                      <span className="font-bold text-emerald-400">
                        {progressPercent}% pago ({formatCurrency(debt.paidAmount)})
                      </span>
                    </div>
                    <div className="w-full bg-[#0A0D14] h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isFullyPaid ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Due Date & Notes */}
                  {(debt.dueDate || debt.notes) && (
                    <div className="text-xs text-slate-400 space-y-1 pt-1.5 border-t border-slate-800/60 mb-3">
                      {debt.dueDate && (
                        <p className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-amber-400 shrink-0" />
                          <span>Vencimento / Prazo: <strong className="text-slate-200">{formatDateBR(debt.dueDate)}</strong></span>
                        </p>
                      )}
                      {debt.notes && (
                        <p className="text-[11px] text-slate-400 italic">
                          "{debt.notes}"
                        </p>
                      )}
                    </div>
                  )}

                </div>

                {/* Card Action Button */}
                {!isFullyPaid ? (
                  <button
                    onClick={() => onOpenPayDebt(debt)}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <DollarSign size={14} />
                    <span>Abater / Pagar Valor Desta Dívida</span>
                  </button>
                ) : (
                  <div className="py-2.5 text-center text-xs font-bold text-emerald-400 bg-emerald-950/30 rounded-xl border border-emerald-800/30 mt-2 flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>Dívida Totalmente Paga! Parabéns!</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
