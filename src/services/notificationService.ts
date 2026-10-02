import { DebtItem, Transaction } from '../types';
import { formatCurrency, getDaysDifferenceFromToday } from '../utils/formatters';

export type ReminderUrgency = 'overdue' | 'today' | 'upcoming';

export interface DueReminder {
  id: string;
  sourceType: 'debt' | 'expense';
  sourceId: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  daysDiff: number; // < 0: overdue, 0: today, > 0: days remaining
  urgency: ReminderUrgency;
  creditorOrCategory?: string;
  isInstallment?: boolean;
  installmentText?: string;
  rawDebt?: DebtItem;
  rawTx?: Transaction;
}

export interface NotificationSettings {
  enabled: boolean;
  notifyOnDay: boolean;
  notify3DaysBefore: boolean;
  notify7DaysBefore: boolean;
  notifyOverdue: boolean;
  soundEnabled: boolean;
}

const SETTINGS_KEY = 'aquigastos_notification_settings';
const LAST_NOTIFIED_KEY = 'aquigastos_last_notified_date';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  notifyOnDay: true,
  notify3DaysBefore: true,
  notify7DaysBefore: true,
  notifyOverdue: true,
  soundEnabled: true,
};

/**
 * Load user notification preferences from localStorage
 */
export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to parse notification settings', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

/**
 * Save notification preferences to localStorage
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save notification settings', e);
  }
}

/**
 * Scan debts and pending expense transactions to find due date reminders
 */
export function getDueReminders(
  debts: DebtItem[],
  transactions: Transaction[],
  maxDaysAhead = 7
): DueReminder[] {
  const reminders: DueReminder[] = [];

  // 1. Debts with due dates
  debts.forEach((debt) => {
    if (debt.status === 'active' && debt.dueDate) {
      const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
      if (remaining > 0) {
        const daysDiff = getDaysDifferenceFromToday(debt.dueDate);
        // We include overdue debts (up to 60 days overdue) or upcoming (up to maxDaysAhead)
        if (daysDiff >= -60 && daysDiff <= maxDaysAhead) {
          let urgency: ReminderUrgency = 'upcoming';
          if (daysDiff < 0) urgency = 'overdue';
          else if (daysDiff === 0) urgency = 'today';

          reminders.push({
            id: `debt-${debt.id}`,
            sourceType: 'debt',
            sourceId: debt.id,
            title: debt.title,
            amount: remaining,
            dueDate: debt.dueDate,
            daysDiff,
            urgency,
            creditorOrCategory: debt.creditor || 'Empréstimo / Dívida',
            rawDebt: debt,
          });
        }
      }
    }
  });

  // 2. Pending expenses
  transactions.forEach((tx) => {
    if (tx.type === 'expense' && tx.status === 'pending' && tx.date) {
      const daysDiff = getDaysDifferenceFromToday(tx.date);
      if (daysDiff >= -60 && daysDiff <= maxDaysAhead) {
        let urgency: ReminderUrgency = 'upcoming';
        if (daysDiff < 0) urgency = 'overdue';
        else if (daysDiff === 0) urgency = 'today';

        reminders.push({
          id: `tx-${tx.id}`,
          sourceType: 'expense',
          sourceId: tx.id,
          title: tx.description,
          amount: tx.amount,
          dueDate: tx.date,
          daysDiff,
          urgency,
          creditorOrCategory: tx.category || 'Despesa a Pagar',
          isInstallment: Boolean(tx.installmentInfo),
          installmentText: tx.installmentInfo
            ? `Parcela ${tx.installmentInfo.current}/${tx.installmentInfo.total}`
            : undefined,
          rawTx: tx,
        });
      }
    }
  });

  // Sort by urgency:
  // 1. Overdue first (ordered by most overdue first, or closest to today)
  // 2. Today
  // 3. Upcoming (closest date first)
  reminders.sort((a, b) => {
    if (a.urgency === 'overdue' && b.urgency !== 'overdue') return -1;
    if (b.urgency === 'overdue' && a.urgency !== 'overdue') return 1;
    if (a.urgency === 'today' && b.urgency === 'upcoming') return -1;
    if (b.urgency === 'today' && a.urgency === 'upcoming') return 1;
    return a.daysDiff - b.daysDiff;
  });

  return reminders;
}

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return false;
  }
}

/**
 * Synthesize a soft, clean alert sound using Web Audio API (no external asset needed)
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Pleasant dual chime (F5 -> A5)
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now); // F5
    osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);
  } catch (e) {
    // AudioContext might be blocked until user gesture, ignore silently
  }
}

/**
 * Send a web push notification via Service Worker or native Notification API
 */
export async function sendPushNotification(
  title: string,
  body: string,
  tag = 'aquigastos-reminder'
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const settings = getNotificationSettings();
  if (settings.soundEnabled) {
    playNotificationSound();
  }

  try {
    // Try Service Worker registration first for better mobile PWA support
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag,
          vibrate: [150, 60, 150] as any,
          data: { url: '/' },
        } as any);
        return true;
      }
    }

    // Fallback to desktop window.Notification
    new Notification(title, {
      body,
      icon: '/icon.svg',
      tag,
    });
    return true;
  } catch (e) {
    console.warn('Failed to dispatch notification:', e);
    return false;
  }
}

/**
 * Check if today has already sent a notification; if not, send summary notification
 */
export async function checkAndSendDailyNotification(reminders: DueReminder[]): Promise<boolean> {
  if (reminders.length === 0) return false;
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;

  const todayStr = new Date().toISOString().slice(0, 10);
  const lastNotified = localStorage.getItem(LAST_NOTIFIED_KEY);
  if (lastNotified === todayStr) {
    return false; // Already sent notification today
  }

  const overdueItems = reminders.filter((r) => r.urgency === 'overdue');
  const todayItems = reminders.filter((r) => r.urgency === 'today');
  const upcomingItems = reminders.filter((r) => r.urgency === 'upcoming' && r.daysDiff <= 3);

  const totalUrgent = overdueItems.length + todayItems.length + upcomingItems.length;
  if (totalUrgent === 0) return false;

  const totalAmount = [...overdueItems, ...todayItems, ...upcomingItems].reduce(
    (sum, r) => sum + r.amount,
    0
  );

  let title = 'AquiGastos - Lembrete de Pagamento';
  let body = '';

  if (todayItems.length > 0 && overdueItems.length > 0) {
    body = `Você tem ${todayItems.length} conta(s) vencendo hoje e ${overdueItems.length} atrasada(s). Total: ${formatCurrency(totalAmount)}.`;
  } else if (todayItems.length > 0) {
    const first = todayItems[0];
    body = `Vence hoje: ${first.title} (${formatCurrency(first.amount)})${todayItems.length > 1 ? ` e mais ${todayItems.length - 1} conta(s)` : ''}. Toque para pagar.`;
  } else if (overdueItems.length > 0) {
    const first = overdueItems[0];
    body = `Conta atrasada: ${first.title} (${formatCurrency(first.amount)}). Toque para regularizar.`;
  } else if (upcomingItems.length > 0) {
    body = `Você tem ${upcomingItems.length} pagamento(s) nos próximos dias. Total: ${formatCurrency(totalAmount)}.`;
  }

  const sent = await sendPushNotification(title, body, `daily-${todayStr}`);
  if (sent) {
    localStorage.setItem(LAST_NOTIFIED_KEY, todayStr);
  }
  return sent;
}
