import React, { useState, useMemo, useEffect, useDeferredValue, useRef } from 'react';
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
  Plus,
  TrendingDown,
  TrendingUp,
  Sparkles,
  FilterX
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
  onClearAllTransactions?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; color: string }> = {
  pix: { label: 'PIX', color: 'text-teal-300 bg-teal-950/50 border-teal-800/50' },
  credit_card: { label: 'Cartão', color: 'text-purple-300 bg-purple-950/50 border-purple-800/50' },
  debit: { label: 'Débito', color: 'text-blue-300 bg-blue-950/50 border-blue-800/50' },
  cash: { label: 'Dinheiro', color: 'text-amber-300 bg-amber-950/50 border-amber-800/50' },
};

// Fast accent-folded & diacritic-insensitive normalization
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Visual match highlighter for instant feedback
const HighlightMatch: React.FC<{ text: string; query: string; className?: string }> = React.memo(
  ({ text, query, className }) => {
    if (!query.trim() || !text) {
      return <span className={className}>{text}</span>;
    }

    const normQuery = normalizeText(query);
    const normText = normalizeText(text);

    // If query has multiple tokens, highlight the first matching token
    const tokens = normQuery.split(/\s+/).filter(t => t.length > 0);
    let bestIdx = -1;
    let bestTokenLen = 0;

    for (const token of tokens) {
      const idx = normText.indexOf(token);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        bestTokenLen = token.length;
      }
    }

    if (bestIdx === -1) {
      return <span className={className}>{text}</span>;
    }

    const start = bestIdx;
    const end = Math.min(text.length, bestIdx + bestTokenLen);
    const before = text.slice(0, start);
    const match = text.slice(start, end);
    const after = text.slice(end);

    return (
      <span className={className}>
        {before}
        <mark className="bg-emerald-500/30 text-emerald-300 font-bold px-0.5 rounded transition-colors">
          {match}
        </mark>
        {after}
      </span>
    );
  }
);

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  hideBalance,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
  onOpenExportModal,
  onOpenNewTransaction,
  onClearAllTransactions,
  searchQuery,
  onSearchQueryChange,
}) => {
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // useDeferredValue ensures typing remains 100% fluid at 60fps
  // while filtering runs concurrently without blocking the UI thread
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'pending' | 'essential' | 'lifestyle'>('all');

  // Sync with external searchQuery prop if provided
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== searchTerm) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  // Debounce the notification to parent App (150ms) to avoid re-rendering entire dashboard on every keypress
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchQueryChange && searchTerm !== searchQuery) {
        onSearchQueryChange(searchTerm);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchQueryChange]);

  // Keyboard shortcut: '/' or 'Ctrl+F' to focus, 'Esc' to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchTerm('');
        searchInputRef.current?.blur();
      } else if (
        (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f')) &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryItem>();
    categories.forEach(c => map.set(c.name, c));
    return map;
  }, [categories]);

  // Pre-indexed searchable representation per transaction (computed once per transactions array change)
  const indexedTransactions = useMemo(() => {
    return transactions.map(t => {
      const payLabel = t.paymentMethod ? (PAYMENT_LABELS[t.paymentMethod]?.label || '') : '';
      const statusLabel = t.status === 'paid' ? (t.type === 'income' ? 'recebido pago' : 'pago') : 'a pagar pendente';
      const amountRaw = String(t.amount);
      const amountFormatted = formatCurrency(t.amount);
      const installmentStr = t.installmentInfo ? `parcela ${t.installmentInfo.current}/${t.installmentInfo.total} parcelado` : '';
      const dateParts = t.date ? `${t.date} ${formatDateBR(t.date)}` : '';
      
      const combined = `${t.description} ${t.category} ${t.notes || ''} ${payLabel} ${t.paymentMethod || ''} ${statusLabel} ${amountRaw} ${amountFormatted} ${dateParts} ${installmentStr}`;
      
      return {
        item: t,
        normalizedSearch: normalizeText(combined),
      };
    });
  }, [transactions]);

  // Filtered transactions using deferredSearchTerm for 60fps instant response
  const filteredTransactions = useMemo(() => {
    const rawQuery = deferredSearchTerm.trim();
    const queryTokens = rawQuery ? normalizeText(rawQuery).split(/\s+/).filter(Boolean) : [];

    return indexedTransactions
      .filter(({ item: t, normalizedSearch }) => {
        // Type and category group filters
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

        // Multi-token instant matching
        if (queryTokens.length > 0) {
          for (let i = 0; i < queryTokens.length; i++) {
            if (!normalizedSearch.includes(queryTokens[i])) {
              return false;
            }
          }
        }

        return true;
      })
      .map(entry => entry.item)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [indexedTransactions, typeFilter, deferredSearchTerm, categoryMap]);

  // Dynamic totals for currently filtered results
  const searchTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (let i = 0; i < filteredTransactions.length; i++) {
      const t = filteredTransactions[i];
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    }
    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const isSearchActive = Boolean(searchTerm.trim());

  // Quick suggestions for one-tap filtering
  const quickSearchTags = ['PIX', 'Cartão', 'Supermercado', 'Farmácia', 'Combustível', 'Restaurante'];

  return (
    <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-3xl p-4 sm:p-6 border border-slate-800/80 shadow-md transition-all">
      
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Receipt size={18} className="text-emerald-400" />
            <span>Extrato & Lançamentos</span>
            {isSearchActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 animate-in fade-in duration-200">
                Busca ativa
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>
              Mostrando <strong className="text-emerald-400 font-bold">{filteredTransactions.length}</strong> de {transactions.length} {transactions.length === 1 ? 'registro' : 'registros'}
            </span>
            {isSearchActive && (
              <span className="text-slate-500">
                (filtrado por &ldquo;<span className="text-slate-300 font-medium">{searchTerm}</span>&rdquo;)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onClearAllTransactions && transactions.length > 0 && (
            <button
              id="btn-clear-account-txs"
              onClick={onClearAllTransactions}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-[#0A0D14] hover:bg-rose-950/40 border border-slate-800/80 hover:border-rose-800/50 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              title="Apagar todos os lançamentos desta conta atual"
            >
              <Trash2 size={13} />
              <span>Limpar desta Conta</span>
            </button>
          )}

          {onOpenExportModal && (
            <button
              id="btn-export-from-ledger"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#0A0D14] hover:bg-slate-800 border border-slate-800/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              title="Exportar dados deste mês em PDF ou CSV"
            >
              <Download size={14} className="text-emerald-400" />
              <span>Exportar Relatório</span>
            </button>
          )}
        </div>
      </div>

      {/* Instant Search Bar & Filter Options */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4">
        
        {/* Instant Search Input */}
        <div className="relative flex-1 group">
          <Search
            size={14}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              isSearchActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'
            }`}
          />
          <input
            ref={searchInputRef}
            id="search-transactions"
            type="text"
            placeholder="Busca instantânea: nome, valor, PIX, farmácia, data... (Atalho: /)"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-14 py-2.5 text-xs bg-[#0A0D14] border border-slate-800/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearchActive ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Limpar busca (Esc)"
              >
                <X size={13} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Filter Pills - Responsive Flex Wrap */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0A0D14] p-1.5 rounded-2xl border border-slate-800/80 w-full lg:w-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === 'income'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 shadow-xs'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === 'expense'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50 shadow-xs'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setTypeFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === 'pending'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50 shadow-xs'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setTypeFilter('essential')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === 'essential'
                ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50 shadow-xs'
                : 'text-slate-400 hover:text-blue-400'
            }`}
          >
            📌 Essenciais (50%)
          </button>
          <button
            onClick={() => setTypeFilter('lifestyle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === 'lifestyle'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50 shadow-xs'
                : 'text-slate-400 hover:text-purple-400'
            }`}
          >
            ✨ Estilo de Vida (30%)
          </button>
        </div>
      </div>

      {/* Quick Search Tag Suggestions */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
          <Sparkles size={11} className="text-emerald-400/80" />
          <span>Filtros rápidos:</span>
        </span>
        {quickSearchTags.map(tag => {
          const isSelected = searchTerm.toLowerCase() === tag.toLowerCase();
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleSearchChange(isSelected ? '' : tag)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 font-bold shadow-xs'
                  : 'bg-[#0A0D14]/70 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              {tag}
            </button>
          );
        })}
        {isSearchActive && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <FilterX size={11} />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Live Financial Totals for Filtered Results */}
      {isSearchActive && filteredTransactions.length > 0 && (
        <div className="mt-3 p-3 rounded-2xl bg-[#0A0D14] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Subtotal da busca:</span>
            <span className="font-bold text-slate-200">{filteredTransactions.length} resultado(s)</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {searchTotals.income > 0 && (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <TrendingUp size={13} />
                <span>+ {formatCurrency(searchTotals.income)}</span>
              </span>
            )}
            {searchTotals.expense > 0 && (
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <TrendingDown size={13} />
                <span>- {formatCurrency(searchTotals.expense)}</span>
              </span>
            )}
            <div className="h-3 w-px bg-slate-800 hidden sm:block" />
            <span className="font-bold text-slate-300">
              Saldo: <strong className={searchTotals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(searchTotals.balance)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Helpful Eye-Friendly Micro-Tip */}
      {filteredTransactions.length > 0 && !isSearchActive && (
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
          <div className="py-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
              {isSearchActive ? <Search size={22} className="text-amber-400" /> : <Receipt size={22} />}
            </div>
            <p className="text-sm font-bold text-slate-200">
              {isSearchActive ? `Nenhum lançamento para "${searchTerm}"` : 'Nenhum lançamento encontrado'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              {isSearchActive
                ? 'Tente buscar por outro termo, valor ou forma de pagamento (PIX, Cartão...), ou limpe o filtro.'
                : 'Você ainda não registrou receitas ou despesas neste mês. Clique no botão abaixo para começar!'}
            </p>
            
            {isSearchActive ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <X size={14} className="text-rose-400" />
                <span>Limpar busca (Esc)</span>
              </button>
            ) : (
              onOpenNewTransaction && (
                <button
                  onClick={onOpenNewTransaction}
                  className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Plus size={14} />
                  <span>Adicionar Primeiro Lançamento</span>
                </button>
              )
            )}
          </div>
        ) : (
          filteredTransactions.map(t => {
            const cat = categoryMap.get(t.category);
            const isIncome = t.type === 'income';
            const payInfo = t.paymentMethod ? PAYMENT_LABELS[t.paymentMethod] : null;

            const statusButton = (extra: string) => (
              <button
                onClick={() => onToggleStatus(t.id)}
                className={`${extra} text-[10px] font-semibold px-2 py-1 rounded-md items-center gap-1 cursor-pointer transition-all border active:scale-95 min-h-[26px] shrink-0 ${
                  t.status === 'paid'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/30 hover:bg-amber-900/60'
                }`}
                title="Toque para alternar entre Pago e A Pagar"
              >
                {t.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                <span>{t.status === 'paid' ? (isIncome ? 'Recebido' : 'Pago') : 'A Pagar'}</span>
              </button>
            );

            const groupBadge = cat?.categoryGroup ? (
              <span className={`hidden md:inline text-[10px] font-semibold px-1.5 py-px rounded border ${
                cat.categoryGroup === 'essential'
                  ? 'text-blue-400 bg-blue-950/40 border-blue-800/40'
                  : (cat.categoryGroup === 'investment'
                      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                      : (cat.categoryGroup === 'revenue' ? 'text-teal-400 bg-teal-950/40 border-teal-800/40' : 'text-purple-400 bg-purple-950/40 border-purple-800/40'))
              }`}>
                {cat.categoryGroup === 'essential' ? 'Essencial (50%)' : (cat.categoryGroup === 'investment' ? 'Reserva (20%)' : (cat.categoryGroup === 'revenue' ? 'Receita' : 'Estilo de Vida (30%)'))}
              </span>
            ) : null;

            return (
              <div
                key={t.id}
                className="py-3 sm:py-3.5 flex items-center gap-3 group hover:bg-[#161F30]/50 px-1.5 sm:px-3 rounded-2xl transition-colors duration-150"
              >
                {/* Ícone da categoria */}
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 border border-white/10 shadow-xs"
                  style={{ backgroundColor: cat ? cat.color : '#334155' }}
                >
                  <CategoryIcon iconName={cat ? cat.icon : 'Layers'} size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Linha 1: descrição + selos | valor */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <HighlightMatch
                        text={t.description}
                        query={deferredSearchTerm}
                        className="text-sm font-bold text-slate-100 truncate"
                      />
                      {t.installmentInfo && (
                        <span className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 flex items-center gap-1 shrink-0">
                          <Layers size={10} className="text-indigo-400" />
                          <span>{t.installmentInfo.current}/{t.installmentInfo.total}</span>
                        </span>
                      )}
                      {payInfo && (
                        <span className={`hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${payInfo.color}`}>
                          {payInfo.label}
                        </span>
                      )}
                      {statusButton('hidden sm:flex')}
                    </div>
                    <span
                      className={`text-sm sm:text-base font-black tracking-tight tabular-nums whitespace-nowrap shrink-0 ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {hideBalance ? '••••••' : (isIncome ? `+ ${formatCurrency(t.amount)}` : `- ${formatCurrency(t.amount)}`)}
                    </span>
                  </div>

                  {/* Linha 2: data • categoria | (celular) status + ações */}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 min-w-0">
                      <span className="shrink-0 tabular-nums">{formatDateBR(t.date).slice(0, 5)}<span className="hidden sm:inline">{formatDateBR(t.date).slice(5)}</span></span>
                      <span className="shrink-0">•</span>
                      <HighlightMatch
                        text={t.category}
                        query={deferredSearchTerm}
                        className="text-slate-300 font-medium truncate"
                      />
                      {groupBadge}
                      {t.notes && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 min-w-0">
                          <span>•</span>
                          <HighlightMatch
                            text={t.notes}
                            query={deferredSearchTerm}
                            className="text-slate-400 italic truncate max-w-[220px]"
                          />
                        </span>
                      )}
                    </div>
                    <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                      {statusButton('flex')}
                      <button
                        onClick={() => onEditTransaction(t)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer active:scale-90 min-h-[30px] min-w-[30px] flex items-center justify-center"
                        title="Editar lançamento"
                        aria-label="Editar lançamento"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer active:scale-90 min-h-[30px] min-w-[30px] flex items-center justify-center"
                        title="Excluir lançamento"
                        aria-label="Excluir lançamento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ações no computador/tablet */}
                <div className="hidden sm:flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditTransaction(t)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer active:scale-90 min-h-[34px] min-w-[34px] flex items-center justify-center"
                    title="Editar lançamento"
                    aria-label="Editar lançamento"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer active:scale-90 min-h-[34px] min-w-[34px] flex items-center justify-center"
                    title="Excluir lançamento"
                    aria-label="Excluir lançamento"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
