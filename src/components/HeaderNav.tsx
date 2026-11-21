import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  LogOut,
  User,
  Calendar,
  Keyboard,
  ChevronDown,
  Search,
  X,
  ArrowLeft,
  Receipt,
  TrendingUp,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Cloud,
  Bell,
  UserCheck
} from 'lucide-react';
import { getMonthNameAndYear, getPreviousMonth, getNextMonth, formatCurrency, formatDateBR } from '../utils/formatters';
import { maskCPF } from '../utils/cpf';
import { PWAInstallButton } from './PWAInstallButton';
import { Transaction, DebtItem, InvestmentItem, InvestmentCategory } from '../types';

interface HeaderNavProps {
  userName: string;
  userCpf?: string;
  userEmail?: string;
  userPhotoURL?: string;
  isCloudSynced?: boolean;
  onConnectCloud?: () => void;
  onSwitchAccount?: () => void;
  hideBalance: boolean;
  onToggleHideBalance: () => void;
  currentMonth: string; // YYYY-MM
  onChangeMonth: (month: string) => void;
  onOpenNewTransaction: () => void;
  onOpenExportModal?: () => void;
  onOpenMonthPicker?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onLogout?: () => void;

  // Global Search functionality
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  transactions?: Transaction[];
  debts?: DebtItem[];
  investments?: InvestmentItem[];
  onSelectTab?: (tab: 'transactions' | 'investments' | 'debts' | 'charts') => void;

  // Due reminders / notification center
  notificationCount?: number;
  onOpenNotifications?: () => void;
}

const INVESTMENT_CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  emergency_fund: 'Reserva de Emergência',
  fixed_income: 'Renda Fixa',
  variable_income: 'Renda Variável',
  crypto: 'Criptoativos',
  pension_funds: 'Previdência & Fundos',
  other: 'Outros',
};

