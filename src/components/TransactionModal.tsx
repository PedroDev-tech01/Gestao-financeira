import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  MinusCircle,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Info,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Transaction, CategoryItem, TransactionType, PaymentMethod } from '../types';
import { addMonthsToDate, formatCurrency } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txOrList: (Omit<Transaction, 'id'> | Transaction) | (Omit<Transaction, 'id'> | Transaction)[]) => void;
  editingTransaction?: Transaction | null;
  defaultType?: TransactionType;
  categories: CategoryItem[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  defaultType = 'expense',
  categories,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<Transaction['status']>('paid');
  const [notes, setNotes] = useState('');

  // Installment states (only for new expenses)
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [installmentMode, setInstallmentMode] = useState<'total_divided' | 'installment_value'>('total_divided');

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setPaymentMethod(editingTransaction.paymentMethod || 'pix');
      setDate(editingTransaction.date);
      setStatus(editingTransaction.status);
      setNotes(editingTransaction.notes || '');
      setIsInstallment(false);
    } else {
      setType(defaultType);
      setDescription('');
      setAmount('');
      const defaultCat = defaultType === 'income' ? 'Salário / Renda Principal' : 'Alimentação';
      setCategory(defaultCat);
      setPaymentMethod(defaultType === 'income' ? 'pix' : 'credit_card');
      setDate(todayStr);
      setStatus('paid');
      setNotes('');
      setIsInstallment(false);
      setInstallmentsCount(2);
      setInstallmentMode('total_divided');
    }
  }, [editingTransaction, defaultType, isOpen, todayStr]);

  if (!isOpen) return null;

  // Amount parsing & calculations for installments
  const numericAmount = parseFloat(amount.replace(',', '.')) || 0;
  
  let singleInstallmentAmount = 0;
  let totalInstallmentsAmount = 0;

  if (isInstallment && installmentsCount > 1 && numericAmount > 0) {
    if (installmentMode === 'total_divided') {
      singleInstallmentAmount = Number((numericAmount / installmentsCount).toFixed(2));
      totalInstallmentsAmount = numericAmount;
    } else {
      singleInstallmentAmount = numericAmount;
      totalInstallmentsAmount = Number((numericAmount * installmentsCount).toFixed(2));
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;
    if (!description.trim()) return;

    // If editing existing transaction
    if (editingTransaction) {
      const updated: Transaction = {
        id: editingTransaction.id,
        description: description.trim(),
        amount: numericAmount,
        type,
        category: category || (type === 'income' ? 'Outras Receitas' : 'Outros Gastos'),
        date,
        status,
        scope: 'personal',
        paymentMethod,
        notes: notes.trim() || undefined,
        installmentInfo: editingTransaction.installmentInfo,
      };
      onSave(updated);
      onClose();
      return;
    }

    // If creating a new installment purchase
    if (type === 'expense' && isInstallment && paymentMethod === 'credit_card' && installmentsCount > 1) {
      const parentId = `inst-group-${Date.now()}`;
      const generatedTransactions: Omit<Transaction, 'id'>[] = [];

      for (let i = 0; i < installmentsCount; i++) {
        const installmentDate = addMonthsToDate(date, i);
        const installmentIndex = i + 1;
        
        // The first installment can be paid or pending as selected;
        // Future installments are automatically set as pending (a pagar)
        const itemStatus: Transaction['status'] = i === 0 ? status : 'pending';

        generatedTransactions.push({
          description: `${description.trim()} (${installmentIndex}/${installmentsCount})`,
          amount: singleInstallmentAmount,
          type: 'expense',
          category: category || 'Outros Gastos',
          date: installmentDate,
          status: itemStatus,
          scope: 'personal',
          paymentMethod: 'credit_card',
          notes: notes.trim() 
            ? `${notes.trim()} • Parcela ${installmentIndex} de ${installmentsCount} (Total: ${formatCurrency(totalInstallmentsAmount)})`
            : `Parcela ${installmentIndex} de ${installmentsCount} • Total da compra: ${formatCurrency(totalInstallmentsAmount)}`,
          installmentInfo: {
            current: installmentIndex,
            total: installmentsCount,
            parentId,
          }
        });
      }

      onSave(generatedTransactions);
      onClose();
      return;
    }

    // Standard single transaction
    const data: Omit<Transaction, 'id'> = {
      description: description.trim(),
      amount: numericAmount,
      type,
      category: category || (type === 'income' ? 'Outras Receitas' : 'Outros Gastos'),
      date,
      status,
      scope: 'personal',
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    onSave(data);
    onClose();
  };

  const filteredCategories = categories.filter(c => {
    if (type === 'income') return c.type === 'income' || c.type === 'both';
    if (type === 'expense') return c.type === 'expense' || c.type === 'both';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#141B29] to-[#0E131F] rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl border-t sm:border border-slate-800/90 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh]">
        
        {/* Mobile pull indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/80 bg-[#0A0D14]/80">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {editingTransaction ? 'Editar Lançamento' : (type === 'expense' ? 'Adicionar Gasto / Despesa' : 'Adicionar Entrada / Receita')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {type === 'expense' 
                ? 'Preencha os dados da despesa (com opção de parcelar nos próximos meses)' 
                : 'Preencha o valor e a origem da receita'}
            </p>
          </div>
          <button
            id="close-transaction-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer active:scale-95"
            title="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] overflow-y-auto space-y-4">
          
          {/* Type Segment Control (Despesa vs Receita) */}
          <div className="grid grid-cols-2 p-1 bg-[#0A0D14] rounded-2xl gap-1.5 border border-slate-800/80">
            <button
              type="button"
              id="modal-tab-expense"
              onClick={() => {
                setType('expense');
                if (category.includes('Salário') || category.includes('Rendimento')) {
                  setCategory('Alimentação');
                }
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                type === 'expense'
                  ? 'bg-rose-950/60 text-rose-300 shadow-xs border border-rose-800/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MinusCircle size={17} />
              <span>Gasto / Despesa</span>
            </button>

            <button
              type="button"
              id="modal-tab-income"
              onClick={() => {
                setType('income');
                setIsInstallment(false);
                setCategory('Salário / Renda Principal');
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                type === 'income'
                  ? 'bg-emerald-950/60 text-emerald-300 shadow-xs border border-emerald-800/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle size={17} />
              <span>Ganho / Receita</span>
            </button>
          </div>

          {/* Amount Field with Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Valor em Reais (R$)
              </label>
              <div className="flex items-center gap-1.5">
                {[50, 100, 200, 500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(amount.replace(',', '.')) || 0;
                      setAmount((cur + val).toFixed(2));
                    }}
                    className="px-2 py-0.5 text-[11px] font-bold bg-[#0A0D14] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg cursor-pointer transition-all active:scale-95"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black ${
                type === 'income' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                R$
              </span>
              <input
                id="modal-input-amount"
                type="number"
                step="0.01"
                inputMode="decimal"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-14 pr-4 py-3.5 text-2xl font-black bg-[#0A0D14] border rounded-2xl focus:outline-none transition-all placeholder:text-slate-600 ${
                  type === 'income'
                    ? 'text-emerald-300 border-slate-800 focus:border-emerald-500/60'
                    : 'text-rose-300 border-slate-800 focus:border-rose-500/60'
                }`}
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              O que é? (Descrição)
            </label>
            <input
              id="modal-input-desc"
              type="text"
              required
              placeholder={type === 'income' ? 'Ex: Salário do mês, Bico, Venda de item' : 'Ex: Compra no mercado, Farmácia, Tênis novo'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#0A0D14] border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Category with Didactic Guidance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Categoria
              </label>
              {type === 'expense' && (
                <span className="text-[10px] text-slate-500">
                  Ajuda a classificar na regra 50-30-20
                </span>
              )}
            </div>
            <select
              id="modal-select-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#0A0D14] border border-slate-800 rounded-xl font-medium text-slate-100 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              {filteredCategories.map(cat => {
                const groupPrefix = cat.categoryGroup === 'essential' 
                  ? '📌 Essencial • ' 
                  : (cat.categoryGroup === 'investment' 
                      ? '💎 Reserva/Invest • ' 
                      : (cat.categoryGroup === 'revenue' ? '💰 Ganho • ' : '✨ Estilo de Vida • '));
                return (
                  <option key={cat.id} value={cat.name}>
                    {groupPrefix}{cat.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Payment Method Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Como foi pago?
              </label>
              {paymentMethod === 'credit_card' && type === 'expense' && !editingTransaction && (
                <span className="text-[10px] text-purple-300 flex items-center gap-1 font-medium">
                  <CreditCard size={11} />
                  <span>Permite parcelar abaixo</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'credit_card' as PaymentMethod, label: 'Cartão' },
                { id: 'pix' as PaymentMethod, label: 'PIX' },
                { id: 'debit' as PaymentMethod, label: 'Débito' },
                { id: 'cash' as PaymentMethod, label: 'Dinheiro' },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id);
                      if (m.id !== 'credit_card') {
                        setIsInstallment(false);
                      }
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-slate-800 text-white border-slate-600 shadow-xs'
                        : 'bg-[#0A0D14] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PARCELAMENTO: Disponível SOMENTE quando o método for Cartão */}
          {type === 'expense' && paymentMethod === 'credit_card' && !editingTransaction && (
            <div className="p-3.5 bg-[#0A0D14] border border-indigo-900/50 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Layers size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Compra Parcelada no Cartão?
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Dividir o gasto automaticamente nos próximos meses
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {isInstallment && (
                <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in">
                  
                  {/* Presets de parcelas */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Número de Parcelas
                    </label>
                    <div className="grid grid-cols-7 gap-1.5 mb-2">
                      {[2, 3, 4, 5, 6, 10, 12].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setInstallmentsCount(num)}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            installmentsCount === num
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                              : 'bg-[#141B29] text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {num}x
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Ou digite a quantidade:</span>
                      <input
                        type="number"
                        min={2}
                        max={60}
                        value={installmentsCount}
                        onChange={(e) => setInstallmentsCount(Math.max(2, parseInt(e.target.value) || 2))}
                        className="w-20 px-2.5 py-1 text-xs bg-[#141B29] border border-slate-800 rounded-lg text-white font-bold text-center"
                      />
                      <span className="text-xs text-slate-400">vezes</span>
                    </div>
                  </div>

                  {/* Como calcular */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      O valor digitado lá em cima é:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInstallmentMode('total_divided')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          installmentMode === 'total_divided'
                            ? 'bg-indigo-950/50 border-indigo-500/50 text-indigo-200'
                            : 'bg-[#141B29] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">Valor Total da Compra</span>
                        <span className="text-[10px] opacity-80">Dividir pelas {installmentsCount} parcelas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInstallmentMode('installment_value')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          installmentMode === 'installment_value'
                            ? 'bg-indigo-950/50 border-indigo-500/50 text-indigo-200'
                            : 'bg-[#141B29] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">Valor de Cada Parcela</span>
                        <span className="text-[10px] opacity-80">R$ {numericAmount ? formatCurrency(numericAmount) : '0,00'} por mês</span>
                      </button>
                    </div>
                  </div>

                  {/* Resumo explicativo fácil de entender */}
                  {numericAmount > 0 && (
                    <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-start gap-2.5 text-indigo-200 text-xs">
                      <Info size={16} className="shrink-0 text-indigo-400 mt-0.5" />
                      <div>
                        <p className="font-bold">
                          Serão lançadas {installmentsCount} parcelas de {formatCurrency(singleInstallmentAmount)} cada.
                        </p>
                        <p className="text-[11px] text-indigo-300/80 mt-0.5 leading-relaxed">
                          Total da compra: {formatCurrency(totalInstallmentsAmount)}. As parcelas serão distribuídas mês a mês no seu extrato automaticamente!
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* Date with Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {isInstallment && paymentMethod === 'credit_card'
                  ? 'Data da 1ª Parcela'
                  : type === 'income'
                  ? 'Data da Entrada'
                  : 'Data do Pagamento'}
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDate(todayStr)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                    date === todayStr ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setDate(yesterdayStr)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                    date === yesterdayStr ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ontem
                </button>
              </div>
            </div>
            <input
              id="modal-input-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-[#0A0D14] border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            />
          </div>

          {/* Status Toggle (Pago / Efetivado vs Pendente) */}
          <div className="pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Situação deste lançamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-[0.98] ${
                  status === 'paid'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-xs'
                    : 'bg-[#0A0D14] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 size={15} />
                <span>{type === 'income' ? 'Já Recebido' : 'Já Pago / Efetivado'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-[0.98] ${
                  status === 'pending'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-xs'
                    : 'bg-[#0A0D14] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Clock size={15} />
                <span>{type === 'income' ? 'A Receber' : 'Pendente / A Pagar'}</span>
              </button>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
              Observação <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Compra para casa, presente, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 text-xs bg-[#0A0D14] border border-slate-800 rounded-xl text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="modal-submit-btn"
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
              }`}
            >
              <Check size={18} />
              <span>
                {editingTransaction
                  ? 'Salvar Alterações'
                  : isInstallment
                  ? `Lançar Compra em ${installmentsCount}x Parcelas`
                  : type === 'income'
                  ? 'Salvar Entrada'
                  : 'Salvar Despesa'}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
