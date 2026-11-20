import { useCallback, useState } from 'react';
import type { ToastMessage } from '../components/ToastNotification';

export type ToastType = 'success' | 'info' | 'warning' | 'error';
export type AddToast = (type: ToastType, text: string) => void;

/** Avisos rápidos no canto da tela (no máximo 3 ao mesmo tempo). */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast: AddToast = useCallback((type, text) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, type, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
