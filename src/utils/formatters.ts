export const formatCurrency = (value: number, hideBalance = false): string => {
  if (hideBalance) return '••••••';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatCurrencyNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

export const formatDateRelative = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  const mIndex = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} de ${months[mIndex] || month}`;
};

export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const getMonthNameAndYear = (monthStr: string): string => {
  // monthStr: YYYY-MM
  const [year, month] = monthStr.split('-');
  const mIndex = parseInt(month, 10) - 1;
  return `${MONTH_NAMES_PT[mIndex] || month} de ${year}`;
};

export const getPreviousMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  const prevM = month - 1;
  return `${year}-${prevM < 10 ? '0' + prevM : prevM}`;
};

export const getNextMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  const nextM = month + 1;
  return `${year}-${nextM < 10 ? '0' + nextM : nextM}`;
};

/**
 * Calculates a date N months into the future, safely handling month day overflows (e.g. Jan 31 -> Feb 28)
 */
export const addMonthsToDate = (dateStr: string, monthsToAdd: number): string => {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetMonthIndex = (m - 1) + monthsToAdd;
  
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12; // 0..11
  
  // Find max days in target month
  // Day 0 of next month gives the last day of target month
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const safeDay = Math.min(d, maxDays);
  
  const mm = String(targetMonth + 1).padStart(2, '0');
  const dd = String(safeDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
};

/**
 * Returns difference in calendar days between today and target date.
 * < 0: Overdue (past)
 * = 0: Today
 * > 0: Days remaining in future
 */
export const getDaysDifferenceFromToday = (dateStr: string): number => {
  if (!dateStr) return 0;
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDaysRemainingLabel = (daysDiff: number): {
  text: string;
  color: string;
  bg: string;
  urgency: 'overdue' | 'today' | 'upcoming';
} => {
  if (daysDiff < 0) {
    const days = Math.abs(daysDiff);
    return {
      text: days === 1 ? 'Venceu ontem (Atrasada)' : `Atrasada há ${days} dias`,
      color: 'text-rose-400',
      bg: 'bg-rose-950/60 border-rose-800/60',
      urgency: 'overdue',
    };
  }
  if (daysDiff === 0) {
    return {
      text: 'Vence Hoje!',
      color: 'text-amber-400',
      bg: 'bg-amber-950/60 border-amber-800/60',
      urgency: 'today',
    };
  }
  if (daysDiff === 1) {
    return {
      text: 'Vence amanhã',
      color: 'text-amber-300',
      bg: 'bg-amber-950/40 border-amber-800/40',
      urgency: 'upcoming',
    };
  }
  return {
    text: `Vence em ${daysDiff} dias`,
    color: 'text-sky-300',
    bg: 'bg-sky-950/40 border-sky-800/40',
    urgency: 'upcoming',
  };
};
