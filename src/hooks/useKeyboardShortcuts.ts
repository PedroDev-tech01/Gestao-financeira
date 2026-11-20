import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  onEscape: () => void;
  onNewTransaction: () => void;
  onToggleHideBalance: () => void;
  onSelectTab: (index: 1 | 2 | 3 | 4) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onShowShortcuts: () => void;
}

/** Atalhos de teclado (computador/tablet). Ignorados enquanto se digita em um campo. */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  // Sempre usa a versão mais recente dos handlers sem recriar o listener
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const h = ref.current;
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') (target as HTMLInputElement).blur();
        return;
      }

      switch (e.key) {
        case 'Escape':
          h.onEscape();
          break;
        case 'n':
        case 'N':
        case '+':
          e.preventDefault();
          h.onNewTransaction();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          h.onToggleHideBalance();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          h.onSelectTab(Number(e.key) as 1 | 2 | 3 | 4);
          break;
        case 'ArrowLeft':
          h.onPreviousMonth();
          break;
        case 'ArrowRight':
          h.onNextMonth();
          break;
        case '?':
          h.onShowShortcuts();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
