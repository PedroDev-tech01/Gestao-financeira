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
    <section aria-label="Lançamentos" className="bg-slate-900 rounded-3xl p-4 sm:p-5">

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-slate-100">
          Lançamentos
          <span className="ml-2 font-normal text-slate-500 tabular-nums">
            {isSearchActive ? `${filteredTransactions.length} de ${transactions.length}` : transactions.length}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          {onOpenExportModal && (
            <button
              id="btn-export-from-ledger"
              onClick={onOpenExportModal}
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Exportar este mês em PDF ou CSV"
              aria-label="Exportar este mês em PDF ou CSV"
            >
              <Download size={17} />
            </button>
          )}
          {onClearAllTransactions && transactions.length > 0 && (
            <button
              id="btn-clear-account-txs"
              onClick={onClearAllTransactions}
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Apagar todos os lançamentos desta conta"
              aria-label="Apagar todos os lançamentos desta conta"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Instant Search Bar & Filter Options */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-3">
        
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
            placeholder="Buscar por nome, valor ou data"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-12 min-h-[42px] text-sm bg-[#15171C] border border-transparent rounded-full text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
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
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5 lg:pb-0 [scrollbar-width:none]">
          <button
            onClick={() => setTypeFilter('all')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-[#15171C] text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              typeFilter === 'income'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-[#15171C] text-slate-400 hover:text-slate-200'
            }`}
          >
            Ganhos
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              typeFilter === 'expense'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-[#15171C] text-slate-400 hover:text-slate-200'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setTypeFilter('pending')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              typeFilter === 'pending'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-[#15171C] text-slate-400 hover:text-slate-200'
            }`}
          >
            A pagar
          </button>
          <button
            onClick={() => setTypeFilter('essential')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              typeFilter === 'essential'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-[#15171C] text-slate-400 hover:text-slate-200'
            }`}
          >
            Essenciais
          </button>
          <button
            onClick={() => setTypeFilter('lifestyle')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              typeFilter === 'lifestyle'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-[#15171C] text-slate-400 hover:text-slate-200'
            }`}
          >
            Estilo de vida
          </button>
        </div>
      </div>

      {/* Quick Search Tag Suggestions */}
      <div className="hidden md:flex items-center gap-1.5 mt-2.5 flex-wrap">
        <span className="text-xs text-slate-500 mr-1">
          <span>Sugestões:</span>
        </span>
        {quickSearchTags.map(tag => {
          const isSelected = searchTerm.toLowerCase() === tag.toLowerCase();
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleSearchChange(isSelected ? '' : tag)}
              className={`text-xs px-3 min-h-[30px] rounded-full transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
        <div className="mt-3 p-3 rounded-2xl bg-[#15171C] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in duration-150">
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

      {/* Transactions List */}
      <div className="mt-2 divide-y divide-slate-800/60">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-slate-400 mb-3">
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
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <X size={14} className="text-rose-400" />
                <span>Limpar busca (Esc)</span>
              </button>
            ) : (
              onOpenNewTransaction && (
                <button
                  onClick={onOpenNewTransaction}
                  className="mt-4 px-4 py-2 text-xs font-bold text-slate-950 bg-slate-100 hover:bg-white rounded-full transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
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
            
            const statusButton = (extra: string) => (
              <button
                onClick={() => onToggleStatus(t.id)}
                className={`${extra} text-[11px] font-medium px-2.5 rounded-full items-center gap-1 cursor-pointer transition-colors active:scale-95 min-h-[28px] shrink-0 bg-slate-800 hover:bg-slate-700 ${
                  t.status === 'paid' ? 'text-slate-400' : 'text-amber-300'
                }`}
                title="Toque para alternar entre Pago e A Pagar"
              >
                {t.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                <span>{t.status === 'paid' ? (isIncome ? 'Recebido' : 'Pago') : isIncome ? 'A receber' : 'A pagar'}</span>
              </button>
            );

            // Selo do grupo 50/30/20 fica só nos filtros, para a lista ficar limpa
            const groupBadge = null;

            return (
              <div
                key={t.id}
                className="py-3 flex items-center gap-3 group transition-colors duration-150"
              >
                {/* Ícone da categoria */}
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-slate-800"
                  style={{ color: cat ? cat.color : '#9BA0A9' }}
                >
                  <CategoryIcon iconName={cat ? cat.icon : 'Layers'} size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Linha 1: descrição + selos | valor */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(t)}
                        className="min-w-0 text-left cursor-pointer hover:underline decoration-slate-600 underline-offset-4 flex"
                        title="Editar lançamento"
                      >
                        <HighlightMatch
                          text={t.description}
                          query={deferredSearchTerm}
                          className="text-[15px] font-medium text-slate-100 truncate"
                        />
                      </button>
                      {t.installmentInfo && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1 shrink-0 tabular-nums">
                          <Layers size={10} className="text-slate-400" />
                          <span>{t.installmentInfo.current}/{t.installmentInfo.total}</span>
                        </span>
                      )}
                      {statusButton('hidden sm:flex')}
                    </div>
                    <span
                      className={`text-[15px] font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {hideBalance ? '••••••' : (isIncome ? `+ ${formatCurrency(t.amount)}` : `− ${formatCurrency(t.amount)}`)}
                    </span>
                  </div>

                  {/* Linha 2: data • categoria | (celular) status + ações */}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-400 min-w-0">
                      <span className="shrink-0 tabular-nums">{formatDateBR(t.date).slice(0, 5)}<span className="hidden sm:inline">{formatDateBR(t.date).slice(5)}</span></span>
                      <span className="shrink-0">•</span>
                      <HighlightMatch
                        text={t.category.split(/[,&/]/)[0].trim()}
                        query={deferredSearchTerm}
                        className="text-slate-400 truncate"
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
                        onClick={() => onDeleteTransaction(t.id)}
                        className="text-slate-500 hover:text-rose-400 rounded-full cursor-pointer active:scale-90 min-h-[36px] min-w-[36px] flex items-center justify-center"
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

    </section>
  );
};
