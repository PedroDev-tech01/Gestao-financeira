import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Download,
  Receipt,
  X,
  Layers,
  Info,
  Plus
} from 'lucide-react';
import { Transaction, CategoryItem, PaymentMethod } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  categories: CategoryItem[];
  hideBalance: boolean;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenExportModal?: () => void;
  onOpenNewTransaction?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; color: string }> = {
  pix: { label: 'PIX', color: 'text-teal-300 bg-teal-950/50 border-teal-800/50' },
  credit_card: { label: 'Cartão', color: 'text-purple-300 bg-purple-950/50 border-purple-800/50' },
  debit: { label: 'Débito', color: 'text-blue-300 bg-blue-950/50 border-blue-800/50' },
  cash: { label: 'Dinheiro', color: 'text-amber-300 bg-amber-950/50 border-amber-800/50' },
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  hideBalance,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
  onOpenExportModal,
  onOpenNewTransaction,
  searchQuery,
  onSearchQueryChange,
}) => {
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'pending' | 'essential' | 'lifestyle'>('all');

  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    onSearchQueryChange?.(val);
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryItem>();
    categories.forEach(c => map.set(c.name, c));
    return map;
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type and status filters
      if (typeFilter === 'income' && t.type !== 'income') return false;
      if (typeFilter === 'expense' && t.type !== 'expense') return false;
      if (typeFilter === 'pending' && t.status !== 'pending') return false;

      if (typeFilter === 'essential') {
        const cat = categoryMap.get(t.category);
        if (t.type !== 'expense' || cat?.categoryGroup !== 'essential') return false;
      }

      if (typeFilter === 'lifestyle') {
        const cat = categoryMap.get(t.category);
        if (t.type !== 'expense' || cat?.categoryGroup !== 'lifestyle') return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesCat = t.category.toLowerCase().includes(query);
        const matchesNotes = (t.notes || '').toLowerCase().includes(query);
        if (!matchesDesc && !matchesCat && !matchesNotes) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, typeFilter, searchTerm]);

  return (
    <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-3xl p-4 sm:p-6 border border-slate-800/80 shadow-md">
      
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Receipt size={18} className="text-emerald-400" />
            <span>Extrato & Lançamentos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'registro encontrado' : 'registros encontrados'} neste mês
          </p>
        </div>

        {onOpenExportModal && (
          <button
            id="btn-export-from-ledger"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#0A0D14] hover:bg-slate-800 border border-slate-800/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer self-start sm:self-auto shadow-xs active:scale-[0.98]"
            title="Exportar dados deste mês em PDF ou CSV"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Exportar Relatório</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-transactions"
            type="text"
            placeholder="Buscar por nome, mercado, farmácia, categoria..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-[#0A0D14] border border-slate-800/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="Limpar busca"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#0A0D14] p-1 rounded-xl border border-slate-800/80 shrink-0 overflow-x-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'income'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 shadow-xs'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'expense'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50 shadow-xs'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setTypeFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'pending'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50 shadow-xs'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setTypeFilter('essential')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'essential'
                ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50 shadow-xs'
                : 'text-slate-400 hover:text-blue-400'
            }`}
          >
            📌 Essenciais (50%)
          </button>
          <button
            onClick={() => setTypeFilter('lifestyle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'lifestyle'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50 shadow-xs'
                : 'text-slate-400 hover:text-purple-400'
            }`}
          >
            ✨ Estilo de Vida (30%)
          </button>
        </div>
      </div>

      {/* Helpful Eye-Friendly Micro-Tip */}
      {filteredTransactions.length > 0 && (
        <div className="mt-3 px-3 py-1.5 rounded-xl bg-[#0A0D14]/60 border border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
          <Info size={13} className="text-emerald-400 shrink-0" />
          <span>
            <strong>Dica de uso:</strong> Toque no selo <span className="text-emerald-400 font-bold">Pago</span> ou <span className="text-amber-400 font-bold">A Pagar</span> para alternar o status do lançamento com 1 clique.
          </span>
        </div>
      )}

      {/* Transactions List */}
      <div className="mt-3 divide-y divide-slate-800/40">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
              <Receipt size={22} />
            </div>
            <p className="text-sm font-bold text-slate-200">Nenhum lançamento encontrado</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              {searchTerm
                ? 'Nenhum resultado corresponde à sua busca. Tente buscar por outro termo ou limpe o filtro.'
                : 'Você ainda não registrou receitas ou despesas neste mês. Clique no botão abaixo para começar!'}
            </p>
            {onOpenNewTransaction && !searchTerm && (
              <button
                onClick={onOpenNewTransaction}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Plus size={14} />
                <span>Adicionar Primeiro Lançamento</span>
              </button>
            )}
          </div>
        ) : (
          filteredTransactions.map(t => {
            const cat = categoryMap.get(t.category);
            const isIncome = t.type === 'income';
            const payInfo = t.paymentMethod ? PAYMENT_LABELS[t.paymentMethod] : null;

            return (
              <div
                key={t.id}
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-[#161F30]/50 px-2 sm:px-3 rounded-2xl transition-all duration-150"
              >
                {/* Left: Category Icon & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 border border-slate-700/60 shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: cat ? cat.color : '#334155' }}
                  >
                    <CategoryIcon iconName={cat ? cat.icon : 'Layers'} size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                        {t.description}
                      </span>

                      {/* Installment Badge if purchase is installment */}
                      {t.installmentInfo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 flex items-center gap-1 shadow-xs">
                          <Layers size={10} className="text-indigo-400" />
                          <span>Parcela {t.installmentInfo.current}/{t.installmentInfo.total}</span>
                        </span>
                      )}

                      {/* Payment method badge */}
                      {payInfo && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${payInfo.color}`}>
                          {payInfo.label}
                        </span>
                      )}

                      {/* Status Toggle Badge */}
                      <button
                        onClick={() => onToggleStatus(t.id)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-all border active:scale-95 min-h-[26px] ${
                          t.status === 'paid'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60 shadow-xs'
                            : 'bg-amber-950/60 text-amber-300 border-amber-500/30 hover:bg-amber-900/60 shadow-xs'
                        }`}
                        title="Clique para alternar entre Pago e A Pagar"
                      >
                        {t.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        <span>{t.status === 'paid' ? (isIncome ? 'Recebido' : 'Pago') : 'A Pagar'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 flex-wrap">
                      <span>{formatDateBR(t.date)}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-medium">{t.category}</span>
                      {cat?.categoryGroup && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          cat.categoryGroup === 'essential'
                            ? 'text-blue-400 bg-blue-950/40 border-blue-800/40'
                            : (cat.categoryGroup === 'investment'
                                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                                : (cat.categoryGroup === 'revenue' ? 'text-teal-400 bg-teal-950/40 border-teal-800/40' : 'text-purple-400 bg-purple-950/40 border-purple-800/40'))
                        }`}>
                          {cat.categoryGroup === 'essential' ? 'Essencial (50%)' : (cat.categoryGroup === 'investment' ? 'Reserva (20%)' : (cat.categoryGroup === 'revenue' ? 'Receita' : 'Estilo de Vida (30%)'))}
                        </span>
                      )}
                      {t.notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 italic truncate max-w-[150px] sm:max-w-[220px]">
                            {t.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Action Buttons */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm sm:text-base font-black tracking-tight ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {hideBalance ? '••••••' : (isIncome ? `+ ${formatCurrency(t.amount)}` : `- ${formatCurrency(t.amount)}`)}
                    </span>
                  </div>

                  {/* Actions - visible and comfortable to tap on mobile and desktop */}
                  <div className="flex items-center gap-0.5 sm:gap-1 opacity-90 sm:opacity-75 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditTransaction(t)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer active:scale-90 min-h-[34px] min-w-[34px] flex items-center justify-center"
                      title="Editar lançamento"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(t.id)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer active:scale-90 min-h-[34px] min-w-[34px] flex items-center justify-center"
                      title="Excluir lançamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
