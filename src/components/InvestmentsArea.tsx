import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  Coins,
  Building,
  Landmark,
  Layers,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  HelpCircle,
  PiggyBank,
  Target,
  Percent,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { InvestmentItem, InvestmentCategory } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';

interface InvestmentsAreaProps {
  investments: InvestmentItem[];
  onOpenNewInvestment: () => void;
  onEditInvestment: (item: InvestmentItem) => void;
  onDeleteInvestment: (id: string) => void;
  onOpenAporte: (item: InvestmentItem) => void;
  hideBalance: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
}

const CATEGORY_MAP: Record<InvestmentCategory, { label: string; icon: any; color: string; bg: string; border: string }> = {
  emergency_fund: {
    label: 'Reserva de Emergência',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/40',
  },
  fixed_income: {
    label: 'Renda Fixa',
    icon: Landmark,
    color: 'text-blue-400',
    bg: 'bg-blue-950/40',
    border: 'border-blue-800/40',
  },
  variable_income: {
    label: 'Renda Variável (Ações/FIIs)',
    icon: TrendingUp,
    color: 'text-purple-400',
    bg: 'bg-purple-950/40',
    border: 'border-purple-800/40',
  },
  pension_funds: {
    label: 'Previdência & Fundos',
    icon: Building,
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/40',
  },
  crypto: {
    label: 'Criptoativos',
    icon: Coins,
    color: 'text-orange-400',
    bg: 'bg-orange-950/40',
    border: 'border-orange-800/40',
  },
  other: {
    label: 'Outros',
    icon: Layers,
    color: 'text-slate-300',
    bg: 'bg-slate-900',
    border: 'border-slate-800',
  },
};

