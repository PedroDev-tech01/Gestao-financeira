import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Utensils,
  Home,
  Car,
  HeartPulse,
  Building2,
  Plane,
  ShoppingBag,
  Laptop,
  GraduationCap,
  PawPrint,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
} from 'lucide-react';
import { Transaction, CategoryItem, TransactionType } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txOrList: (Omit<Transaction, 'id'> | Transaction) | (Omit<Transaction, 'id'> | Transaction)[]) => void;
  editingTransaction?: Transaction | null;
  defaultType?: TransactionType;
  categories: CategoryItem[];
}

const SHORT_CATEGORY_LABELS: Record<string, string> = {
  'Alimentação & Mercado': 'Alimentação',
  'Moradia, Aluguel & Contas': 'Moradia & Contas',
  'Transporte & Combustível': 'Transporte',
  'Saúde, Consultas & Farmácia': 'Saúde & Farmácia',
  'Dívidas & Quitações': 'Dívidas',
  'Lazer & Restaurantes': 'Lazer',
  'Compras & Vestuário': 'Compras',
  'Assinaturas & Streaming': 'Assinaturas',
  'Educação & Livros': 'Educação',
  'Pets & Veterinário': 'Pets',
  'Investimentos & Reserva de Emergência': 'Investimentos',
  'Salário / Renda Principal': 'Salário',
  'Renda Extra & Bicos': 'Renda Extra',
  'Rendimentos & Dividendos': 'Rendimentos',
  'Vendas de Produtos / Desapego': 'Vendas',
  'Outros Lançamentos': 'Outros',
};

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Utensils': return Utensils;
    case 'Home': return Home;
    case 'Car': return Car;
    case 'HeartPulse': return HeartPulse;
    case 'Building2': return Building2;
    case 'Plane': return Plane;
    case 'ShoppingBag': return ShoppingBag;
    case 'Laptop': return Laptop;
    case 'GraduationCap': return GraduationCap;
    case 'PawPrint': return PawPrint;
    case 'TrendingUp': return TrendingUp;
    case 'DollarSign': return DollarSign;
    case 'Briefcase': return Briefcase;
    default: return Layers;
  }
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  defaultType = 'expense',
  categories,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr);
  const [justSaved, setJustSaved] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  const getFilteredCategories = (targetType: TransactionType) => {
    const filtered = categories.filter(c => c.type === targetType || c.type === 'both');
    if (filtered.length > 0) return filtered;
    return targetType === 'income'
      ? [
          { id: 'cat-salario', name: 'Salário / Renda Principal', icon: 'DollarSign', color: '#10B981', bgLight: '#ECFDF5', type: 'income' as const },
          { id: 'cat-renda-extra', name: 'Renda Extra & Bicos', icon: 'Briefcase', color: '#059669', bgLight: '#D1FAE5', type: 'income' as const },
          { id: 'cat-rendimentos', name: 'Rendimentos & Dividendos', icon: 'TrendingUp', color: '#14B8A6', bgLight: '#F0FDFA', type: 'income' as const },
          { id: 'cat-vendas', name: 'Vendas de Produtos / Desapego', icon: 'ShoppingBag', color: '#0D9488', bgLight: '#CCFBF1', type: 'income' as const },
          { id: 'cat-outros', name: 'Outros Lançamentos', icon: 'Layers', color: '#64748B', bgLight: '#F1F5F9', type: 'both' as const },
        ]
      : [
          { id: 'cat-alimentacao', name: 'Alimentação & Mercado', icon: 'Utensils', color: '#EC4899', bgLight: '#FDF2F8', type: 'expense' as const },
          { id: 'cat-moradia', name: 'Moradia, Aluguel & Contas', icon: 'Home', color: '#F59E0B', bgLight: '#FEF3C7', type: 'expense' as const },
          { id: 'cat-transporte', name: 'Transporte & Combustível', icon: 'Car', color: '#8B5CF6', bgLight: '#F5F3FF', type: 'expense' as const },
          { id: 'cat-lazer', name: 'Lazer & Restaurantes', icon: 'Plane', color: '#6366F1', bgLight: '#EEF2FF', type: 'expense' as const },
          { id: 'cat-compras', name: 'Compras & Vestuário', icon: 'ShoppingBag', color: '#EC4899', bgLight: '#FDF2F8', type: 'expense' as const },
          { id: 'cat-saude', name: 'Saúde, Consultas & Farmácia', icon: 'HeartPulse', color: '#06B6D4', bgLight: '#ECFEFF', type: 'expense' as const },
          { id: 'cat-outros', name: 'Outros Lançamentos', icon: 'Layers', color: '#64748B', bgLight: '#F1F5F9', type: 'both' as const },
        ];
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
    } else {
      const initialList = getFilteredCategories(defaultType);
      setType(defaultType);
      setAmount('');
      setCategory(initialList[0]?.name || (defaultType === 'income' ? 'Salário / Renda Principal' : 'Alimentação & Mercado'));
      setDescription('');
      setDate(todayStr);
    }
    setJustSaved(false);

    const timer = setTimeout(() => {
      amountInputRef.current?.focus();
    }, 30);
    return () => clearTimeout(timer);
  }, [editingTransaction, defaultType, isOpen, todayStr]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const availableCategories = getFilteredCategories(type);
  const numericAmount = parseFloat(amount.replace(',', '.')) || 0;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const list = getFilteredCategories(newType);
    if (!list.some(c => c.name === category)) {
      setCategory(list[0]?.name || '');
    }
    amountInputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      amountInputRef.current?.focus();
      return;
    }

    const selectedCategory = category || availableCategories[0]?.name || (type === 'income' ? 'Salário / Renda Principal' : 'Alimentação & Mercado');
    const finalDescription = description.trim() || SHORT_CATEGORY_LABELS[selectedCategory] || selectedCategory;

    if (editingTransaction) {
      const updated: Transaction = {
        ...editingTransaction,
        description: finalDescription,
        amount: numericAmount,
        type,
        category: selectedCategory,
        date: date || todayStr,
      };
      onSave(updated);
      onClose();
      return;
    }

    const newTransaction: Omit<Transaction, 'id'> = {
      description: finalDescription,
      amount: numericAmount,
      type,
      category: selectedCategory,
      date: date || todayStr,
      status: 'paid',
      scope: 'personal',
      paymentMethod: 'pix',
    };

    onSave(newTransaction);

    // Clear fields and prepare immediately for the next entry
    setAmount('');
    setDescription('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 10);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1E2128] border-t sm: rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden my-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
          <h2 className="text-base font-bold text-white">
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-slate-400 hover:text-white rounded-xl"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 1. Tipo: Gasto ou Ganho */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`min-h-[48px] rounded-full font-semibold text-sm transition-colors flex items-center justify-center ${
                type === 'expense'
                  ? 'bg-slate-100 text-slate-950'
                  : 'bg-[#15171C] text-slate-400 hover:text-white'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`min-h-[48px] rounded-full font-semibold text-sm transition-colors flex items-center justify-center ${
                type === 'income'
                  ? 'bg-slate-100 text-slate-950'
                  : 'bg-[#15171C] text-slate-400 hover:text-white'
              }`}
            >
              Ganho
            </button>
          </div>

          {/* 2. Valor (Campo Principal) */}
          <div>
            <label htmlFor="tx-amount-input" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Valor
            </label>
            <div
              className={`flex items-center bg-[#15171C] border-2 rounded-xl px-4 py-3 transition-colors ${
                type === 'expense'
                  ? 'border-slate-800 focus-within:border-slate-500'
                  : 'border-slate-800 focus-within:border-emerald-500/70'
              }`}
            >
              <span
                className={`text-xl font-bold mr-2 select-none ${
                  type === 'expense' ? 'text-slate-400' : 'text-emerald-400'
                }`}
              >
                R$
              </span>
              <input
                ref={amountInputRef}
                id="tx-amount-input"
                type="text"
                inputMode="decimal"
                autoFocus
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                className="w-full bg-transparent text-2xl sm:text-3xl font-semibold text-white placeholder-slate-700 focus:outline-none tabular-nums"
              />
            </div>
          </div>

          {/* 3. Categoria (Grade de Botões Pré-definidos) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-0.5">
              {availableCategories.map((cat) => {
                const IconComp = getCategoryIcon(cat.icon);
                const isSelected = category === cat.name;
                const displayLabel = SHORT_CATEGORY_LABELS[cat.name] || cat.name;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`min-h-[44px] px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-2 text-left transition-colors border ${
                      isSelected
                        ? 'bg-slate-800 border-slate-400 text-white'
                        : 'bg-[#15171C] border-slate-800/90 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <IconComp
                      className="w-4 h-4 shrink-0"
                      style={{ color: cat.color }}
                    />
                    <span className="truncate">{displayLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Descrição (Opcional) e 5. Data */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-3">
              <label htmlFor="tx-desc-input" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Descrição <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <input
                id="tx-desc-input"
                type="text"
                placeholder="Ex: Almoço, Mercado..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2.5 bg-[#15171C] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tx-date-input" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Data
              </label>
              <input
                id="tx-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[46px] px-3 py-2.5 bg-[#15171C] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-slate-600 tabular-nums"
              />
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={numericAmount <= 0}
              className={`w-full min-h-[52px] rounded-full font-semibold text-base text-slate-950 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                'bg-slate-100 hover:bg-white active:bg-slate-200'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>Salvar {type === 'expense' ? 'Gasto' : 'Ganho'}</span>
            </button>

            {justSaved && !editingTransaction && (
              <p className="text-center text-xs font-medium text-emerald-400 mt-2">
                Salvo! Campos limpos para o próximo lançamento.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
