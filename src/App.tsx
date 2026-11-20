import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { OverviewCards } from './components/OverviewCards';
import { TransactionList } from './components/TransactionList';
import { QuickGuideBanner } from './components/QuickGuideBanner';
import { FinancialEducationCard } from './components/FinancialEducationCard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { DueAlertsBanner } from './components/DueAlertsBanner';
import { getPendingMigration, isLocalOnlySession, isDemoSession } from './utils/legacyAccounts';
import {
  getDueReminders,
  checkAndSendDailyNotification,
  DueReminder
} from './services/notificationService';
import type { AuthSessionUser } from './types';
import {
  onAuthChange,
  getCurrentFirebaseUser,
  signOutCloud,
  signInWithGoogle,
  preloadCloud,
  subscribeToTransactions,
  saveTransaction as fsSaveTransaction,
  deleteTransaction as fsDeleteTransaction,
  clearAllUserTransactions,
  subscribeToDebts,
  saveDebt as fsSaveDebt,
  deleteDebt as fsDeleteDebt,
  subscribeToInvestments,
  saveInvestment as fsSaveInvestment,
  deleteInvestment as fsDeleteInvestment,
  saveUserProfile,
  migrateLocalAccountToCloud,
} from './services/cloud';
import {
  loadUserAccountData,
  saveUserAccountData,
  purgeLegacySharedStorage
} from './utils/userStorage';

import {
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS
} from './data/initialData';
import {
  Transaction,
  CategoryItem,
  TransactionType,
  DebtItem,
  DebtPaymentRecord,
  InvestmentItem
} from './types';
import { formatCurrency, getPreviousMonth, getNextMonth } from './utils/formatters';
import {
  Receipt,
  BarChart3,
  Building2,
  Plus,
  Sparkles,
  ArrowRight,
  PiggyBank,
  TrendingUp,
  Search,
  X,
  Cloud,
  CloudUpload
} from 'lucide-react';

// Partes carregadas só quando forem usadas (deixa a abertura do app bem mais rápida)
const LoginScreen = lazy(() => import('./components/LoginScreen').then((m) => ({ default: m.LoginScreen })));
const TransactionModal = lazy(() => import('./components/TransactionModal').then((m) => ({ default: m.TransactionModal })));
const ExportReportModal = lazy(() => import('./components/ExportReportModal').then((m) => ({ default: m.ExportReportModal })));
const CashFlowChartsArea = lazy(() => import('./components/CashFlowChartsArea').then((m) => ({ default: m.CashFlowChartsArea })));
const DebtsArea = lazy(() => import('./components/DebtsArea').then((m) => ({ default: m.DebtsArea })));
const DebtModal = lazy(() => import('./components/DebtModal').then((m) => ({ default: m.DebtModal })));
const PayDebtModal = lazy(() => import('./components/PayDebtModal').then((m) => ({ default: m.PayDebtModal })));
const InvestmentsArea = lazy(() => import('./components/InvestmentsArea').then((m) => ({ default: m.InvestmentsArea })));
const InvestmentModal = lazy(() => import('./components/InvestmentModal').then((m) => ({ default: m.InvestmentModal })));
const InvestmentAporteModal = lazy(() => import('./components/InvestmentAporteModal').then((m) => ({ default: m.InvestmentAporteModal })));
const MonthPickerModal = lazy(() => import('./components/MonthPickerModal').then((m) => ({ default: m.MonthPickerModal })));
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal })));
const NotificationCenterModal = lazy(() => import('./components/NotificationCenterModal').then((m) => ({ default: m.NotificationCenterModal })));
const CloudMigrationModal = lazy(() => import('./components/CloudMigrationModal').then((m) => ({ default: m.CloudMigrationModal })));

function TabLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-3xl bg-slate-800/40 border border-slate-800/60" />
        ))}
      </div>
      <div className="h-64 rounded-3xl bg-slate-800/30 border border-slate-800/60" />
    </div>
  );
}

