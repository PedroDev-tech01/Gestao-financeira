import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Building2
} from 'lucide-react';
import { DebtItem } from '../types';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Omit<DebtItem, 'id' | 'createdAt'> | DebtItem) => void;
  editingDebt?: DebtItem | null;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDebt,
}) => {
  const [title, setTitle] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingDebt) {
      setTitle(editingDebt.title);
      setCreditor(editingDebt.creditor || '');
      setTotalAmount(editingDebt.totalAmount.toString());
      setPaidAmount(editingDebt.paidAmount.toString());
      setDueDate(editingDebt.dueDate || '');
      setNotes(editingDebt.notes || '');
    } else {
      setTitle('');
      setCreditor('');
      setTotalAmount('');
      setPaidAmount('0');
      setDueDate('');
      setNotes('');
    }
  }, [editingDebt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(totalAmount.replace(',', '.'));
    const paid = parseFloat(paidAmount.replace(',', '.')) || 0;

    if (isNaN(total) || total <= 0) return;
    if (!title.trim()) return;

    const debtData = {
      title: title.trim(),
      creditor: creditor.trim() || undefined,
      totalAmount: total,
      paidAmount: Math.min(paid, total),
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      status: (paid >= total ? 'paid' : 'active') as 'active' | 'paid',
    };

    if (editingDebt) {
      onSave({
        ...debtData,
        id: editingDebt.id,
        createdAt: editingDebt.createdAt,
        paymentHistory: editingDebt.paymentHistory,
      });
    } else {
      onSave(debtData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full border-t sm: overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh]">
        
        {/* Mobile pull indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/80 bg-[#15171C]/80">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Building2 size={18} className="text-amber-400" />
              <span>{editingDebt ? 'Editar Dívida' : 'Cadastrar Dívida / Pendência'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Empréstimos, carnês, reformas, dívidas com pessoas ou parcelas fora do cartão
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] overflow-y-auto space-y-4">
          
          {/* Título / Motivo */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1.5">
              Qual é a dívida? (Nome / Motivo)
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Empréstimo banco, Reforma da sala, Conserto do carro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#15171C] border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition-all"
              autoFocus
            />
          </div>

          {/* Para quem deve / Credor */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1.5">
              Para quem você deve? <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Banco Itaú, Amigo Pedro, Loja de Peças, Tio João"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#15171C] border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition-all"
            />
          </div>

          {/* Valor Total da Dívida */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1.5">
              Valor Total da Dívida (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-amber-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                required
                placeholder="0,00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-3 text-xl font-semibold bg-[#15171C] rounded-2xl text-amber-300 focus:outline-none focus:border-amber-500/60 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Quanto já foi pago */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1.5">
              Já pagou alguma parte? (Valor já quitado)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0,00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2 text-sm bg-[#15171C] border border-slate-800 rounded-xl text-emerald-300 focus:outline-none focus:border-emerald-500/60 transition-all"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Se você ainda não pagou nada, pode deixar 0,00.
            </span>
          </div>

          {/* Data Prevista para Quitar / Vencimento */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1.5">
              Data Prevista / Vencimento <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-[#15171C] border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/60 cursor-pointer"
            />
          </div>

          {/* Observação */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1">
              Observações ou Detalhes <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Acordo parcelado, juros combinados, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 text-xs bg-[#15171C] border border-slate-800 rounded-xl text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 resize-none"
            />
          </div>

          {/* Botão Salvar */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-500 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Check size={18} />
              <span>{editingDebt ? 'Atualizar Dívida' : 'Salvar Dívida'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
