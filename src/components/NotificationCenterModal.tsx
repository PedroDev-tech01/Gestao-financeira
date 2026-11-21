import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Volume2,
  VolumeX,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  DollarSign,
  Building2,
  Receipt,
  Settings,
  Send
} from 'lucide-react';
import { DebtItem, Transaction } from '../types';
import {
  DueReminder,
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendPushNotification,
  playNotificationSound
} from '../services/notificationService';
import { formatCurrency, formatDateBR, formatDaysRemainingLabel } from '../utils/formatters';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: DueReminder[];
  onPayDebt: (debt: DebtItem) => void;
  onMarkExpensePaid: (txId: string) => void;
  onGoToDebtsTab: () => void;
  onGoToTransactionsTab: () => void;
  hideBalance?: boolean;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onPayDebt,
  onMarkExpensePaid,
  onGoToDebtsTab,
  onGoToTransactionsTab,
  hideBalance = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setSettings(getNotificationSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const overdueCount = reminders.filter((r) => r.urgency === 'overdue').length;
  const todayCount = reminders.filter((r) => r.urgency === 'today').length;
  const upcomingCount = reminders.filter((r) => r.urgency === 'upcoming').length;

  const totalAmountDue = reminders.reduce((sum, r) => sum + r.amount, 0);

  const filteredReminders = reminders.filter((r) => {
    if (activeFilter === 'overdue') return r.urgency === 'overdue';
    if (activeFilter === 'today') return r.urgency === 'today';
    if (activeFilter === 'upcoming') return r.urgency === 'upcoming';
    return true;
  });

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      sendPushNotification(
        'AquiGastos: Notificações Ativadas!',
        'Você será lembrado sempre que tiver faturas ou dívidas vencendo.'
      );
    }
  };

  const handleTestNotification = async () => {
    setTestNotificationSent(true);
    await sendPushNotification(
      'AquiGastos - Teste de Notificação',
      'Excelente! Os alertas de vencimentos de contas estão funcionando perfeitamente no seu aparelho.'
    );
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-xl w-full border-t sm: overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh]">
        
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800/80 bg-[#15171C]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Alertas & Vencimentos</span>
                {reminders.length > 0 && (
                  <span className="text-xs font-semibold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                    {reminders.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Lembretes automáticos para não atrasar contas e evitar juros
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                showSettings ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Configurações de alerta"
            >
              <Settings size={17} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer active:scale-95"
              title="Fechar janela"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Browser Push Notification Permission Banner */}
        <div className="px-5 sm:px-6 py-3 bg-[#15171C] border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${permission === 'granted' ? 'bg-emerald-400 animate-pulse' : (permission === 'denied' ? 'bg-rose-500' : 'bg-amber-400')}`} />
            <span className="text-xs text-slate-300 font-semibold">
              {permission === 'granted'
                ? 'Notificações Push ativadas no aparelho'
                : (permission === 'denied'
                  ? 'Notificações bloqueadas no navegador'
                  : 'Lembretes no Celular / Computador')}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {permission === 'granted' ? (
              <button
                onClick={handleTestNotification}
                disabled={testNotificationSent}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send size={12} />
                <span>{testNotificationSent ? 'Enviado!' : 'Testar Notificação'}</span>
              </button>
            ) : isNotificationSupported() && (
              <button
                onClick={handleRequestPermission}
                className="w-full sm:w-auto text-xs font-bold text-slate-950 bg-slate-100 hover:bg-white px-3.5 py-1.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Bell size={13} />
                <span>Ativar Notificações</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Settings Panel */}
        {showSettings && (
          <div className="p-4 sm:p-5 bg-[#15171C] border-b border-slate-800/80 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold  text-slate-400 flex items-center gap-1.5">
                <Settings size={13} className="text-emerald-400" />
                Preferências de Alertas
              </span>
              <button
                onClick={() => handleToggleSetting('soundEnabled')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border transition-all cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                {settings.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                <span>{settings.soundEnabled ? 'Som Ativado' : 'Sem Som'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#15171C] border border-slate-800 cursor-pointer">
                <span className="text-slate-300">Avisar no dia do vencimento</span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnDay}
                  onChange={() => handleToggleSetting('notifyOnDay')}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#15171C] border border-slate-800 cursor-pointer">
                <span className="text-slate-300">Avisar 3 dias antes</span>
                <input
                  type="checkbox"
                  checked={settings.notify3DaysBefore}
                  onChange={() => handleToggleSetting('notify3DaysBefore')}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#15171C] border border-slate-800 cursor-pointer">
                <span className="text-slate-300">Avisar 7 dias antes</span>
                <input
                  type="checkbox"
                  checked={settings.notify7DaysBefore}
                  onChange={() => handleToggleSetting('notify7DaysBefore')}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#15171C] border border-slate-800 cursor-pointer">
                <span className="text-slate-300">Avisar contas em atraso</span>
                <input
                  type="checkbox"
                  checked={settings.notifyOverdue}
                  onChange={() => handleToggleSetting('notifyOverdue')}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>
        )}

        {/* Filter Navigation Chips - Responsive Flex Wrap */}
        <div className="px-5 sm:px-6 pt-3 pb-2 flex flex-wrap items-center gap-1.5 border-b border-slate-800/60">
          <button
            onClick={() => setActiveFilter('all')}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-200 text-slate-900 shadow-sm'
                : 'bg-[#15171C] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todos ({reminders.length})
          </button>

          {overdueCount > 0 && (
            <button
              onClick={() => setActiveFilter('overdue')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'overdue'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/50'
              }`}
            >
              <AlertTriangle size={12} />
              <span>Atrasadas ({overdueCount})</span>
            </button>
          )}

          {todayCount > 0 && (
            <button
              onClick={() => setActiveFilter('today')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/50'
              }`}
            >
              <Clock size={12} />
              <span>Vencem Hoje ({todayCount})</span>
            </button>
          )}

          {upcomingCount > 0 && (
            <button
              onClick={() => setActiveFilter('upcoming')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'upcoming'
                  ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-950/50'
                  : 'bg-sky-950/40 text-sky-300 border border-sky-800/40 hover:bg-sky-900/50'
              }`}
            >
              <Calendar size={12} />
              <span>Próximos 7 Dias ({upcomingCount})</span>
            </button>
          )}
        </div>

        {/* Scrollable Reminders List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 overscroll-contain flex-1">
          {filteredReminders.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-100 mb-1">
                Tudo em dia!
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Você não tem nenhuma fatura ou dívida com vencimento pendente no momento. Parabéns pelo controle!
              </p>
            </div>
          ) : (
            filteredReminders.map((reminder) => {
              const labelInfo = formatDaysRemainingLabel(reminder.daysDiff);
              const isDebt = reminder.sourceType === 'debt';

              return (
                <div
                  key={reminder.id}
                  className={`p-4 rounded-2xl bg-gradient-to-r from-[#1E2128] to-[#15171C] border transition-all duration-200 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                    reminder.urgency === 'overdue'
                      ? 'border-rose-800/60 hover:border-rose-500/60'
                      : reminder.urgency === 'today'
                      ? 'border-amber-800/60 hover:border-amber-500/60'
                      : 'border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        reminder.urgency === 'overdue'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : reminder.urgency === 'today'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                      }`}
                    >
                      {isDebt ? <Building2 size={18} /> : <Receipt size={18} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${labelInfo.bg} ${labelInfo.color}`}>
                          {labelInfo.text}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {isDebt ? 'Dívida / Empréstimo' : 'Despesa Pendente'}
                        </span>
                        {reminder.isInstallment && (
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/30">
                            {reminder.installmentText}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 truncate">
                        {reminder.title}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{reminder.creditorOrCategory}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-500" />
                          <span>Vencimento: {formatDateBR(reminder.dueDate)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Quick Pay Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 sm:border-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px]  text-slate-500 block font-semibold">
                        Valor
                      </span>
                      <span className={`text-base font-semibold tracking-tight ${
                        reminder.urgency === 'overdue' ? 'text-rose-400' : 'text-slate-100'
                      }`}>
                        {hideBalance ? '••••••' : formatCurrency(reminder.amount)}
                      </span>
                    </div>

                    <div>
                      {isDebt && reminder.rawDebt ? (
                        <button
                          onClick={() => {
                            onClose();
                            onPayDebt(reminder.rawDebt!);
                          }}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Abater ou quitar dívida"
                        >
                          <DollarSign size={13} />
                          <span>Pagar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onMarkExpensePaid(reminder.sourceId);
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Marcar lançamento como pago"
                        >
                          <CheckCircle2 size={13} />
                          <span>Dar Baixa</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Summary */}
        {reminders.length > 0 && (
          <div className="px-5 sm:px-6 py-3.5 bg-[#15171C]/90 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Total pendente nos alertas: <strong className="text-white font-bold">{hideBalance ? '••••••' : formatCurrency(totalAmountDue)}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onGoToDebtsTab();
                }}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ir para Dívidas</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
