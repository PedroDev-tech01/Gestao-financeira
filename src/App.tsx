import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { QuickGuideBanner } from './components/QuickGuideBanner';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ToastNotification } from './components/ToastNotification';
import { DueAlertsBanner } from './components/DueAlertsBanner';
import { AppTabs, AppTab } from './components/AppTabs';
import { TransactionsTab } from './components/TransactionsTab';
import { LocalAccountBanner, SearchBanner } from './components/AppBanners';
import {
  LoginScreen,
  TransactionModal,
  ExportReportModal,
  CashFlowChartsArea,
  DebtsArea,
  DebtModal,
  PayDebtModal,
  InvestmentsArea,
  InvestmentModal,
  InvestmentAporteModal,
  MonthPickerModal,
  KeyboardShortcutsModal,
  NotificationCenterModal,
  CloudMigrationModal,
  TabLoadingSkeleton,
} from './components/lazyComponents';
import { useToasts } from './hooks/useToasts';
import { useSessionState, useAuthSession } from './hooks/useAuthSession';
import { useFinanceData } from './hooks/useFinanceData';
import { useFinanceActions, SaveTransactionInput } from './hooks/useFinanceActions';
import { useMonthSummary } from './hooks/useMonthSummary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { getDueReminders, checkAndSendDailyNotification } from './services/notificationService';
import { isLocalOnlySession, isDemoSession } from './utils/legacyAccounts';
import { INITIAL_CATEGORIES } from './data/initialData';
import type { Transaction, TransactionType, DebtItem, InvestmentItem } from './types';
import { getPreviousMonth, getNextMonth } from './utils/formatters';