export const InvestmentsArea: React.FC<InvestmentsAreaProps> = ({
  investments,
  onOpenNewInvestment,
  onEditInvestment,
  onDeleteInvestment,
  onOpenAporte,
  hideBalance,
  searchQuery = '',
  onClearSearch,
}) => {
  const [filter, setFilter] = useState<'all' | InvestmentCategory>('all');
  const [showGuide, setShowGuide] = useState(false);

  // Totals calculations
  const totalCurrentValue = investments.reduce((sum, item) => sum + item.currentValue, 0);
  const totalInvestedAmount = investments.reduce((sum, item) => sum + item.investedAmount, 0);
  const totalProfit = totalCurrentValue - totalInvestedAmount;
  const profitPercentage = totalInvestedAmount > 0 
    ? ((totalProfit / totalInvestedAmount) * 100).toFixed(1) 
    : '0.0';

  // Specific groups
  const emergencyFunds = investments.filter(i => i.category === 'emergency_fund');
  const totalEmergency = emergencyFunds.reduce((sum, i) => sum + i.currentValue, 0);
  const totalEmergencyTarget = emergencyFunds.reduce((sum, i) => sum + (i.targetAmount || 0), 0);
  const emergencyProgress = totalEmergencyTarget > 0 
    ? Math.min(100, Math.round((totalEmergency / totalEmergencyTarget) * 100)) 
    : null;

  // Asset allocation breakdown
  const categoryAllocation = React.useMemo(() => {
    if (totalCurrentValue <= 0) return [];
    const grouped: { [key in InvestmentCategory]?: number } = {};
    investments.forEach(item => {
      grouped[item.category] = (grouped[item.category] || 0) + item.currentValue;
    });

    return Object.entries(grouped).map(([catKey, val]) => {
      const config = CATEGORY_MAP[catKey as InvestmentCategory];
      const percentage = Math.round((val / totalCurrentValue) * 100);
      return {
        key: catKey as InvestmentCategory,
        label: config.label,
        value: val,
        percentage,
        color: config.color,
      };
    });
  }, [investments, totalCurrentValue]);

  const filteredInvestments = React.useMemo(() => {
    let result = filter === 'all' 
      ? investments 
      : investments.filter(i => i.category === filter);

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(i => {
        const title = i.title.toLowerCase();
        const inst = i.institution.toLowerCase();
        const notes = (i.notes || '').toLowerCase();
        const catLabel = (CATEGORY_MAP[i.category]?.label || '').toLowerCase();
        return title.includes(q) || inst.includes(q) || notes.includes(q) || catLabel.includes(q);
      });
    }

    return result;
  }, [investments, filter, searchQuery]);

  return (
    <div className="space-y-5">
      
      {/* 1. TOP OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Card 1: Patrimônio Total Investido */}
        <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between">

          <div>
            <div className="flex items-center justify-between mb-2.5 relative z-10">
              <span className="text-xs font-bold  text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" />
                Patrimônio Acumulado
              </span>
              <button
                onClick={onOpenNewInvestment}
                className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/60 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              >
                <Plus size={13} />
                <span>Aplicar</span>
              </button>
            </div>

            <div className="text-2xl sm:text-3xl font-semibold text-emerald-400 tracking-tight relative z-10 truncate">
              {hideBalance ? '••••••' : formatCurrency(totalCurrentValue)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span>Rendimento Acumulado:</span>
            {!hideBalance ? (
              <span className={`font-bold flex items-center gap-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalProfit >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)} ({profitPercentage}%)</span>
              </span>
            ) : (
              <span>••••••</span>
            )}
          </div>
        </div>

        {/* Card 2: Total Aportado (Do Bolso) */}
        <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between">

          <div>
            <div className="flex items-center justify-between mb-2.5 relative z-10">
              <span className="text-xs font-bold  text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-xs" />
                Total Aportado
              </span>
              <span className="text-[10px] text-slate-500">Capital Próprio</span>
            </div>

            <div className="text-2xl sm:text-3xl font-semibold text-slate-100 tracking-tight relative z-10 truncate">
              {hideBalance ? '••••••' : formatCurrency(totalInvestedAmount)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span>Ativos em carteira:</span>
            <span className="font-bold text-slate-200">{investments.length} {investments.length === 1 ? 'aplicação' : 'aplicações'}</span>
          </div>
        </div>

        {/* Card 3: Reserva de Emergência */}
        <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 hover:border-teal-500/40 hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between">

          <div>
            <div className="flex items-center justify-between mb-2.5 relative z-10">
              <span className="text-xs font-bold  text-slate-300 flex items-center gap-2">
                <Shield size={14} className="text-teal-400" />
                Reserva de Emergência
              </span>
              <span className="text-[10px] text-teal-400 font-bold bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-800/40">
                Alta Liquidez
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-semibold text-teal-400 tracking-tight relative z-10 truncate">
              {hideBalance ? '••••••' : formatCurrency(totalEmergency)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 relative z-10">
            {emergencyProgress !== null ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Progresso da meta:</span>
                  <span className="font-bold text-teal-300">{emergencyProgress}% de {formatCurrency(totalEmergencyTarget)}</span>
                </div>
                <div className="w-full bg-[#15171C] h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                    style={{ width: `${emergencyProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>Proteção imediata para imprevistos</span>
                <span className="text-emerald-400 font-semibold">{emergencyFunds.length} reserva(s)</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 2. ALOCAÇÃO DO PATRIMÔNIO (DISTRIBUIÇÃO POR CLASSE) */}
      {totalCurrentValue > 0 && categoryAllocation.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold  text-slate-300 flex items-center gap-1.5">
              <Percent size={14} className="text-emerald-400" />
              <span>Distribuição do seu Dinheiro Investido</span>
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Equilíbrio entre segurança e crescimento
            </span>
          </div>

          {/* Segmented bar */}
          <div className="w-full bg-[#15171C] h-3 rounded-full overflow-hidden flex border border-slate-800 p-0.5 gap-0.5">
            {categoryAllocation.map(alloc => (
              <div
                key={alloc.key}
                title={`${alloc.label}: ${alloc.percentage}%`}
                className={`h-full rounded-full transition-all ${
                  alloc.key === 'emergency_fund' ? 'bg-emerald-500' :
                  alloc.key === 'fixed_income' ? 'bg-blue-500' :
                  alloc.key === 'variable_income' ? 'bg-purple-500' :
                  alloc.key === 'crypto' ? 'bg-orange-500' :
                  alloc.key === 'pension_funds' ? 'bg-amber-500' : 'bg-slate-400'
                }`}
                style={{ width: `${Math.max(4, alloc.percentage)}%` }}
              />
            ))}
          </div>

          {/* Legend tags */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs pt-1">
            {categoryAllocation.map(alloc => (
              <div key={alloc.key} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  alloc.key === 'emergency_fund' ? 'bg-emerald-500' :
                  alloc.key === 'fixed_income' ? 'bg-blue-500' :
                  alloc.key === 'variable_income' ? 'bg-purple-500' :
                  alloc.key === 'crypto' ? 'bg-orange-500' :
                  alloc.key === 'pension_funds' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                <span className="text-slate-300 font-medium">{alloc.label}:</span>
                <span className="text-white font-bold">{alloc.percentage}%</span>
                {!hideBalance && (
                  <span className="text-slate-500 text-[11px]">({formatCurrency(alloc.value)})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DIDACTIC INVESTOR GUIDANCE BANNER */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
              <PiggyBank size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>O Caminho do Investidor Inteligente</span>
                <span className="text-[10px] text-teal-400 font-medium bg-teal-950/50 border border-teal-800/40 px-2 py-0.5 rounded-md">
                  Didático
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Antes de buscar rentabilidades altas em ações ou criptos, garanta de 3 a 6 meses do seu custo fixo em uma <strong>Reserva de Emergência</strong> (CDB com liquidez diária ou Tesouro Selic).
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="ml-12 sm:ml-0 text-xs font-semibold text-slate-300 hover:text-white bg-[#15171C] hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 self-start sm:self-auto active:scale-95 whitespace-nowrap"
          >
            {showGuide ? 'Ocultar Dicas' : 'Ver Guia Completo'}
          </button>
        </div>

        {showGuide && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-200">
            <div className="p-3 bg-[#15171C] rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-emerald-400 block mb-1">1. Passo Fundamental</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <strong>Reserva de Emergência:</strong> Dinheiro de socorro para problemas mecânicos, saúde ou transição de trabalho. Deve estar em bancos sólidos e com resgate no mesmo dia.
              </p>
            </div>

            <div className="p-3 bg-[#15171C] rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-blue-400 block mb-1">2. Renda Fixa & Metas</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <strong>Previsibilidade:</strong> CDBs de médio prazo, LCI/LCA (sem imposto de renda) e Tesouro IPCA para proteger seu dinheiro da inflação em compras futuras.
              </p>
            </div>

            <div className="p-3 bg-[#15171C] rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-purple-400 block mb-1">3. Longo Prazo</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <strong>Renda Variável & Dividendos:</strong> Fundos imobiliários que pagam aluguéis mensais isentos e ações de empresas sólidas com paciência para multiplicar patrimônio.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search Filter Indicator Banner */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-2xl text-xs text-blue-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <span>
              Filtrando investimentos por: <strong className="text-white font-semibold">"{searchQuery}"</strong> ({filteredInvestments.length} {filteredInvestments.length === 1 ? 'encontrado' : 'encontrados'})
            </span>
          </div>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="text-xs text-blue-300 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer shrink-0"
            >
              Limpar busca
            </button>
          )}
        </div>
      )}

      {/* 4. ACTIONS & CATEGORY FILTER TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#15171C] rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({investments.length})
          </button>
          <button
            onClick={() => setFilter('emergency_fund')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              filter === 'emergency_fund'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Reserva ({emergencyFunds.length})
          </button>
          <button
            onClick={() => setFilter('fixed_income')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              filter === 'fixed_income'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Renda Fixa
          </button>
          <button
            onClick={() => setFilter('variable_income')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              filter === 'variable_income'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Renda Variável
          </button>
          <button
            onClick={() => setFilter('crypto')}
            className={`shrink-0 px-3.5 min-h-[36px] rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              filter === 'crypto'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Cripto
          </button>
        </div>

        <button
          onClick={onOpenNewInvestment}
          className="text-sm font-semibold text-slate-950 bg-slate-100 hover:bg-white px-4 min-h-[40px] rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus size={15} />
          <span>Cadastrar Novo Investimento</span>
        </button>
      </div>

      {/* 5. LIST OF INVESTMENTS */}
      {filteredInvestments.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl p-8 text-center">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
            <PiggyBank size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-100 mb-1">
            {filter === 'all' 
              ? 'Nenhum investimento cadastrado ainda' 
              : 'Nenhuma aplicação nesta categoria'}
          </h3>
          <p className="text-xs text-slate-400 mb-5 max-w-md mx-auto leading-relaxed">
            Comece cadastrando sua Reserva de Emergência (guardada no Nubank, Inter ou Poupança) ou seus títulos de Renda Fixa e Ações para acompanhar seu patrimônio crescer.
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <button
              onClick={onOpenNewInvestment}
              className="text-xs font-bold text-[#15171C] bg-emerald-400 hover:bg-emerald-300 px-4 py-2.5 rounded-full transition-all shadow-md cursor-pointer active:scale-95"
            >
              + Cadastrar Meu Primeiro Investimento
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInvestments.map(item => {
            const config = CATEGORY_MAP[item.category];
            const Icon = config.icon;
            const itemProfit = item.currentValue - item.investedAmount;
            const itemProfitPct = item.investedAmount > 0 
              ? ((itemProfit / item.investedAmount) * 100).toFixed(1) 
              : '0.0';
            const progress = item.targetAmount && item.targetAmount > 0 
              ? Math.min(100, Math.round((item.currentValue / item.targetAmount) * 100)) 
              : null;

            return (
              <div
                key={item.id}
                className="bg-slate-900 rounded-3xl p-5 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Category badge & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl ${config.bg} border ${config.border} ${config.color} flex items-center justify-center shrink-0 shadow-xs`}>
                        <Icon size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                            {item.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {item.institution && (
                            <span className="font-semibold text-slate-300">{item.institution}</span>
                          )}
                          {item.institution && <span>•</span>}
                          <span className={config.color}>{config.label}</span>
                          {item.yieldRate && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-medium">{item.yieldRate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditInvestment(item)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer active:scale-95"
                        title="Editar investimento"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteInvestment(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer active:scale-95"
                        title="Excluir investimento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Financial Values Box */}
                  <div className="p-3.5 bg-[#15171C]/90 rounded-2xl mb-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs font-medium text-slate-400 block mb-0.5">
                          Saldo Atual Aplicado
                        </span>
                        <span className="text-xl font-semibold text-emerald-400">
                          {hideBalance ? '••••••' : formatCurrency(item.currentValue)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-400 block mb-0.5">
                          Rendimento
                        </span>
                        {!hideBalance ? (
                          <span className={`text-xs font-bold flex items-center justify-end gap-0.5 ${itemProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {itemProfit >= 0 ? '+' : ''}{formatCurrency(itemProfit)} ({itemProfitPct}%)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">••••••</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Total Aportado:</span>
                      <span className="text-slate-200 font-medium">
                        {hideBalance ? '••••••' : formatCurrency(item.investedAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Target progress if specified */}
                  {progress !== null && item.targetAmount && (
                    <div className="mb-3 p-2.5 bg-[#15171C]/50 rounded-xl border border-slate-800/60 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Target size={12} className="text-teal-400" />
                          <span>Meta do Objetivo:</span>
                        </span>
                        <span className="font-bold text-teal-300">
                          {progress}% <span className="text-slate-500 font-normal">de {formatCurrency(item.targetAmount)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes if any */}
                  {item.notes && (
                    <p className="text-[11px] text-slate-400 italic mb-3 line-clamp-2 px-1">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Card Action Button: Add Aporte / Resgatar */}
                <button
                  onClick={() => onOpenAporte(item)}
                  className="w-full py-2.5 px-3.5 bg-[#15171C] hover:bg-emerald-950/40 text-slate-200 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <PlusCircle size={14} className="text-emerald-400" />
                  <span>Aportar ou Resgatar</span>
                </button>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
