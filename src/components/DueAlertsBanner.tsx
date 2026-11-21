import React, { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { DueReminder } from '../services/notificationService';
import { formatCurrency, formatDaysRemainingLabel } from '../utils/formatters';
import { DebtItem } from '../types';

interface DueAlertsBannerProps {
  reminders: DueReminder[];
  onOpenNotificationCenter: () => void;
  onPayDebt: (debt: DebtItem) => void;
  onMarkExpensePaid: (txId: string) => void;
  hideBalance?: boolean;
}

/**
 * Contas vencendo: um cartão discreto com as 2 mais urgentes e um botão para pagar/baixar.
 * A cor só aparece no pontinho e no prazo, para o aviso chamar atenção sem gritar.
 */
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
  const totalAmount = reminders.reduce((sum, r) => sum + r.amount, 0);
  const featured = reminders.slice(0, 2);

  const dotColor = overdueCount > 0 ? 'bg-rose-400' : todayCount > 0 ? 'bg-amber-300' : 'bg-slate-400';
  const upcoming = reminders.length - overdueCount;
  const title =
    overdueCount > 0
      ? `${overdueCount} ${overdueCount === 1 ? 'conta atrasada' : 'contas atrasadas'}${upcoming > 0 ? ` e ${upcoming} vencendo` : ''}`
      : todayCount > 0
        ? `${todayCount} ${todayCount === 1 ? 'conta vence' : 'contas vencem'} hoje`
        : `${reminders.length} ${reminders.length === 1 ? 'conta vence' : 'contas vencem'} esta semana`;

  return (
    <section aria-label="Contas vencendo" className="bg-slate-900 rounded-3xl p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-100">{title}</h2>
          <p className="text-[13px] text-slate-400 tabular-nums">
            {hideBalance ? '••••••' : formatCurrency(totalAmount)} no total
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="w-9 h-9 -mr-1.5 flex items-center justify-center text-slate-500 hover:text-slate-200 rounded-full cursor-pointer"
          aria-label="Ocultar aviso por enquanto"
        >
          <X size={16} />
        </button>
      </div>

      <ul className="mt-2">
        {featured.map((item) => {
          const label = formatDaysRemainingLabel(item.daysDiff);
          const isDebt = item.sourceType === 'debt' && item.rawDebt;
          return (
            <li key={item.id} className="flex items-center gap-3 min-h-[52px]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{item.title}</p>
                <p className={`text-xs mt-0.5 ${item.daysDiff < 0 ? 'text-rose-400' : item.daysDiff === 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                  {label.text}
                </p>
              </div>
              <span className="text-sm text-slate-100 tabular-nums">
                {hideBalance ? '••••••' : formatCurrency(item.amount)}
              </span>
              <button
                type="button"
                onClick={() => (isDebt ? onPayDebt(item.rawDebt!) : onMarkExpensePaid(item.sourceId))}
                className="px-3 min-h-[34px] rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer active:scale-95"
              >
                {isDebt ? 'Pagar' : 'Paguei'}
              </button>
            </li>
          );
        })}
      </ul>

      {reminders.length > featured.length && (
        <button
          type="button"
          onClick={onOpenNotificationCenter}
          className="mt-1 w-full flex items-center justify-between min-h-[40px] text-[13px] text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <span>Ver todas as {reminders.length} contas</span>
          <ChevronRight size={15} />
        </button>
      )}
    </section>
  );
};
