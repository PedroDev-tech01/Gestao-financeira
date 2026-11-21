import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  text: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      onDismiss(toasts[0].id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed top-4 sm:top-5 right-3 sm:right-6 left-3 sm:left-auto z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        const borderColor = isSuccess
          ? 'border-emerald-500/50 bg-[#1A2622]/95 text-emerald-200'
          : isWarning
          ? 'border-amber-500/50 bg-[#2A251A]/95 text-amber-200'
          : isError
          ? 'border-rose-500/50 bg-[#2A1E1E]/95 text-rose-200'
          : 'border-slate-700 bg-[#1E2128]/95 text-slate-200';

        const Icon = isSuccess ? CheckCircle2 : (isWarning || isError ? AlertTriangle : Info);
        const iconColor = isSuccess
          ? 'text-emerald-400'
          : isWarning
          ? 'text-amber-400'
          : isError
          ? 'text-rose-400'
          : 'text-blue-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${borderColor}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon size={18} className={`shrink-0 ${iconColor}`} />
              <p className="text-xs font-semibold leading-snug break-words">
                {toast.text}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
              title="Fechar notificação"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