const TAB_BY_INDEX: Record<1 | 2 | 3 | 4, AppTab> = {
  1: 'transactions',
  2: 'investments',
  3: 'debts',
  4: 'charts',
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function App() {
  const { toasts, addToast, removeToast } = useToasts();

  // Sessão (quem está usando) + dados da conta + operações sobre os dados
  const session = useSessionState();
  const { currentUser, firebaseUid } = session;
  const data = useFinanceData(session.initialUser, currentUser, firebaseUid);
  const { transactions, debts, investments, hideBalance, setHideBalance } = data;
  const { handleLoginSuccess, handleLogout, handleSwitchAccount } = useAuthSession(session, data, addToast);
  const actions = useFinanceActions(currentUser, firebaseUid, data, addToast);

  const userName = currentUser ? currentUser.name : 'Minhas Finanças';
  const userCpf = currentUser ? currentUser.cpf : undefined;
  const categories = INITIAL_CATEGORIES;

  // Navegação
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth);
  const [activeTab, setActiveTab] = useState<AppTab>('transactions');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    monthTransactions,
    monthIncome,
    monthExpense,
    pendingIncome,
    pendingExpense,
    netBalance,
    activeDebts,
    totalDebtsRemaining,
    availableMonths,
  } = useMonthSummary(transactions, debts, currentMonth);

  // Janelas (modais)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('expense');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtItem | null>(null);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentItem | null>(null);
  const [isAporteModalOpen, setIsAporteModalOpen] = useState(false);
  const [operatingInvestment, setOperatingInvestment] = useState<InvestmentItem | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);

  // Lembretes de vencimento (próximos 7 dias e atrasados)
  const dueReminders = useMemo(() => getDueReminders(debts, transactions, 7), [debts, transactions]);
  useEffect(() => {
    if (!currentUser || dueReminders.length === 0) return;
    checkAndSendDailyNotification(dueReminders).catch(console.warn);
  }, [currentUser, dueReminders]);

  // ---- Abrir janelas ----
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
  const handleOpenNewDebt = () => {
    setEditingDebt(null);
    setIsDebtModalOpen(true);
  };
  const handleEditDebt = (debt: DebtItem) => {
    setEditingDebt(debt);
    setIsDebtModalOpen(true);
  };
  const handleOpenPayDebt = (debt: DebtItem) => {
    setPayingDebt(debt);
    setIsPayDebtModalOpen(true);
  };
  const handleOpenNewInvestment = () => {
    setEditingInvestment(null);
    setIsInvestmentModalOpen(true);
  };
  const handleEditInvestment = (item: InvestmentItem) => {
    setEditingInvestment(item);
    setIsInvestmentModalOpen(true);
  };
  const handleOpenAporte = (item: InvestmentItem) => {
    setOperatingInvestment(item);
    setIsAporteModalOpen(true);
  };
  const closeAllModals = () => {
    setIsTxModalOpen(false);
    setIsDebtModalOpen(false);
    setIsPayDebtModalOpen(false);
    setIsInvestmentModalOpen(false);
    setIsAporteModalOpen(false);
    setIsExportModalOpen(false);
    setIsMonthPickerOpen(false);
    setIsShortcutsOpen(false);
    setIsNotificationCenterOpen(false);
  };

  // ---- Salvar (fecham a janela quando faz sentido) ----
  const handleSaveTransaction = (txData: SaveTransactionInput) => {
    // Lançamento novo deixa a janela aberta para o próximo; edição fecha.
    if (actions.saveTransaction(txData) === 'updated') setIsTxModalOpen(false);
  };
  const handleSaveDebt = (debtData: Parameters<typeof actions.saveDebt>[0]) => {
    actions.saveDebt(debtData);
    setIsDebtModalOpen(false);
  };
  const handleSaveInvestment = (investmentData: Parameters<typeof actions.saveInvestment>[0]) => {
    actions.saveInvestment(investmentData);
    setIsInvestmentModalOpen(false);
  };
  const handleDeleteTransaction = actions.deleteTransaction;
  const handleToggleTxStatus = actions.toggleTransactionStatus;
  const handleClearAccountTransactions = actions.clearAccountTransactions;
  const handleDeleteDebt = actions.deleteDebt;
  const handleConfirmPayment = actions.payDebt;
  const handleDeleteInvestment = actions.deleteInvestment;
  const handleConfirmInvestmentOperation = actions.investmentOperation;

  // ---- Nuvem ----
  // Conta salva só no aparelho -> abre o fluxo que cria a conta na nuvem e leva os dados junto.
  const handleConnectCloud = () => {
    if (isLocalOnlySession(currentUser)) setIsMigrationOpen(true);
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

  useKeyboardShortcuts({
    onEscape: closeAllModals,
    onNewTransaction: () => handleOpenNewTransaction('expense'),
    onToggleHideBalance: () => setHideBalance((prev) => !prev),
    onSelectTab: (i) => setActiveTab(TAB_BY_INDEX[i]),
    onPreviousMonth: () => setCurrentMonth((prev) => getPreviousMonth(prev)),
    onNextMonth: () => setCurrentMonth((prev) => getNextMonth(prev)),
    onShowShortcuts: () => setIsShortcutsOpen(true),
  });

  if (!currentUser) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#0A0C10]" />}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-100 antialiased font-sans pb-28 sm:pb-16 w-full max-w-full overflow-x-hidden">
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-12">
        {isLocalOnlySession(currentUser) && (
          <LocalAccountBanner isDemo={isDemoSession(currentUser)} onSaveToCloud={() => setIsMigrationOpen(true)} />
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

        {searchQuery.trim() && <SearchBanner searchQuery={searchQuery} onClear={() => setSearchQuery('')} />}

        <AppTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          monthTransactionsCount={monthTransactions.length}
          investmentsCount={investments.length}
          activeDebtsCount={activeDebts.length}
          onNewIncome={() => handleOpenNewTransaction('income')}
          onNewExpense={() => handleOpenNewTransaction('expense')}
          onNewDebt={handleOpenNewDebt}
          onNewInvestment={handleOpenNewInvestment}
        />

        {activeTab === 'transactions' && (
          <TransactionsTab
            monthTransactions={monthTransactions}
            categories={categories}
            hideBalance={hideBalance}
            monthIncome={monthIncome}
            monthExpense={monthExpense}
            netBalance={netBalance}
            pendingIncome={pendingIncome}
            pendingExpense={pendingExpense}
            activeDebts={activeDebts}
            totalDebtsRemaining={totalDebtsRemaining}
            hasNoData={transactions.length === 0}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleOpenNewTransaction={handleOpenNewTransaction}
            handleOpenNewDebt={handleOpenNewDebt}
            handleEditTransaction={handleEditTransaction}
            handleDeleteTransaction={handleDeleteTransaction}
            handleToggleTxStatus={handleToggleTxStatus}
            handleClearAccountTransactions={handleClearAccountTransactions}
            openExport={() => setIsExportModalOpen(true)}
            goToTab={setActiveTab}
          />
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