export default function App() {
  // Authentication session state
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(() => {
    const saved = localStorage.getItem('aquigastos_active_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const userName = currentUser ? currentUser.name : 'Minhas Finanças';
  const userCpf = currentUser ? currentUser.cpf : undefined;

  // Load account data strictly isolated for currentUser on initial mount
  const initialUserData = useMemo(() => {
    purgeLegacySharedStorage();
    return loadUserAccountData(currentUser);
  }, []);

  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return initialUserData.hideBalance;
  });

  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [activeTab, setActiveTab] = useState<'transactions' | 'investments' | 'debts' | 'charts'>('transactions');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Transactions state (strictly isolated to current account)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return initialUserData.transactions;
  });

  // Debts state (strictly isolated to current account)
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    return initialUserData.debts;
  });

  // Investments state (strictly isolated to current account)
  const [investments, setInvestments] = useState<InvestmentItem[]>(() => {
    return initialUserData.investments;
  });

  const [categories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);

  // Modals state for transactions
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('expense');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Modals state for debts
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtItem | null>(null);

  // Modals state for investments
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentItem | null>(null);
  const [isAporteModalOpen, setIsAporteModalOpen] = useState(false);
  const [operatingInvestment, setOperatingInvestment] = useState<InvestmentItem | null>(null);

  // Month Picker & Shortcuts modal
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Due Reminders & Notification Center state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Compute active upcoming and overdue bills / debts reminders
  const dueReminders = useMemo(() => {
    return getDueReminders(debts, transactions, 7);
  }, [debts, transactions]);

  // Toast notifications system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'info' | 'warning' | 'error', text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev.slice(-2), { id, type, text }]);
  };
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check and dispatch daily push notification if permissions granted
  useEffect(() => {
    if (!currentUser || dueReminders.length === 0) return;
    checkAndSendDailyNotification(dueReminders).catch(console.warn);
  }, [currentUser, dueReminders]);

  // Keyboard Shortcuts Listener for desktop/tablet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        setIsTxModalOpen(false);
        setIsDebtModalOpen(false);
        setIsPayDebtModalOpen(false);
        setIsInvestmentModalOpen(false);
        setIsAporteModalOpen(false);
        setIsExportModalOpen(false);
        setIsMonthPickerOpen(false);
        setIsShortcutsOpen(false);
        setIsNotificationCenterOpen(false);
      } else if (e.key === 'n' || e.key === 'N' || e.key === '+') {
        e.preventDefault();
        handleOpenNewTransaction('expense');
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHideBalance(prev => !prev);
      } else if (e.key === '1') {
        setActiveTab('transactions');
      } else if (e.key === '2') {
        setActiveTab('investments');
      } else if (e.key === '3') {
        setActiveTab('debts');
      } else if (e.key === '4') {
        setActiveTab('charts');
      } else if (e.key === 'ArrowLeft') {
        setCurrentMonth(prev => getPreviousMonth(prev));
      } else if (e.key === 'ArrowRight') {
        setCurrentMonth(prev => getNextMonth(prev));
      } else if (e.key === '?') {
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active authenticated Firebase UID (null if using local mode / CPF)
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  // Auth State Listener
  useEffect(() => {
    purgeLegacySharedStorage();
    // Baixa o Firebase em segundo plano: a tela já abriu com os dados em cache.
    preloadCloud();
    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        setFirebaseUid(fbUser.uid);
        const cloudUser: AuthSessionUser = {
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Minhas Finanças',
          cpf: fbUser.email || fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
          isCloudSynced: true,
        };

        // Instantly switch to this user's isolated local cache
        const userAccount = loadUserAccountData(cloudUser);
        setTransactions(userAccount.transactions);
        setDebts(userAccount.debts);
        setInvestments(userAccount.investments);
        setHideBalance(userAccount.hideBalance);

        setCurrentUser(cloudUser);
        localStorage.setItem('aquigastos_active_session', JSON.stringify(cloudUser));

        try {
          await saveUserProfile(fbUser.uid, {
            displayName: cloudUser.name,
            email: cloudUser.email,
            photoURL: cloudUser.photoURL,
            cpf: userCpf && !userCpf.includes('@') ? userCpf : undefined,
            hideBalance: userAccount.hideBalance,
          });
        } catch (e) {
          console.warn('Profile sync notice:', e);
        }
      } else {
        setFirebaseUid(null);
        // A sessão salva era de uma conta na nuvem, mas o login expirou/foi encerrado:
        // volta para a tela de login (o cache local da conta continua guardado).
        const saved = localStorage.getItem('aquigastos_active_session');
        try {
          if (saved && JSON.parse(saved)?.uid) {
            localStorage.removeItem('aquigastos_active_session');
            setCurrentUser(null);
            setTransactions([]);
            setDebts([]);
            setInvestments([]);
          }
        } catch {
          /* sessão local inválida: ignora */
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Retoma uma migração para a nuvem que foi interrompida (ex.: página fechada no meio do envio).
  // Os dados locais nunca são apagados, então é seguro tentar de novo.
  useEffect(() => {
    if (!firebaseUid) return;
    const pending = getPendingMigration();
    if (!pending || pending.uid !== firebaseUid) return;
    getCurrentFirebaseUser()
      .then((fbUser) =>
        migrateLocalAccountToCloud({ name: pending.name, cpf: pending.cpf }, firebaseUid, fbUser?.email)
      )
      .then(({ count }) => {
        if (count > 0) addToast('success', `${count} itens do aparelho foram enviados para a nuvem.`);
      })
      .catch((e) => console.warn('Pending migration retry notice:', e));
  }, [firebaseUid]);

  // Real-time Firestore sync when authenticated with Firebase
  useEffect(() => {
    if (!firebaseUid) return;

    const uid = firebaseUid;

    const unsubTxs = subscribeToTransactions(
      uid,
      (cloudTxs) => {
        // ONLY set transactions for this specific user.
        // NEVER auto-sync or pull data from another account or un-scoped storage!
        setTransactions(cloudTxs);
      },
      (err) => console.warn('Firestore transactions sync notice:', err)
    );

    const unsubDebts = subscribeToDebts(
      uid,
      (cloudDebts) => {
        setDebts(cloudDebts);
      },
      (err) => console.warn('Firestore debts sync notice:', err)
    );

    const unsubInvs = subscribeToInvestments(
      uid,
      (cloudInvs) => {
        setInvestments(cloudInvs);
      },
      (err) => console.warn('Firestore investments sync notice:', err)
    );

    return () => {
      unsubTxs();
      unsubDebts();
      unsubInvs();
    };
  }, [firebaseUid]);

  // Sync to user-isolated local storage (never overwrites another user's storage)
  useEffect(() => {
    if (!currentUser) return;
    saveUserAccountData(currentUser, { hideBalance });
  }, [hideBalance, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    saveUserAccountData(currentUser, { transactions });
  }, [transactions, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    saveUserAccountData(currentUser, { debts });
  }, [debts, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    saveUserAccountData(currentUser, { investments });
  }, [investments, currentUser]);

  // Current Month Transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date && t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  // Calculations for Overview Cards
  const monthIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const pendingIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const pendingExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const netBalance = monthIncome - monthExpense;

  // Active debts summary
  const activeDebts = useMemo(() => {
    return debts.filter(d => d.status === 'active' && (d.totalAmount - d.paidAmount) > 0);
  }, [debts]);

  const totalDebtsRemaining = useMemo(() => {
    return activeDebts.reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0);
  }, [activeDebts]);

  // Available months for export
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonth);
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions, currentMonth]);

  // Auth Handlers
  const handleLoginSuccess = (user: AuthSessionUser) => {
    setCurrentUser(user);
    localStorage.setItem('aquigastos_active_session', JSON.stringify(user));
    if (user.uid) {
      setFirebaseUid(user.uid);
    } else {
      setFirebaseUid(null);
    }
    // Load isolated data for this specific user
    const userAccount = loadUserAccountData(user);
    setTransactions(userAccount.transactions);
    setDebts(userAccount.debts);
    setInvestments(userAccount.investments);
    setHideBalance(userAccount.hideBalance);
  };

  const handleLogout = async () => {
    try {
      await signOutCloud();
    } catch (e) {
      console.error('Sign out error', e);
    }
    // Completely wipe in-memory state so no data leaks to the next account!
    setCurrentUser(null);
    setFirebaseUid(null);
    setTransactions([]);
    setDebts([]);
    setInvestments([]);
    localStorage.removeItem('aquigastos_active_session');
    purgeLegacySharedStorage();
    addToast('info', 'Você saiu da sua conta.');
  };

  // Conta salva só no aparelho -> abre o fluxo que cria a conta na nuvem e leva os dados junto.
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const handleConnectCloud = () => {
    if (isLocalOnlySession(currentUser)) {
      setIsMigrationOpen(true);
    }
  };

  const handleMigrationDone = ({ count, skipped }: { count: number; skipped: number }) => {
    setIsMigrationOpen(false);
    if (count === 0 && skipped === 0) {
      addToast('success', 'Conta na nuvem pronta! Seus próximos lançamentos já serão salvos nela.');
    } else if (skipped > 0) {
      addToast('success', `Pronto! ${count} itens enviados para a nuvem (${skipped} já estavam lá).`);
    } else {
      addToast('success', `Pronto! ${count} itens enviados para a nuvem. Agora você acessa de qualquer aparelho.`);
    }
  };

  const handleSwitchAccount = async () => {
    const fbUser = await getCurrentFirebaseUser().catch(() => null);
    const isGoogleAccount = Boolean(
      fbUser?.providerData?.some((p) => p.providerId === 'google.com')
    );
    if (!isGoogleAccount) {
      // Contas de e-mail: volta para a tela de login para escolher outra conta.
      await handleLogout();
      return;
    }
    try {
      await signOutCloud();
    } catch (e) {
      console.warn('Sign out error on switch account:', e);
    }
    // Wipe active session and reset states immediately
    setCurrentUser(null);
    setFirebaseUid(null);
    setTransactions([]);
    setDebts([]);
    setInvestments([]);
    localStorage.removeItem('aquigastos_active_session');
    purgeLegacySharedStorage();

    // Trigger Google account selector with prompt: select_account
    try {
      const result = await signInWithGoogle(true);
      const user = result.user;
      const cloudUser: AuthSessionUser = {
        name: user.displayName || 'Usuário Google',
        cpf: user.email || 'Conta Google',
        uid: user.uid,
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        isCloudSynced: true,
      };

      const userAccount = loadUserAccountData(cloudUser);
      setTransactions(userAccount.transactions);
      setDebts(userAccount.debts);
      setInvestments(userAccount.investments);
      setHideBalance(userAccount.hideBalance);

      setCurrentUser(cloudUser);
      setFirebaseUid(user.uid);
      localStorage.setItem('aquigastos_active_session', JSON.stringify(cloudUser));
      addToast('success', `Conectado como ${cloudUser.name}!`);
    } catch (err: any) {
      console.error('Switch account error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        addToast('error', 'Não foi possível trocar de conta no momento.');
      }
    }
  };

  const handleClearAccountTransactions = async () => {
    if (transactions.length === 0) return;
    const confirmed = window.confirm(
      'Deseja apagar todos os lançamentos desta conta? Os dados das suas outras contas permanecerão intactos.'
    );
    if (!confirmed) return;

    const txIds = transactions.map(t => t.id);
    if (firebaseUid) {
      try {
        await clearAllUserTransactions(firebaseUid, txIds);
      } catch (e) {
        console.error('Error clearing cloud transactions:', e);
      }
    }
    setTransactions([]);
    if (currentUser) {
      saveUserAccountData(currentUser, { transactions: [] });
    }
    addToast('info', 'Todos os lançamentos desta conta foram apagados com sucesso.');
  };

  // Transaction Handlers
  const handleOpenNewTransaction = (type: TransactionType = 'expense') => {
    setEditingTx(null);
    setDefaultTxType(type);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setDefaultTxType(tx.type);
    setIsTxModalOpen(true);
  };

  // Handles both single transaction AND multiple installments list
  const handleSaveTransaction = (txData: (Omit<Transaction, 'id'> | Transaction) | (Omit<Transaction, 'id'> | Transaction)[]) => {
    if (Array.isArray(txData)) {
      const newItems: Transaction[] = txData.map((item, idx) => {
        if ('id' in item) return item as Transaction;
        return {
          ...(item as Omit<Transaction, 'id'>),
          id: `tx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          scope: 'personal'
        };
      });
      setTransactions(prev => [...newItems, ...prev]);
      if (currentUser?.uid) {
        newItems.forEach(item => fsSaveTransaction(currentUser.uid!, item).catch(console.error));
      }
      addToast('success', `${newItems.length} parcelas lançadas com sucesso!`);
    } else if ('id' in txData) {
      const updatedTx = txData as Transaction;
      setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
      if (currentUser?.uid) {
        fsSaveTransaction(currentUser.uid, updatedTx).catch(console.error);
      }
      addToast('success', 'Lançamento atualizado!');
      setIsTxModalOpen(false);
    } else {
      const newTx: Transaction = {
        ...(txData as Omit<Transaction, 'id'>),
        id: `tx-${Date.now()}`,
        scope: 'personal'
      };
      setTransactions(prev => [newTx, ...prev]);
      if (currentUser?.uid) {
        fsSaveTransaction(currentUser.uid, newTx).catch(console.error);
      }
      addToast('success', `${newTx.type === 'income' ? 'Ganho' : 'Gasto'} salvo!`);
    }
  };

  const handleDeleteTransaction = (txId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== txId));
    if (currentUser?.uid) {
      fsDeleteTransaction(currentUser.uid, txId).catch(console.error);
    }
    addToast('info', 'Lançamento excluído.');
  };

  const handleToggleTxStatus = (txId: string) => {
    const target = transactions.find(t => t.id === txId);
    if (!target) return;
    const nextStatus: Transaction['status'] = target.status === 'paid' ? 'pending' : 'paid';
    const statusText = nextStatus === 'paid' ? 'Marcado como pago/recebido!' : 'Marcado como a pagar/pendente!';
    const updated: Transaction = { ...target, status: nextStatus };
    setTransactions(prev => prev.map(t => t.id === txId ? updated : t));
    if (currentUser?.uid) {
      fsSaveTransaction(currentUser.uid, updated).catch(console.warn);
    }
    addToast('info', statusText);
  };

  // Debt Handlers
  const handleOpenNewDebt = () => {
    setEditingDebt(null);
    setIsDebtModalOpen(true);
  };

  const handleEditDebt = (debt: DebtItem) => {
    setEditingDebt(debt);
    setIsDebtModalOpen(true);
  };

  const handleSaveDebt = (debtData: Omit<DebtItem, 'id' | 'createdAt'> | DebtItem) => {
    if ('id' in debtData) {
      const updatedDebt = debtData as DebtItem;
      setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d));
      if (currentUser?.uid) {
        fsSaveDebt(currentUser.uid, updatedDebt).catch(console.error);
      }
      addToast('success', 'Dívida atualizada!');
    } else {
      const newDebt: DebtItem = {
        ...(debtData as Omit<DebtItem, 'id' | 'createdAt'>),
        id: `debt-${Date.now()}`,
        createdAt: new Date().toISOString(),
        paymentHistory: debtData.paidAmount > 0 ? [{
          id: `pay-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: debtData.paidAmount,
          note: 'Valor inicial já quitado'
        }] : []
      };
      setDebts(prev => [newDebt, ...prev]);
      if (currentUser?.uid) {
        fsSaveDebt(currentUser.uid, newDebt).catch(console.error);
      }
      addToast('success', 'Dívida registrada com sucesso!');
    }
    setIsDebtModalOpen(false);
  };

  const handleDeleteDebt = (debtId: string) => {
    setDebts(prev => prev.filter(d => d.id !== debtId));
    if (currentUser?.uid) {
      fsDeleteDebt(currentUser.uid, debtId).catch(console.error);
    }
    addToast('info', 'Dívida excluída.');
  };

  const handleOpenPayDebt = (debt: DebtItem) => {
    setPayingDebt(debt);
    setIsPayDebtModalOpen(true);
  };

  // Investment Handlers
  const handleOpenNewInvestment = () => {
    setEditingInvestment(null);
    setIsInvestmentModalOpen(true);
  };

  const handleEditInvestment = (item: InvestmentItem) => {
    setEditingInvestment(item);
    setIsInvestmentModalOpen(true);
  };

  const handleDeleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(item => item.id !== id));
    if (currentUser?.uid) {
      fsDeleteInvestment(currentUser.uid, id).catch(console.error);
    }
    addToast('info', 'Investimento removido da carteira.');
  };

  const handleSaveInvestment = (investmentData: Omit<InvestmentItem, 'id' | 'createdAt'> | InvestmentItem) => {
    if ('id' in investmentData) {
      const updatedInv = investmentData as InvestmentItem;
      setInvestments(prev => prev.map(inv => inv.id === updatedInv.id ? updatedInv : inv));
      if (currentUser?.uid) {
        fsSaveInvestment(currentUser.uid, updatedInv).catch(console.error);
      }
      addToast('success', 'Investimento atualizado!');
    } else {
      const newItem: InvestmentItem = {
        ...(investmentData as Omit<InvestmentItem, 'id' | 'createdAt'>),
        id: `inv-${Date.now()}`,
        createdAt: new Date().toISOString(),
        history: [{
          id: `rec-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'deposit',
          amount: investmentData.investedAmount,
          notes: 'Aplicação inicial',
        }]
      };
      setInvestments(prev => [newItem, ...prev]);
      if (currentUser?.uid) {
        fsSaveInvestment(currentUser.uid, newItem).catch(console.error);
      }
      addToast('success', 'Investimento adicionado à sua carteira!');
    }
    setIsInvestmentModalOpen(false);
  };

  const handleOpenAporte = (item: InvestmentItem) => {
    setOperatingInvestment(item);
    setIsAporteModalOpen(true);
  };

  const handleConfirmInvestmentOperation = (
    investmentId: string,
    operationType: 'deposit' | 'withdraw' | 'yield',
    amount: number,
    createTransaction: boolean,
    notes?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetInv = investments.find(inv => inv.id === investmentId);
    if (!targetInv) return;

    let newInvested = targetInv.investedAmount;
    let newCurrent = targetInv.currentValue;

    if (operationType === 'deposit') {
      newInvested += amount;
      newCurrent += amount;
    } else if (operationType === 'withdraw') {
      newInvested = Math.max(0, newInvested - amount);
      newCurrent = Math.max(0, newCurrent - amount);
    } else if (operationType === 'yield') {
      newCurrent += amount;
    }

    const newRecord = {
      id: `rec-${Date.now()}`,
      date: todayStr,
      type: operationType,
      amount,
      notes: notes || (operationType === 'deposit' ? 'Aporte' : (operationType === 'withdraw' ? 'Resgate' : 'Rendimento')),
    };

    const updatedInv: InvestmentItem = {
      ...targetInv,
      investedAmount: newInvested,
      currentValue: newCurrent,
      updatedAt: new Date().toISOString(),
      history: [...(targetInv.history || []), newRecord],
    };

    setInvestments(prev => prev.map(inv => inv.id === investmentId ? updatedInv : inv));
    if (currentUser?.uid) {
      fsSaveInvestment(currentUser.uid, updatedInv).catch(console.warn);
    }

    if (createTransaction) {
      let createdTx: Transaction | null = null;
      if (operationType === 'deposit') {
        createdTx = {
          id: `tx-${Date.now()}`,
          description: `Aporte em: ${targetInv.title || 'Investimento'}`,
          amount,
          type: 'expense',
          category: 'Investimentos & Reserva de Emergência',
          date: todayStr,
          status: 'paid',
          scope: 'personal',
          paymentMethod: 'pix',
          notes: notes ? `Aporte: ${notes}` : `Aporte em ${targetInv.title}`,
        };
      } else if (operationType === 'withdraw') {
        createdTx = {
          id: `tx-${Date.now()}`,
          description: `Resgate de: ${targetInv.title || 'Investimento'}`,
          amount,
          type: 'income',
          category: 'Rendimentos & Dividendos',
          date: todayStr,
          status: 'paid',
          scope: 'personal',
          paymentMethod: 'pix',
          notes: notes ? `Resgate: ${notes}` : `Resgate de ${targetInv.title}`,
        };
      }
      if (createdTx) {
        setTransactions(prev => [createdTx!, ...prev]);
        if (currentUser?.uid) {
          fsSaveTransaction(currentUser.uid, createdTx).catch(console.warn);
        }
      }
    }

    addToast(
      'success',
      operationType === 'deposit'
        ? `Aporte de ${formatCurrency(amount)} adicionado!`
        : operationType === 'withdraw'
        ? `Resgate de ${formatCurrency(amount)} concluído!`
        : `Rendimento de ${formatCurrency(amount)} lançado!`
    );
  };

  const handleConfirmPayment = (
    debtId: string,
    amountPaid: number,
    createExpenseTransaction: boolean,
    note?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDebt = debts.find(d => d.id === debtId);
    if (!targetDebt) return;

    const newPaid = targetDebt.paidAmount + amountPaid;
    const isPaidNow = newPaid >= targetDebt.totalAmount;
    const newPaymentRecord: DebtPaymentRecord = {
      id: `pay-${Date.now()}`,
      date: todayStr,
      amount: amountPaid,
      note: note || 'Pagamento / Abatimento de dívida',
    };
    const updatedDebt: DebtItem = {
      ...targetDebt,
      paidAmount: newPaid,
      status: isPaidNow ? 'paid' : targetDebt.status,
      paymentHistory: [...(targetDebt.paymentHistory || []), newPaymentRecord]
    };

    setDebts(prev => prev.map(d => d.id === debtId ? updatedDebt : d));
    if (currentUser?.uid) {
      fsSaveDebt(currentUser.uid, updatedDebt).catch(console.warn);
    }

    if (createExpenseTransaction) {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        description: `Pagamento de Dívida: ${targetDebt.title || 'Dívida'}`,
        amount: amountPaid,
        type: 'expense',
        category: 'Dívidas & Empréstimos',
        date: todayStr,
        status: 'paid',
        scope: 'personal',
        paymentMethod: 'pix',
        notes: note ? `Abatimento de dívida: ${note}` : `Abatimento efetuado para ${targetDebt.title}`,
      };
      setTransactions(prev => [newTx, ...prev]);
      if (currentUser?.uid) {
        fsSaveTransaction(currentUser.uid, newTx).catch(console.warn);
      }
    }

    addToast('success', `Pagamento de ${formatCurrency(amountPaid)} confirmado!`);
  };

  const hasNoData = transactions.length === 0;

  // Render Login Screen if not authenticated
  if (!currentUser) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#0A0C10]" />}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-100 antialiased font-sans pb-28 sm:pb-16 w-full max-w-full overflow-x-hidden">
      
      {/* Toast Notification System */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* Sleek Minimal Header with Search, User CPF, Month Picker & Keyboard Shortcuts */}
      <HeaderNav
        userName={userName}
        userCpf={userCpf}
        userEmail={currentUser.email}
        userPhotoURL={currentUser.photoURL}
        isCloudSynced={Boolean(currentUser.isCloudSynced || currentUser.uid)}
        onConnectCloud={handleConnectCloud}
        onSwitchAccount={handleSwitchAccount}
        hideBalance={hideBalance}
        onToggleHideBalance={() => setHideBalance(!hideBalance)}
        currentMonth={currentMonth}
        onChangeMonth={setCurrentMonth}
        onOpenNewTransaction={() => handleOpenNewTransaction('expense')}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenMonthPicker={() => setIsMonthPickerOpen(true)}
        onOpenKeyboardShortcuts={() => setIsShortcutsOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        transactions={transactions}
        debts={debts}
        investments={investments}
        onSelectTab={setActiveTab}
        notificationCount={dueReminders.length}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
      />

      {/* Fluxo para levar dados salvos só no aparelho para a nuvem */}
      {isMigrationOpen && (
        <Suspense fallback={null}>
          <CloudMigrationModal
            isOpen={isMigrationOpen}
            localUser={currentUser}
            itemCount={transactions.length + debts.length + investments.length}
            onClose={() => setIsMigrationOpen(false)}
            onMigrated={handleMigrationDone}
          />
        </Suspense>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-12">

        {isLocalOnlySession(currentUser) && (
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-gradient-to-r from-amber-950/40 via-[#131A29] to-[#0E131F] border border-amber-700/40 rounded-2xl px-4 py-3">
            <div className="text-xs text-amber-100 leading-relaxed">
              <strong className="text-amber-300">
                {isDemoSession(currentUser) ? 'Você está no modo sem conta.' : 'Seus dados estão salvos só neste aparelho.'}
              </strong>{' '}
              Se limpar o navegador ou trocar de celular, eles somem. Crie sua conta para guardar tudo na nuvem.
            </div>
            <button
              id="btn-open-cloud-migration"
              type="button"
              onClick={() => setIsMigrationOpen(true)}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer active:scale-[0.98]"
            >
              <CloudUpload size={14} />
              Salvar na nuvem
            </button>
          </div>
        )}
        
        {/* Quick Guide Banner - Self-explanatory Onboarding */}
        <QuickGuideBanner
          onOpenNewIncome={() => handleOpenNewTransaction('income')}
          onOpenNewExpense={() => handleOpenNewTransaction('expense')}
          onOpenDebtsTab={() => setActiveTab('debts')}
          onOpenInvestmentsTab={() => setActiveTab('investments')}
          hasData={transactions.length > 0}
        />

        {/* Visual Due Dates & Bills Alert Banner */}
        <DueAlertsBanner
          reminders={dueReminders}
          onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
          onPayDebt={handleOpenPayDebt}
          onMarkExpensePaid={handleToggleTxStatus}
          hideBalance={hideBalance}
        />

        {/* Global Active Search Banner */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#131A29] to-[#0E131F] border border-emerald-800/40 rounded-2xl px-4 py-3 mb-5 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Search size={14} />
              </div>
              <div className="truncate">
                <span className="text-slate-300 font-medium">
                  Buscando em todo o app: <strong className="text-white font-bold">"{searchQuery}"</strong>
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline ml-2">
                  (Filtrando Extrato, Dívidas e Investimentos)
                </span>
              </div>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ml-2"
              title="Limpar pesquisa (Esc)"
            >
              <X size={13} />
              <span>Limpar</span>
            </button>
          </div>
        )}

      {/* Navigation Tabs - 4 Clear Friendly Views */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between sm:border-b border-slate-800/80 sm:pb-3 mb-5 gap-3">
          <div className="hidden sm:grid sm:grid-cols-4 lg:inline-flex lg:items-center gap-1.5 p-1 bg-gradient-to-r from-[#131A29] to-[#0E131F] rounded-2xl border border-slate-800/80 shadow-xs w-full lg:w-auto">
            
            {/* Tab 1: Extrato & Resumo */}
            <button
              id="tab-btn-transactions"
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-[0.98] ${
                activeTab === 'transactions'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt size={16} className={`shrink-0 ${activeTab === 'transactions' ? 'text-emerald-400' : ''}`} />
              <span className="truncate">
                <span className="2xl:hidden">Extrato</span>
                <span className="hidden 2xl:inline">Extrato & Resumo</span>
              </span>
              {monthTransactions.length > 0 && (
                <span className="text-[10px] font-bold bg-[#0A0D14] text-emerald-400 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-xs shrink-0">
                  {monthTransactions.length}
                </span>
              )}
            </button>

            {/* Tab 2: Investimentos & Reserva */}
            <button
              id="tab-btn-investments"
              onClick={() => setActiveTab('investments')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-[0.98] ${
                activeTab === 'investments'
                  ? 'bg-emerald-950/60 text-emerald-300 shadow-xs border border-emerald-800/60'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <TrendingUp size={16} className={`shrink-0 ${activeTab === 'investments' ? 'text-emerald-400' : ''}`} />
              <span className="truncate">
                <span className="2xl:hidden">Investimentos</span>
                <span className="hidden 2xl:inline">Investimentos & Reserva</span>
              </span>
              {investments.length > 0 && (
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-600/40 shadow-xs shrink-0">
                  {investments.length}
                </span>
              )}
            </button>

            {/* Tab 3: Dívidas do Momento */}
            <button
              id="tab-btn-debts"
              onClick={() => setActiveTab('debts')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-[0.98] ${
                activeTab === 'debts'
                  ? 'bg-amber-950/60 text-amber-300 shadow-xs border border-amber-800/60'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Building2 size={16} className={`shrink-0 ${activeTab === 'debts' ? 'text-amber-400' : ''}`} />
              <span className="truncate">Dívidas</span>
              {activeDebts.length > 0 && (
                <span className="text-[10px] font-bold bg-amber-900/60 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-600/40 shadow-xs shrink-0">
                  {activeDebts.length}
                </span>
              )}
            </button>

            {/* Tab 4: Gráficos */}
            <button
              id="tab-btn-charts"
              onClick={() => setActiveTab('charts')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-[0.98] ${
                activeTab === 'charts'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 size={16} className={`shrink-0 ${activeTab === 'charts' ? 'text-emerald-400' : ''}`} />
              <span className="truncate">Gráficos</span>
            </button>

          </div>

          {/* Quick Action in Tab Bar */}
          <div className="grid grid-cols-4 sm:flex sm:flex-wrap lg:flex-nowrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
            <button
              onClick={() => handleOpenNewTransaction('income')}
              className="justify-center text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/40 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus size={13} />
              <span>Receita</span>
            </button>
            <button
              onClick={() => handleOpenNewTransaction('expense')}
              className="justify-center text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus size={13} />
              <span>Despesa</span>
            </button>
            <button
              onClick={handleOpenNewDebt}
              className="justify-center text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus size={13} />
              <span>Dívida</span>
            </button>
            <button
              onClick={handleOpenNewInvestment}
              className="justify-center text-xs font-bold text-teal-400 hover:text-teal-300 bg-teal-950/30 hover:bg-teal-900/40 border border-teal-800/40 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus size={13} />
              <span>Investir</span>
            </button>
          </div>
        </div>

        {/* TAB 1: EXTRATO & RESUMO */}
        {activeTab === 'transactions' && (
          <div className="space-y-5">
            
            {/* Overview KPI Cards */}
            <OverviewCards
              totalBalance={netBalance}
              monthIncome={monthIncome}
              monthExpense={monthExpense}
              netBalance={netBalance}
              hideBalance={hideBalance}
              pendingIncome={pendingIncome}
              pendingExpense={pendingExpense}
              onOpenNewExpense={() => handleOpenNewTransaction('expense')}
              onOpenNewIncome={() => handleOpenNewTransaction('income')}
              onOpenCharts={() => setActiveTab('charts')}
            />

            {/* Didactic 50/30/20 Financial Intelligence & Recommendations */}
            <FinancialEducationCard
              monthIncome={monthIncome}
              monthExpense={monthExpense}
              monthTransactions={monthTransactions}
              hideBalance={hideBalance}
              onOpenInvestments={() => setActiveTab('investments')}
            />

            {/* Reassuring Active Debts Banner if any exist */}
            {activeDebts.length > 0 && (
              <div className="bg-gradient-to-r from-[#131A29] to-[#0E131F] rounded-2xl p-4 border border-amber-900/40 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">
                      Você tem {activeDebts.length} {activeDebts.length === 1 ? 'dívida ativa cadastrada' : 'dívidas ativas cadastradas'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Saldo total pendente a quitar: <strong className="text-amber-400">{formatCurrency(totalDebtsRemaining)}</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('debts')}
                  className="text-xs font-bold text-amber-300 hover:text-white bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
                >
                  <span>Ver Dívidas & Abater</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

            {/* Empty state hint */}
            {hasNoData && (
              <div className="bg-[#11141D] rounded-3xl p-6 border border-slate-800 text-center mb-5">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                  <Sparkles size={22} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Seu gerenciador financeiro está pronto
                </h3>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Sem complicação para qualquer idade. Adicione sua primeira despesa (com opção de parcelar) ou dívida para começar seu controle.
                </p>
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => handleOpenNewTransaction('income')}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                  >
                    + Registrar Receita
                  </button>
                  <button
                    onClick={() => handleOpenNewTransaction('expense')}
                    className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-950/40 cursor-pointer"
                  >
                    + Registrar Despesa (ou Parcelada)
                  </button>
                  <button
                    onClick={handleOpenNewDebt}
                    className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer"
                  >
                    + Registrar Dívida
                  </button>
                </div>
              </div>
            )}

            {/* Smart Transaction List */}
            <TransactionList
              transactions={monthTransactions}
              categories={categories}
              hideBalance={hideBalance}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onToggleStatus={handleToggleTxStatus}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenNewTransaction={() => handleOpenNewTransaction('expense')}
              onClearAllTransactions={handleClearAccountTransactions}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          </div>
        )}

        {/* TAB 2: INVESTIMENTOS & RESERVA */}
        <Suspense fallback={<TabLoadingSkeleton />}>
          {activeTab === 'investments' && (
            <InvestmentsArea
              investments={investments}
              onOpenNewInvestment={handleOpenNewInvestment}
              onEditInvestment={handleEditInvestment}
              onDeleteInvestment={handleDeleteInvestment}
              onOpenAporte={handleOpenAporte}
              hideBalance={hideBalance}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
            />
          )}

          {/* TAB 3: DÍVIDAS DO MOMENTO */}
          {activeTab === 'debts' && (
            <DebtsArea
              debts={debts}
              onOpenNewDebt={handleOpenNewDebt}
              onEditDebt={handleEditDebt}
              onDeleteDebt={handleDeleteDebt}
              onOpenPayDebt={handleOpenPayDebt}
              hideBalance={hideBalance}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
            />
          )}

          {/* TAB 4: GRÁFICOS DE ENTRADAS E SAÍDAS */}
          {activeTab === 'charts' && (
            <CashFlowChartsArea
              transactions={transactions}
              currentMonth={currentMonth}
              onChangeMonth={setCurrentMonth}
              hideBalance={hideBalance}
              onOpenNewIncome={() => handleOpenNewTransaction('income')}
              onOpenNewExpense={() => handleOpenNewTransaction('expense')}
            />
          )}
        </Suspense>

      </main>

      {/* MODALS */}
      {isTxModalOpen && (
        <Suspense fallback={null}>
          <TransactionModal
            isOpen={isTxModalOpen}
            onClose={() => setIsTxModalOpen(false)}
            onSave={handleSaveTransaction}
            editingTransaction={editingTx}
            defaultType={defaultTxType}
            categories={categories}
          />
        </Suspense>
      )}

      {isDebtModalOpen && (
        <Suspense fallback={null}>
          <DebtModal
            isOpen={isDebtModalOpen}
            onClose={() => setIsDebtModalOpen(false)}
            onSave={handleSaveDebt}
            editingDebt={editingDebt}
          />
        </Suspense>
      )}

      {isPayDebtModalOpen && (
        <Suspense fallback={null}>
          <PayDebtModal
            isOpen={isPayDebtModalOpen}
            onClose={() => setIsPayDebtModalOpen(false)}
            debt={payingDebt}
            currentMonth={currentMonth}
            onConfirmPayment={handleConfirmPayment}
          />
        </Suspense>
      )}

      {isInvestmentModalOpen && (
        <Suspense fallback={null}>
          <InvestmentModal
            isOpen={isInvestmentModalOpen}
            onClose={() => setIsInvestmentModalOpen(false)}
            onSave={handleSaveInvestment}
            editingInvestment={editingInvestment}
          />
        </Suspense>
      )}

      {isAporteModalOpen && (
        <Suspense fallback={null}>
          <InvestmentAporteModal
            isOpen={isAporteModalOpen}
            onClose={() => setIsAporteModalOpen(false)}
            investment={operatingInvestment}
            currentMonth={currentMonth}
            onConfirmOperation={handleConfirmInvestmentOperation}
          />
        </Suspense>
      )}

      {isExportModalOpen && (
        <Suspense fallback={null}>
          <ExportReportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            currentMonth={currentMonth}
            transactions={transactions}
            userName={userName}
            availableMonths={availableMonths}
          />
        </Suspense>
      )}

      {isMonthPickerOpen && (
        <Suspense fallback={null}>
          <MonthPickerModal
            isOpen={isMonthPickerOpen}
            onClose={() => setIsMonthPickerOpen(false)}
            currentMonth={currentMonth}
            onSelectMonth={(m) => {
              setCurrentMonth(m);
              addToast('info', `Mês alterado para ${m}`);
            }}
          />
        </Suspense>
      )}

      {isShortcutsOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />
        </Suspense>
      )}

      {/* Notification Center Modal */}
      {isNotificationCenterOpen && (
        <Suspense fallback={null}>
          <NotificationCenterModal
            isOpen={isNotificationCenterOpen}
            onClose={() => setIsNotificationCenterOpen(false)}
            reminders={dueReminders}
            onPayDebt={handleOpenPayDebt}
            onMarkExpensePaid={handleToggleTxStatus}
            onGoToDebtsTab={() => {
              setActiveTab('debts');
              setIsNotificationCenterOpen(false);
            }}
            onGoToTransactionsTab={() => {
              setActiveTab('transactions');
              setIsNotificationCenterOpen(false);
            }}
            hideBalance={hideBalance}
          />
        </Suspense>
      )}

      {/* Mobile-first Bottom Bar for Phones */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewTransaction={() => handleOpenNewTransaction('expense')}
        transactionsCount={monthTransactions.length}
        investmentsCount={investments.length}
        debtsCount={activeDebts.length}
      />

    </div>
  );
}
