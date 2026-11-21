import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '/ ou Ctrl+K', description: 'Buscar transações, dívidas e investimentos' },
    { key: 'N ou +', description: 'Abrir janela de Novo Lançamento' },
    { key: 'H', description: 'Ocultar ou mostrar saldos e valores' },
    { key: '1, 2, 3, 4', description: 'Navegar entre Extrato, Investimentos, Dívidas e Gráficos' },
    { key: '← / →', description: 'Voltar ou avançar mês do calendário' },
    { key: 'Esc', description: 'Fechar modal ou limpar busca' },
    { key: '?', description: 'Abrir este guia de atalhos' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full border-t sm: overflow-hidden flex flex-col">
        
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#15171C]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-300 flex items-center justify-center">
              <Keyboard size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Atalhos de Teclado</h3>
              <p className="text-[11px] text-slate-400">Navegue com velocidade no computador ou tablet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 space-y-2.5">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#15171C] border border-slate-800/80"
            >
              <span className="text-xs text-slate-300">{s.description}</span>
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-emerald-300 rounded-lg text-xs font-mono font-bold shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#15171C]/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-white text-xs font-bold text-slate-950 rounded-full transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
