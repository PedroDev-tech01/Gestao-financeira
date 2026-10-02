import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { InvestmentItem } from '../types';
import { formatCurrency, getMonthNameAndYear } from '../utils/formatters';

interface InvestmentAporteModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: InvestmentItem | null;
  currentMonth: string;
  onConfirmOperation: (
    investmentId: string,
    operationType: 'deposit' | 'withdraw' | 'yield',
    amount: number,
    createTransaction: boolean,
    notes?: string
  ) => void;
}

export const InvestmentAporteModal: React.FC<InvestmentAporteModalProps> = ({
  isOpen,
  onClose,
  investment,
  currentMonth,
  onConfirmOperation,
}) => {
  const [operationType, setOperationType] = useState<'deposit' | 'withdraw' | 'yield'>('deposit');
  const [amount, setAmount] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);
  const [notes, setNotes] = useState('');

  if (!isOpen || !investment) return null;

  const numericAmount = parseFloat(amount.replace(',', '.')) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    onConfirmOperation(
      investment.id,
      operationType,
      numericAmount,
      createTransaction,
      notes.trim() || undefined
    );

    setAmount('');
    setNotes('');
    onClose();
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#131A29] to-[#0E131F] rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border-t sm:border border-slate-800/90 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh]">
        
        {/* Mobile pull indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/80 bg-[#0A0D14]/80">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              <span>Movimentar Investimento</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">
              {investment.title} {investment.institution ? `• ${investment.institution}` : ''}
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
          
          {/* Operation Type Switcher */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Qual movimentação deseja fazer?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOperationType('deposit');
                  setCreateTransaction(true);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  operationType === 'deposit'
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-bold shadow-xs'
                    : 'bg-[#0A0D14] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle size={17} className={operationType === 'deposit' ? 'text-emerald-400' : 'text-slate-400'} />
                <span className="text-xs">Novo Aporte</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOperationType('withdraw');
                  setCreateTransaction(true);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  operationType === 'withdraw'
                    ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 font-bold shadow-xs'
                    : 'bg-[#0A0D14] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MinusCircle size={17} className={operationType === 'withdraw' ? 'text-amber-400' : 'text-slate-400'} />
                <span className="text-xs">Resgatar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOperationType('yield');
                  setCreateTransaction(false);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  operationType === 'yield'
                    ? 'bg-blue-950/60 border-blue-500/60 text-blue-300 font-bold shadow-xs'
                    : 'bg-[#0A0D14] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles size={17} className={operationType === 'yield' ? 'text-blue-400' : 'text-slate-400'} />
                <span className="text-xs">Rendimento</span>
              </button>
            </div>
          </div>

          {/* Current Balance View */}
          <div className="p-3 bg-[#0A0D14] rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Saldo Atual Aplicado
              </span>
              <span className="text-sm font-black text-emerald-400">
                {formatCurrency(investment.currentValue)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Total do Bolso
              </span>
              <span className="text-sm font-bold text-slate-200">
                {formatCurrency(investment.investedAmount)}
              </span>
            </div>
          </div>

          {/* Valor da Operação */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              {operationType === 'deposit' && 'Quanto deseja aportar agora?'}
              {operationType === 'withdraw' && 'Quanto deseja resgatar?'}
              {operationType === 'yield' && 'Valor do rendimento recebido'}
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
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-3.5 text-2xl font-black bg-[#0A0D14] border border-slate-800 rounded-2xl text-emerald-300 focus:outline-none focus:border-emerald-500/60 transition-all placeholder:text-slate-600"
                autoFocus
              />
            </div>

            {/* Quick Amounts */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[50, 100, 200, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-1 text-xs font-bold bg-[#0A0D14] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 cursor-pointer transition-colors active:scale-95"
                >
                  R$ {val}
                </button>
              ))}
              {operationType === 'withdraw' && (
                <button
                  type="button"
                  onClick={() => setAmount(investment.currentValue.toFixed(2))}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 rounded-lg border border-amber-800/40 cursor-pointer transition-colors active:scale-95"
                >
                  Resgatar Tudo
                </button>
              )}
            </div>
          </div>

          {/* Opção de lançar no extrato deste mês */}
          {operationType !== 'yield' && (
            <div className="p-3.5 bg-[#0A0D14] rounded-2xl border border-slate-800/80 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createTransaction}
                  onChange={(e) => setCreateTransaction(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-100 block">
                    {operationType === 'deposit'
                      ? `Lançar como despesa de investimento no extrato (${getMonthNameAndYear(currentMonth)})`
                      : `Lançar como entrada de resgate no extrato (${getMonthNameAndYear(currentMonth)})`}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                    {operationType === 'deposit'
                      ? 'Recomendado: abate da conta corrente e entra na regra dos 20% de reserva do mês.'
                      : 'Recomendado: credita o dinheiro de volta ao seu caixa financeiro do mês.'}
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Observação */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Observação <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Aporte mensal da sobra de salário, Dividendos recebidos"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#0A0D14] border border-slate-800 rounded-xl text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Botão de confirmação */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={numericAmount <= 0}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                operationType === 'deposit'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                  : (operationType === 'withdraw' 
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50' 
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/50')
              }`}
            >
              <span>
                {operationType === 'deposit' && `Confirmar Aporte de ${formatCurrency(numericAmount)}`}
                {operationType === 'withdraw' && `Confirmar Resgate de ${formatCurrency(numericAmount)}`}
                {operationType === 'yield' && `Adicionar Rendimento de ${formatCurrency(numericAmount)}`}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
