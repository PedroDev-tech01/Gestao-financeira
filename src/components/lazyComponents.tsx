import React, { lazy } from 'react';

// Partes carregadas só quando forem usadas (deixa a abertura do app bem mais rápida)
export const LoginScreen = lazy(() => import('./LoginScreen').then((m) => ({ default: m.LoginScreen })));
export const TransactionModal = lazy(() => import('./TransactionModal').then((m) => ({ default: m.TransactionModal })));
export const ExportReportModal = lazy(() => import('./ExportReportModal').then((m) => ({ default: m.ExportReportModal })));
export const CashFlowChartsArea = lazy(() => import('./CashFlowChartsArea').then((m) => ({ default: m.CashFlowChartsArea })));
export const DebtsArea = lazy(() => import('./DebtsArea').then((m) => ({ default: m.DebtsArea })));
export const DebtModal = lazy(() => import('./DebtModal').then((m) => ({ default: m.DebtModal })));
export const PayDebtModal = lazy(() => import('./PayDebtModal').then((m) => ({ default: m.PayDebtModal })));
export const InvestmentsArea = lazy(() => import('./InvestmentsArea').then((m) => ({ default: m.InvestmentsArea })));
export const InvestmentModal = lazy(() => import('./InvestmentModal').then((m) => ({ default: m.InvestmentModal })));
export const InvestmentAporteModal = lazy(() => import('./InvestmentAporteModal').then((m) => ({ default: m.InvestmentAporteModal })));
export const MonthPickerModal = lazy(() => import('./MonthPickerModal').then((m) => ({ default: m.MonthPickerModal })));
export const KeyboardShortcutsModal = lazy(() => import('./KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal })));
export const NotificationCenterModal = lazy(() => import('./NotificationCenterModal').then((m) => ({ default: m.NotificationCenterModal })));
export const CloudMigrationModal = lazy(() => import('./CloudMigrationModal').then((m) => ({ default: m.CloudMigrationModal })));

export function TabLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-3xl bg-slate-800/40" />
        ))}
      </div>
      <div className="h-64 rounded-3xl bg-slate-800/30" />
    </div>
  );
}
