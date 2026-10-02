import React, { useState, useEffect, useMemo } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { OverviewCards } from './components/OverviewCards';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { ExportReportModal } from './components/ExportReportModal';
import { CashFlowChartsArea } from './components/CashFlowChartsArea';
import { LoginScreen } from './components/LoginScreen';
import { DebtsArea } from './components/DebtsArea';
import { DebtModal } from './components/DebtModal';
import { PayDebtModal } from './components/PayDebtModal';
import { QuickGuideBanner } from './components/QuickGuideBanner';
import { FinancialEducationCard } from './components/FinancialEducationCard';
import { InvestmentsArea } from './components/InvestmentsArea';
import { InvestmentModal } from './components/InvestmentModal';
import { InvestmentAporteModal } from './components/InvestmentAporteModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { MonthPickerModal } from './components/MonthPickerModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { DueAlertsBanner } from './components/DueAlertsBanner';
import {
  getDueReminders,
  checkAndSendDailyNotification,
  DueReminder
} from './services/notificationService';
import { AuthSessionUser } from './components/LoginScreen';
import {
  auth,
  googleProvider,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged
} from './firebase';
import {
  subscribeToTransactions,
  saveTransaction as fsSaveTransaction,
  deleteTransaction as fsDeleteTransaction,
  subscribeToDebts,
  saveDebt as fsSaveDebt,
  deleteDebt as fsDeleteDebt,
  subscribeToInvestments,
  saveInvestment as fsSaveInvestment,
  deleteInvestment as fsDeleteInvestment,
  syncLocalDataToFirestore,
  saveUserProfile
} from './services/firestoreService';

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
  Cloud
} from 'lucide-react';

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

  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('gfp_hide_balance') === 'true';
  });

  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [activeTab, setActiveTab] = useState<'transactions' | 'investments' | 'debts' | 'charts'>('transactions');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('gfp_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((t: any) => !t.id?.startsWith('tx-seed-') && !['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6', 'tx-7', 'tx-8', 'tx-9', 'tx-10'].includes(t.id));
      } catch (e) {
        return [];
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  // Debts state (dívidas do momento)
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    const saved = localStorage.getItem('aquigastos_debts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Investments state (dinheiro investido e reservas)
  const [investments, setInvestments] = useState<InvestmentItem[]>(() => {
    const saved = localStorage.getItem('aquigastos_investments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'inv-1',
        title: 'Reserva de Emergência (100% CDI)',
        institution: 'Nubank',
        category: 'emergency_fund',
        investedAmount: 3500,
        currentValue: 3680,
        targetAmount: 12000,
        yieldRate: '100% do CDI (Liquidez Diária)',
        notes: 'Resgate imediato em caso de emergência ou despesas imprevistas.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'inv-2',
        title: 'Tesouro Selic 2029',
        institution: 'Tesouro Direto / XP',
        category: 'fixed_income',
        investedAmount: 2000,
        currentValue: 2115,
        yieldRate: 'Taxa Selic + 0,15% a.a.',
        notes: 'Garantia total do Governo Federal, seguro e conservador.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'inv-3',
        title: 'Fundo Imobiliário MXRF11',
        institution: 'Banco Inter',
        category: 'variable_income',
        investedAmount: 1000,
        currentValue: 1065,
        yieldRate: 'Dividend Yield ~11.8% a.a.',
        notes: 'Rendimento mensal de aluguéis isento de IR.',
        createdAt: new Date().toISOString(),
      }
    ];
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
  const [firebaseUid, setFirebaseUid] = useState<string | null>(() => auth.currentUser?.uid || null);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUid(fbUser.uid);
        const cloudUser: AuthSessionUser = {
          name: fbUser.displayName || 'Usuário Google',
          cpf: fbUser.email || fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
          isCloudSynced: true,
        };
        setCurrentUser(cloudUser);
        localStorage.setItem('aquigastos_active_session', JSON.stringify(cloudUser));

        try {
          await saveUserProfile(fbUser.uid, {
            displayName: cloudUser.name,
            email: cloudUser.email,
            hideBalance,
          });
        } catch (e) {
          console.warn('Profile sync notice:', e);
        }
      } else {
        setFirebaseUid(null);
      }
    });
    return () => unsubscribe();
  }, [hideBalance]);

  // Real-time Firestore sync when authenticated with Firebase
  useEffect(() => {
    if (!firebaseUid) return;

    const uid = firebaseUid;

    const unsubTxs = subscribeToTransactions(
      uid,
      (cloudTxs) => {
        // If user already had local transactions, and cloud is completely empty, offer / auto sync local data
        if (cloudTxs.length === 0) {
          const localTxs = JSON.parse(localStorage.getItem('gfp_transactions') || '[]');
          const localDebts = JSON.parse(localStorage.getItem('aquigastos_debts') || '[]');
          const localInvs = JSON.parse(localStorage.getItem('aquigastos_investments') || '[]');
          if (localTxs.length > 0 || localDebts.length > 0 || localInvs.length > 0) {
            syncLocalDataToFirestore(uid, localTxs, localDebts, localInvs)
              .then(({ count }) => {
                if (count > 0) {
                  addToast('success', `${count} registros salvos na nuvem Firestore!`);
                }
              })
              .catch(console.error);
            return;
          }
        }
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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('gfp_hide_balance', String(hideBalance));
  }, [hideBalance]);

  useEffect(() => {
    localStorage.setItem('gfp_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('aquigastos_debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('aquigastos_investments', JSON.stringify(investments));
  }, [investments]);

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
  };

  const handleLogout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error('Sign out error', e);
    }
    setCurrentUser(null);
    localStorage.removeItem('aquigastos_active_session');
    addToast('info', 'Você saiu da sua conta.');
  };

  const handleConnectCloud = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const cloudUser: AuthSessionUser = {
        name: user.displayName || 'Usuário Google',
        cpf: user.email || 'Conta Google',
        uid: user.uid,
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        isCloudSynced: true,
      };
      setCurrentUser(cloudUser);
      localStorage.setItem('aquigastos_active_session', JSON.stringify(cloudUser));
      addToast('success', 'Conta Google conectada ao Firebase Firestore!');

      // Sync local records to cloud
      const res = await syncLocalDataToFirestore(user.uid, transactions, debts, investments);
      if (res.count > 0) {
        addToast('success', `${res.count} registros sincronizados na nuvem!`);
      }
    } catch (err: any) {
      console.error('Connect cloud error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        addToast('error', 'Falha ao conectar com o Google no momento.');
      }
    }
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
      addToast('success', `${newTx.type === 'income' ? 'Receita' : 'Despesa'} registrada com sucesso!`);
    }
    setIsTxModalOpen(false);
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
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-100 antialiased font-sans pb-28 sm:pb-16 w-full">
      
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

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-12">
        
        {/* Quick Guide Banner - Self-explanatory Onboarding */}
        <QuickGuideBanner
          onOpenNewIncome={() => handleOpenNewTransaction('income')}
          onOpenNewExpense={() => handleOpenNewTransaction('expense')}
          onOpenDebtsTab={() => setActiveTab('debts')}
          onOpenInvestmentsTab={() => setActiveTab('investments')}
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800/80 pb-3 mb-5 gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:inline-flex lg:items-center gap-1.5 p-1 bg-gradient-to-r from-[#131A29] to-[#0E131F] rounded-2xl border border-slate-800/80 shadow-xs w-full lg:w-auto">
            
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
                <span className="sm:hidden">Extrato</span>
                <span className="hidden sm:inline">Extrato & Resumo</span>
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
                <span className="sm:hidden">Investimentos</span>
                <span className="hidden sm:inline">Investimentos & Reserva</span>
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
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => handleOpenNewTransaction('income')}
              className="justify-center text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus size={13} />
              <span>Receita</span>
            </button>
            <button
              onClick={() => handleOpenNewTransaction('expense')}
              className="justify-center text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus size={13} />
              <span>Despesa</span>
            </button>
            <button
              onClick={handleOpenNewDebt}
              className="justify-center text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus size={13} />
              <span>Dívida</span>
            </button>
            <button
              onClick={handleOpenNewInvestment}
              className="justify-center text-xs font-bold text-teal-400 hover:text-teal-300 bg-teal-950/30 hover:bg-teal-900/40 border border-teal-800/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
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
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          </div>
        )}

        {/* TAB 2: INVESTIMENTOS & RESERVA */}
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

      </main>

      {/* MODALS */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTx}
        defaultType={defaultTxType}
        categories={categories}
      />

      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSave={handleSaveDebt}
        editingDebt={editingDebt}
      />

      <PayDebtModal
        isOpen={isPayDebtModalOpen}
        onClose={() => setIsPayDebtModalOpen(false)}
        debt={payingDebt}
        currentMonth={currentMonth}
        onConfirmPayment={handleConfirmPayment}
      />

      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        onSave={handleSaveInvestment}
        editingInvestment={editingInvestment}
      />

      <InvestmentAporteModal
        isOpen={isAporteModalOpen}
        onClose={() => setIsAporteModalOpen(false)}
        investment={operatingInvestment}
        currentMonth={currentMonth}
        onConfirmOperation={handleConfirmInvestmentOperation}
      />

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentMonth={currentMonth}
        transactions={transactions}
        userName={userName}
        availableMonths={availableMonths}
      />

      <MonthPickerModal
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        currentMonth={currentMonth}
        onSelectMonth={(m) => {
          setCurrentMonth(m);
          addToast('info', `Mês alterado para ${m}`);
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Notification Center Modal */}
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
