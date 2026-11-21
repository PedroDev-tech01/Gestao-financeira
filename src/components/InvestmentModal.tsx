import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  TrendingUp,
  Shield,
  Coins,
  Building,
  Landmark,
  Layers,
  Sparkles
} from 'lucide-react';
import { InvestmentItem, InvestmentCategory } from '../types';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (investment: Omit<InvestmentItem, 'id' | 'createdAt'> | InvestmentItem) => void;
  editingInvestment?: InvestmentItem | null;
}

const CATEGORY_CONFIGS: {
  key: InvestmentCategory;
  label: string;
  icon: any;
  desc: string;
  color: string;
  badgeBg: string;
}[] = [
  {
    key: 'emergency_fund',
    label: 'Reserva de Emergência',
    icon: Shield,
    desc: 'Para imprevistos. Alta liquidez e resgate imediato (ex: CDB liquidez diária, Poupança ou Tesouro Selic).',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/40 border-emerald-800/40',
  },
  {
    key: 'fixed_income',
    label: 'Renda Fixa',
    icon: Landmark,
    desc: 'Segurança e previsibilidade (ex: Tesouro IPCA/Prefixado, CDBs a prazo, LCI e LCA isentas de IR).',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-950/40 border-blue-800/40',
  },
  {
    key: 'variable_income',
    label: 'Renda Variável (Ações & FIIs)',
    icon: TrendingUp,
    desc: 'Foco no médio e longo prazo com dividendos e valorização (ex: Fundos Imobiliários, Ações brasileiras e internacionais).',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-950/40 border-purple-800/40',
  },
  {
    key: 'pension_funds',
    label: 'Previdência & Fundos',
    icon: Building,
    desc: 'Previdência privada (PGBL/VGBL) ou fundos de investimentos geridos por especialistas.',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/40 border-amber-800/40',
  },
  {
    key: 'crypto',
    label: 'Criptoativos',
    icon: Coins,
    desc: 'Moedas digitais de maior volatilidade (ex: Bitcoin, Ethereum, stablecoins).',
    color: 'text-orange-400',
    badgeBg: 'bg-orange-950/40 border-orange-800/40',
  },
  {
    key: 'other',
    label: 'Outros Investimentos',
    icon: Layers,
    desc: 'Qualquer outra aplicação financeira ou patrimonial.',
    color: 'text-slate-300',
    badgeBg: 'bg-slate-900 border-slate-700',
  },
];

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingInvestment,
}) => {
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('emergency_fund');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [yieldRate, setYieldRate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingInvestment) {
      setTitle(editingInvestment.title);
      setInstitution(editingInvestment.institution || '');
      setCategory(editingInvestment.category);
      setInvestedAmount(editingInvestment.investedAmount.toString());
      setCurrentValue(editingInvestment.currentValue.toString());
      setTargetAmount(editingInvestment.targetAmount ? editingInvestment.targetAmount.toString() : '');
      setYieldRate(editingInvestment.yieldRate || '');
      setNotes(editingInvestment.notes || '');
    } else {
      setTitle('');
      setInstitution('');
      setCategory('emergency_fund');
      setInvestedAmount('');
      setCurrentValue('');
      setTargetAmount('');
      setYieldRate('');
      setNotes('');
    }
  }, [editingInvestment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invested = parseFloat(investedAmount.replace(',', '.'));
    const current = currentValue.trim() 
      ? parseFloat(currentValue.replace(',', '.')) 
      : invested;
    const target = targetAmount.trim() ? parseFloat(targetAmount.replace(',', '.')) : undefined;

    if (isNaN(invested) || invested < 0) return;
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      institution: institution.trim() || undefined,
      category,
      investedAmount: invested,
      currentValue: isNaN(current) ? invested : current,
      targetAmount: target && target > 0 ? target : undefined,
      yieldRate: yieldRate.trim() || undefined,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    if (editingInvestment) {
      onSave({
        ...data,
        id: editingInvestment.id,
        createdAt: editingInvestment.createdAt,
        history: editingInvestment.history,
      });
    } else {
      onSave({
        ...data,
        createdAt: new Date().toISOString(),
      });
    }

    onClose();
  };

  const selectedCategoryConfig = CATEGORY_CONFIGS.find(c => c.key === category);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full border-t sm: overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh]">
        
        {/* Mobile pull indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/80 bg-[#15171C]/80">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              <span>{editingInvestment ? 'Editar Investimento' : 'Novo Investimento ou Reserva'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe seu patrimônio aplicado, rendimentos e metas de poupança
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
          
          {/* Categoria / Tipo de Ativo */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1.5">
              Classe do Investimento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_CONFIGS.map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-xs'
                        : 'bg-[#15171C] border-slate-800/80 hover:border-slate-700 opacity-80'
                    }`}
                  >
                    <Icon size={16} className={isSelected ? 'text-emerald-400' : 'text-slate-400'} />
                    <span className={`text-xs font-bold mt-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedCategoryConfig && (
              <p className="text-[11px] text-slate-400 mt-2 bg-[#15171C] p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                <span className="font-semibold text-slate-300">{selectedCategoryConfig.label}:</span> {selectedCategoryConfig.desc}
              </p>
            )}
          </div>

          {/* Nome do Investimento */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1.5">
              Nome da Aplicação / Ativo
            </label>
            <input
              type="text"
              required
              placeholder="Ex: CDB 100% CDI Liquidez Diária, Tesouro Selic 2029, FII MXRF11"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#15171C] border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 transition-all"
              autoFocus
            />
          </div>

          {/* Banco / Corretora / Instituição */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1.5">
              Banco, Corretora ou Instituição <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Nubank, Banco Inter, XP Investimentos, BTG, Itaú, Binance"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#15171C] border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 transition-all"
            />
          </div>

          {/* Valores: Aportado vs Valor Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Valor Aportado */}
            <div>
              <label className="text-xs font-bold  text-slate-300 block mb-1.5">
                Total Aportado (Do Bolso)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
                  value={investedAmount}
                  onChange={(e) => setInvestedAmount(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm font-bold bg-[#15171C] border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500/60 transition-all placeholder:text-slate-600"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Quanto dinheiro você colocou.
              </span>
            </div>

            {/* Saldo Atual com Rendimentos */}
            <div>
              <label className="text-xs font-bold  text-slate-300 block mb-1.5">
                Saldo Hoje (Com Lucro)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0,00 (igual ao aportado se novo)"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm font-bold bg-[#15171C] border border-slate-800 rounded-xl text-emerald-300 focus:outline-none focus:border-emerald-500/60 transition-all placeholder:text-slate-600"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Saldo acumulado atualizado hoje.
              </span>
            </div>
          </div>

          {/* Meta de Valor & Taxa de Rendimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Meta de Valor (Goal) */}
            <div>
              <label className="text-xs font-bold  text-slate-300 block mb-1.5">
                Meta do Objetivo <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-teal-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Ex: 15.000,00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-[#15171C] border border-slate-800 rounded-xl text-teal-300 focus:outline-none focus:border-teal-500/60 transition-all"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Ideal para calcular % da Reserva de Emergência.
              </span>
            </div>

            {/* Taxa de Rendimento Contratada */}
            <div>
              <label className="text-xs font-bold  text-slate-300 block mb-1.5">
                Taxa Contratada <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 100% do CDI, IPCA + 6%, 12% a.a."
                value={yieldRate}
                onChange={(e) => setYieldRate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#15171C] border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Para seu controle de rentabilidade.
              </span>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-bold  text-slate-300 block mb-1">
              Observações ou Detalhes <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Resgate imediato pelo app; carência até 2026; reinvestir dividendos mensais."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 text-xs bg-[#15171C] border border-slate-800 rounded-xl text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 resize-none"
            />
          </div>

          {/* Botão Salvar */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-[#15171C] bg-emerald-400 hover:bg-emerald-300 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Check size={18} />
              <span>{editingInvestment ? 'Salvar Alterações' : 'Cadastrar Investimento'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