export const HeaderNav: React.FC<HeaderNavProps> = ({
  userName,
  userCpf,
  userEmail,
  userPhotoURL,
  isCloudSynced,
  onConnectCloud,
  onSwitchAccount,
  hideBalance,
  onToggleHideBalance,
  currentMonth,
  onChangeMonth,
  onOpenNewTransaction,
  onOpenExportModal,
  onOpenMonthPicker,
  onOpenKeyboardShortcuts,
  onLogout,
  searchQuery,
  onSearchQueryChange,
  transactions = [],
  debts = [],
  investments = [],
  onSelectTab,
  notificationCount = 0,
  onOpenNotifications,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        } else {
          desktopInputRef.current?.focus();
        }
        setIsDropdownOpen(true);
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
        desktopInputRef.current?.blur();
        mobileInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filter transactions by description, category, notes, or payment method
  const matchingTransactions = useMemo(() => {
    if (!normalizedQuery) return [];
    return transactions.filter((t) => {
      const desc = t.description.toLowerCase();
      const cat = t.category.toLowerCase();
      const notes = (t.notes || '').toLowerCase();
      const method = (t.paymentMethod || '').toLowerCase();
      return (
        desc.includes(normalizedQuery) ||
        cat.includes(normalizedQuery) ||
        notes.includes(normalizedQuery) ||
        method.includes(normalizedQuery)
      );
    });
  }, [transactions, normalizedQuery]);

  // Filter debts by title, creditor, notes, or category
  const matchingDebts = useMemo(() => {
    if (!normalizedQuery) return [];
    return debts.filter((d) => {
      const title = d.title.toLowerCase();
      const creditor = (d.creditor || '').toLowerCase();
      const notes = (d.notes || '').toLowerCase();
      return (
        title.includes(normalizedQuery) ||
        creditor.includes(normalizedQuery) ||
        notes.includes(normalizedQuery)
      );
    });
  }, [debts, normalizedQuery]);

  // Filter investments by title, institution, notes, or category
  const matchingInvestments = useMemo(() => {
    if (!normalizedQuery) return [];
    return investments.filter((i) => {
      const title = i.title.toLowerCase();
      const inst = i.institution.toLowerCase();
      const notes = (i.notes || '').toLowerCase();
      const catKey = i.category.toLowerCase();
      const catLabel = (INVESTMENT_CATEGORY_LABELS[i.category] || '').toLowerCase();
      return (
        title.includes(normalizedQuery) ||
        inst.includes(normalizedQuery) ||
        notes.includes(normalizedQuery) ||
        catKey.includes(normalizedQuery) ||
        catLabel.includes(normalizedQuery)
      );
    });
  }, [investments, normalizedQuery]);

  const totalMatches =
    matchingTransactions.length + matchingDebts.length + matchingInvestments.length;

  const handleSelectTransaction = (tx: Transaction) => {
    // If transaction belongs to another month, switch to it
    const txMonth = tx.date.substring(0, 7);
    if (txMonth && txMonth !== currentMonth) {
      onChangeMonth(txMonth);
    }
    onSelectTab?.('transactions');
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleSelectDebt = () => {
    onSelectTab?.('debts');
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleSelectInvestment = () => {
    onSelectTab?.('investments');
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
  };

  return (
    <header className="w-full bg-[#15171C]/85 backdrop-blur-xl border-b border-slate-900 sticky top-0 z-30 transition-all pt-[max(env(safe-area-inset-top,0px),0px)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        
        {/* MOBILE EXPANDED SEARCH BAR */}
        {isMobileSearchOpen ? (
          <div className="flex items-center gap-2 w-full animate-in fade-in duration-150">
            <button
              id="btn-close-mobile-search"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setIsDropdownOpen(false);
              }}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
              title="Voltar ao cabeçalho"
            >
              <ArrowLeft size={18} />
            </button>

            <div ref={searchContainerRef} className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400"
              />
              <input
                ref={mobileInputRef}
                id="search-input-mobile"
                type="text"
                placeholder="Buscar por nome, loja, banco, dívida..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchQueryChange(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full pl-9 pr-9 py-2 text-xs bg-[#15171C] border border-emerald-500/50 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 shadow-inner"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchQueryChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
                  title="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}

              {/* Mobile Search Dropdown Results */}
              {isDropdownOpen && normalizedQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E2128] border border-slate-700/80 rounded-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                  {renderDropdownResults()}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STANDARD HEADER LAYOUT */
          <div>
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              
              {/* Brand Logo & User Info */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                  {userPhotoURL ? (
                    <img
                      src={userPhotoURL}
                      alt={userName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img
                      src="/icon.svg"
                      alt="AquiGastos Logo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-sm sm:text-base font-bold tracking-tight text-slate-100">
                      Aqui<span className="text-slate-400">Gastos</span>
                    </span>
                    {isCloudSynced ? (
                      <span
                        className="hidden"
                        title="Sincronizado na Nuvem Firebase Firestore"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <Cloud size={10} />
                        <span className="hidden sm:inline">Nuvem</span>
                      </span>
                    ) : (
                      <span className="hidden">
                        Local
                      </span>
                    )}
                  </div>
                  {userEmail ? (
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                      <span className="truncate">{userEmail}</span>
                    </div>
                  ) : userCpf ? (
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <User size={10} className="text-emerald-400" />
                      <span>CPF: {maskCPF(userCpf)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Month Navigator - Center on Tablets & Desktops */}
              <div className="hidden md:flex items-center bg-slate-900 rounded-full p-0.5 shrink-0">
                <button
                  id="btn-prev-month"
                  onClick={() => onChangeMonth(getPreviousMonth(currentMonth))}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Voltar para o mês anterior (Atalho: ←)"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  id="btn-open-month-picker"
                  onClick={onOpenMonthPicker}
                  className="flex items-center gap-1 px-2 sm:px-3 text-xs sm:text-sm font-bold text-slate-200 min-w-[105px] sm:min-w-[135px] justify-center select-none hover:text-emerald-400 hover:bg-slate-800/50 rounded-lg py-1 transition-colors cursor-pointer group"
                  title="Clique para escolher qualquer mês ou voltar para hoje"
                >
                  <Calendar size={13} className="text-slate-400 hidden sm:inline" />
                  <span className="truncate">{getMonthNameAndYear(currentMonth)}</span>
                  <ChevronDown
                    size={12}
                    className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0"
                  />
                </button>

                <button
                  id="btn-next-month"
                  onClick={() => onChangeMonth(getNextMonth(currentMonth))}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Avançar para o próximo mês (Atalho: →)"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* DESKTOP SEARCH BAR (Tablets & Desktops) */}
              <div
                ref={searchContainerRef}
                className="hidden md:block relative flex-1 min-w-[150px] max-w-xs lg:max-w-sm"
              >
              <div className="relative">
                <Search
                  size={14}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    searchQuery ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <input
                  ref={desktopInputRef}
                  id="search-input-desktop"
                  type="text"
                  placeholder="Buscar transações, dívidas, aportes..."
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchQueryChange(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-900 border border-transparent rounded-full text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all shadow-xs"
                />
                {searchQuery ? (
                  <button
                    onClick={() => {
                      onSearchQueryChange('');
                      desktopInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
                    title="Limpar busca"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 font-mono pointer-events-none select-none">
                    /
                  </kbd>
                )}
              </div>

              {/* Desktop Live Dropdown */}
              {isDropdownOpen && normalizedQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E2128] border border-slate-700/80 rounded-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col min-w-[380px] lg:min-w-[420px] animate-in fade-in slide-in-from-top-2 duration-150">
                  {renderDropdownResults()}
                </div>
              )}
            </div>

            {/* Right: Actions, Mobile Search Button & Balance Toggle */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              
              {/* Mobile Search Toggle Button */}
              <button
                id="btn-open-mobile-search"
                onClick={() => {
                  setIsMobileSearchOpen(true);
                  setIsDropdownOpen(true);
                  setTimeout(() => mobileInputRef.current?.focus(), 50);
                }}
                className={`md:hidden p-2 rounded-full transition-colors cursor-pointer active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center relative ${
                  searchQuery
                    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border-slate-800/80'
                }`}
                title="Buscar transações, dívidas e investimentos"
              >
                <Search size={16} />
                {searchQuery && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 shadow-xs" />
                )}
              </button>

              <button
                id="toggle-hide-balance"
                onClick={onToggleHideBalance}
                className="p-2 sm:p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center"
                title={
                  hideBalance
                    ? 'Mostrar valores monetários (Atalho: H)'
                    : 'Ocultar valores monetários (Atalho: H)'
                }
              >
                {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>

              {/* Notification Center Bell with Badge */}
              {onOpenNotifications && (
                <button
                  id="btn-notifications-header"
                  onClick={onOpenNotifications}
                  className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Alertas e Lembretes de Vencimento"
                >
                  <Bell
                    size={16}
                    className={notificationCount > 0 ? 'text-amber-400' : 'text-slate-400'}
                  />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-semibold text-[10px] rounded-full flex items-center justify-center shadow-md">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              )}

              {onOpenKeyboardShortcuts && (
                <button
                  id="btn-shortcuts"
                  onClick={onOpenKeyboardShortcuts}
                  className="hidden 2xl:flex p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer active:scale-95 min-h-[38px] min-w-[38px] items-center justify-center"
                  title="Ver Atalhos de Teclado (Atalho: ?)"
                >
                  <Keyboard size={16} />
                </button>
              )}

              {/* PWA In-App Install Button */}
              <PWAInstallButton />

              {/* Automatic Save Indicator & Cloud Link */}
              {isCloudSynced ? (
                <div className="flex items-center gap-1.5">
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-3 min-h-[38px] text-xs font-medium text-slate-300 bg-slate-900 rounded-full"
                    title="Salvamento automático em tempo real no banco de dados Firebase Firestore"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="hidden 2xl:inline">Salvo na Nuvem</span>
                    <span className="2xl:hidden">Nuvem</span>
                  </div>
                  {onSwitchAccount && (
                    <button
                      id="btn-switch-account-header"
                      onClick={onSwitchAccount}
                      className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all cursor-pointer active:scale-95 min-h-[38px]"
                      title="Trocar de conta"
                    >
                      <UserCheck size={13} className="text-emerald-400" />
                      <span>Trocar Conta</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-3 min-h-[38px] text-xs font-medium text-slate-300 bg-slate-900 rounded-full"
                    title="Salvamento automático ativado neste aparelho"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
                    <span className="hidden 2xl:inline">Salvo no Aparelho</span>
                    <span className="2xl:hidden">No aparelho</span>
                  </div>
                  {onConnectCloud && (
                    <button
                      id="btn-connect-cloud-header"
                      onClick={onConnectCloud}
                      className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-full transition-all cursor-pointer active:scale-[0.98] min-h-[38px]"
                      title="Criar conta na nuvem e levar seus dados junto"
                    >
                      <Cloud size={13} className="text-emerald-400" />
                      <span>Salvar na Nuvem</span>
                    </button>
                  )}
                </div>
              )}

              {onOpenExportModal && (
                <button
                  id="btn-export"
                  onClick={onOpenExportModal}
                  className="hidden sm:flex items-center justify-center gap-1.5 px-2.5 2xl:px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-colors cursor-pointer active:scale-[0.98] min-h-[38px] min-w-[38px]"
                  title="Exportar dados em PDF ou CSV"
                >
                  <Download size={15} />
                  <span className="hidden 2xl:inline">Exportar</span>
                </button>
              )}

              <button
                id="btn-new-transaction"
                onClick={onOpenNewTransaction}
                className="hidden sm:flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-bold text-slate-950 bg-slate-100 hover:bg-white rounded-full transition-all cursor-pointer active:scale-[0.98] min-h-[38px]"
                title="Adicionar Lançamento (Atalho: N)"
              >
                <Plus size={16} />
                <span className="hidden lg:inline 2xl:hidden">Novo</span>
                <span className="hidden 2xl:inline">Novo Lançamento</span>
              </button>

              {onLogout && (
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-full transition-colors cursor-pointer active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Sair da conta"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>

          </div>

          {/* Dedicated Clean Mobile Month Navigator Row */}
          <div className="md:hidden mt-1.5 flex items-center justify-between w-full">
            <button
              id="btn-prev-month-mobile"
              onClick={() => onChangeMonth(getPreviousMonth(currentMonth))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center shrink-0"
              title="Voltar para o mês anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              id="btn-open-month-picker-mobile"
              onClick={onOpenMonthPicker}
              className="flex items-center gap-1.5 px-2 text-slate-100 justify-center select-none hover:text-white transition-colors cursor-pointer group flex-1 truncate"
              title="Clique para escolher qualquer mês ou voltar para hoje"
            >
              <span className="truncate text-[15px] font-semibold">{getMonthNameAndYear(currentMonth)}</span>
              <ChevronDown
                size={12}
                className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0"
              />
            </button>

            <button
              id="btn-next-month-mobile"
              onClick={() => onChangeMonth(getNextMonth(currentMonth))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center shrink-0"
              title="Avançar para o próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        )}

      </div>
    </header>
  );

  /**
   * Helper function to render search results across Transactions, Debts, and Investments
   */
  function renderDropdownResults() {
    return (
      <>
        {/* Header Summary */}
        <div className="p-3 bg-[#15171C]/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">
              Buscando por: <strong className="text-emerald-400">"{searchQuery}"</strong>
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
            {totalMatches} {totalMatches === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-3">
          
          {/* 1. TRANSACTIONS SECTION */}
          {matchingTransactions.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-400 ">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Receipt size={13} />
                  <span>Transações ({matchingTransactions.length})</span>
                </span>
                <button
                  onClick={() => {
                    onSelectTab?.('transactions');
                    setIsDropdownOpen(false);
                    setIsMobileSearchOpen(false);
                  }}
                  className="text-emerald-400 hover:underline cursor-pointer lowercase font-normal"
                >
                  ver no extrato
                </button>
              </div>

              <div className="space-y-1">
                {matchingTransactions.slice(0, 4).map((tx) => {
                  const isExpense = tx.type === 'expense';
                  return (
                    <button
                      key={tx.id}
                      onClick={() => handleSelectTransaction(tx)}
                      className="w-full text-left p-2 rounded-xl bg-[#15171C]/60 hover:bg-slate-800/70 border border-slate-800/60 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            isExpense
                              ? 'bg-rose-950/40 border-rose-800/40 text-rose-400'
                              : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                          }`}
                        >
                          {isExpense ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 block truncate">
                            {tx.description}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span>{formatDateBR(tx.date)}</span>
                            <span>•</span>
                            <span className="truncate">{tx.category}</span>
                            {tx.notes && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500 italic truncate max-w-[120px]">
                                  {tx.notes}
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-bold block ${
                            isExpense ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {hideBalance
                            ? '••••••'
                            : `${isExpense ? '-' : '+'} ${formatCurrency(tx.amount)}`}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. INVESTMENTS SECTION */}
          {matchingInvestments.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-400 ">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <TrendingUp size={13} />
                  <span>Investimentos ({matchingInvestments.length})</span>
                </span>
                <button
                  onClick={handleSelectInvestment}
                  className="text-blue-400 hover:underline cursor-pointer lowercase font-normal"
                >
                  ver investimentos
                </button>
              </div>

              <div className="space-y-1">
                {matchingInvestments.slice(0, 3).map((inv) => (
                  <button
                    key={inv.id}
                    onClick={handleSelectInvestment}
                    className="w-full text-left p-2 rounded-xl bg-[#15171C]/60 hover:bg-slate-800/70 border border-slate-800/60 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
                        <TrendingUp size={14} />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-blue-300 block truncate">
                          {inv.title}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{inv.institution}</span>
                          <span>•</span>
                          <span>{INVESTMENT_CATEGORY_LABELS[inv.category] || 'Investimento'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-100 block">
                        {hideBalance ? '••••••' : formatCurrency(inv.currentValue)}
                      </span>
                      <span className="text-[10px] text-emerald-400">
                        {inv.yieldRate ? 'Rendendo' : 'Ativo'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. DEBTS SECTION */}
          {matchingDebts.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-400 ">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Building2 size={13} />
                  <span>Dívidas ({matchingDebts.length})</span>
                </span>
                <button
                  onClick={handleSelectDebt}
                  className="text-amber-400 hover:underline cursor-pointer lowercase font-normal"
                >
                  ver dívidas
                </button>
              </div>

              <div className="space-y-1">
                {matchingDebts.slice(0, 3).map((d) => {
                  const remaining = Math.max(0, d.totalAmount - d.paidAmount);
                  const isPaid = d.status === 'paid' || remaining <= 0;
                  return (
                    <button
                      key={d.id}
                      onClick={handleSelectDebt}
                      className="w-full text-left p-2 rounded-xl bg-[#15171C]/60 hover:bg-slate-800/70 border border-slate-800/60 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center shrink-0">
                          <Building2 size={14} />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300 block truncate">
                            {d.title}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            {d.creditor && <span>{d.creditor} • </span>}
                            <span>{isPaid ? 'Quitada' : 'Em Aberto'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-amber-300 block">
                          {hideBalance ? '••••••' : formatCurrency(remaining)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {isPaid ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* EMPTY RESULTS STATE */}
          {totalMatches === 0 && (
            <div className="p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Search size={18} />
              </div>
              <p className="text-xs font-bold text-slate-200 mb-1">
                Nenhum resultado para "{searchQuery}"
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                Tente buscar pelo nome da loja, banco (Nubank, Inter), tipo de despesa, dívida ou
                investimento.
              </p>
            </div>
          )}

        </div>

        {/* Footer tip */}
        <div className="p-2.5 bg-[#15171C]/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>A busca filtra todas as telas automaticamente.</span>
          <button
            onClick={() => onSearchQueryChange('')}
            className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            Limpar busca
          </button>
        </div>
      </>
    );
  }
};
