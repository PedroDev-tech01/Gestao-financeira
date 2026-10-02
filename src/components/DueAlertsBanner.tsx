import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  ChevronRight,
  X,
  DollarSign,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { DueReminder } from '../services/notificationService';
import { formatCurrency, formatDateBR, formatDaysRemainingLabel } from '../utils/formatters';
import { DebtItem } from '../types';

interface DueAlertsBannerProps {
  reminders: DueReminder[];
  onOpenNotificationCenter: () => void;
  onPayDebt: (debt: DebtItem) => void;
  onMarkExpensePaid: (txId: string) => void;
  hideBalance?: boolean;
}

export const DueAlertsBanner: React.FC<DueAlertsBannerProps> = ({
  reminders,
  onOpenNotificationCenter,
  onPayDebt,
  onMarkExpensePaid,
  hideBalance = false,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || reminders.length === 0) return null;

  const overdueCount = reminders.filter((r) => r.urgency === 'overdue').length;
  const todayCount = reminders.filter((r) => r.urgency === 'today').length;
  const hasCritical = overdueCount > 0 || todayCount > 0;

  const totalAmount = reminders.reduce((sum, r) => sum + r.amount, 0);
  const featured = reminders.slice(0, 2);

  return (
    <div
      className={`mb-5 rounded-2xl border transition-all duration-300 shadow-md relative overflow-hidden ${
        overdueCount > 0
          ? 'bg-gradient-to-r from-rose-950/50 via-[#14121A] to-[#0E131F] border-rose-800/60'
          : todayCount > 0
          ? 'bg-gradient-to-r from-amber-950/50 via-[#141824] to-[#0E131F] border-amber-800/60'
          : 'bg-gradient-to-r from-[#141B29] to-[#0E131F] border-sky-800/50'
      }`}
    >
      {/* Top Banner Status Bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              overdueCount > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : todayCount > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}
          >
            {overdueCount > 0 ? (
              <AlertTriangle size={18} />
            ) : todayCount > 0 ? (
              <Clock size={18} />
            ) : (
              <Bell size={18} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-100">
                {overdueCount > 0
                  ? `Atenção: ${overdueCount} conta(s) em atraso!`
                  : todayCount > 0
                  ? `Lembrete: ${todayCount} conta(s) vencem hoje!`
                  : `Contas a vencer nos próximos dias (${reminders.length})`}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Total: <strong className="text-slate-100">{hideBalance ? '••••••' : formatCurrency(totalAmount)}</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate hidden sm:block">
              Evite juros e multas mantendo seus pagamentos em dia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenNotificationCenter}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs ${
              overdueCount > 0
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                : todayCount > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <span>Ver Contas ({reminders.length})</span>
            <ChevronRight size={13} />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Ocultar aviso temporariamente"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Mini Cards of Immediate Pending Due Items */}
      <div className="px-3.5 sm:px-4 pb-3.5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {featured.map((item) => {
          const labelInfo = formatDaysRemainingLabel(item.daysDiff);
          const isDebt = item.sourceType === 'debt';

          return (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-[#0A0D14]/70 border border-slate-800/80 flex items-center justify-between gap-2.5 text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${labelInfo.bg} ${labelInfo.color}`}>
                    {labelInfo.text}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {item.dueDate ? formatDateBR(item.dueDate) : ''}
                  </span>
                </div>
                <div className="font-bold text-slate-200 truncate">{item.title}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-black text-slate-100">
                  {hideBalance ? '••••••' : formatCurrency(item.amount)}
                </span>
                {isDebt && item.rawDebt ? (
                  <button
                    onClick={() => onPayDebt(item.rawDebt!)}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Pagar
                  </button>
                ) : (
                  <button
                    onClick={() => onMarkExpensePaid(item.sourceId)}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Baixar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
