import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { DebtItem } from '../types';
import { formatCurrency, getMonthNameAndYear } from '../utils/formatters';

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtItem | null;
  currentMonth: string;
  onConfirmPayment: (debtId: string, amountPaid: number, createExpenseTransaction: boolean, note?: string) => void;
}

export const PayDebtModal: React.FC<PayDebtModalProps> = ({
  isOpen,
  onClose,
  debt,
  currentMonth,
  onConfirmPayment,
}) => {
  const [payAmount, setPayAmount] = useState('');
  const [createExpense, setCreateExpense] = useState(true);
  const [paymentNote, setPaymentNote] = useState('');

  if (!isOpen || !debt) return null;

  const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
  const numericPay = parseFloat(payAmount.replace(',', '.')) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericPay <= 0) return;

    onConfirmPayment(debt.id, numericPay, createExpense, paymentNote.trim() || undefined);
    setPayAmount('');
    setPaymentNote('');
    onClose();
  };

  const handleQuickAmount = (amt: number) => {
    const safeAmt = Math.min(amt, remaining);
    setPayAmount(safeAmt.toFixed(2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#141B29] to-[#0E131F] rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border-t sm:border border-slate-800/90 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh]">
        
        {/* Mobile pull indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/80 bg-[#0A0D14]/80">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>Abater / Pagar Dívida</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">
              {debt.title} {debt.creditor ? `• ${debt.creditor}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer active:scale-95"
            title="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] space-y-4">
          
          {/* Status atual da dívida */}
          <div className="p-4 bg-[#0A0D14] rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Falta Pagar (Saldo Devedor)
              </span>
              <span className="text-xl font-black text-amber-400">
                {formatCurrency(remaining)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Já Quitado
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(debt.paidAmount)}
              </span>
            </div>
          </div>

          {/* Valor a pagar agora */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Quanto você vai pagar agora?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                required
                max={remaining}
                placeholder="0,00"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-3.5 text-2xl font-black bg-[#0A0D14] border border-slate-800 rounded-2xl text-emerald-300 focus:outline-none focus:border-emerald-500/60 transition-all placeholder:text-slate-600"
                autoFocus
              />
            </div>

            {/* Atalhos de valor rápido */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[50, 100, 200, 500].filter(a => a < remaining).map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className="px-2.5 py-1 text-xs font-bold bg-[#0A0D14] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 cursor-pointer transition-colors active:scale-95"
                >
                  + R$ {amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPayAmount(remaining.toFixed(2))}
                className="px-2.5 py-1 text-xs font-bold bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded-lg border border-emerald-800/40 cursor-pointer transition-colors active:scale-95"
              >
                Quitar Tudo ({formatCurrency(remaining)})
              </button>
            </div>
          </div>

          {/* Opção de lançar no extrato */}
          <div className="p-3.5 bg-[#0A0D14] rounded-2xl border border-slate-800/80 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createExpense}
                onChange={(e) => setCreateExpense(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-100 block">
                  Lançar como despesa no extrato deste mês ({getMonthNameAndYear(currentMonth)})
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                  Recomendado para abater automaticamente do seu saldo financeiro do mês.
                </span>
              </div>
            </label>
          </div>

          {/* Observação */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Observação <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Parcela 1 paga via PIX"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#0A0D14] border border-slate-800 rounded-xl text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Botão de confirmação */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={numericPay <= 0}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>Confirmar Pagamento de {formatCurrency(numericPay)}</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
