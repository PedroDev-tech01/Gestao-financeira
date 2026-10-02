import React, { useState } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface MonthPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string; // YYYY-MM
  onSelectMonth: (month: string) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MonthPickerModal: React.FC<MonthPickerModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  onSelectMonth,
}) => {
  const [selectedYear, setSelectedYear] = useState(() => {
    return parseInt(currentMonth.split('-')[0], 10) || new Date().getFullYear();
  });

  if (!isOpen) return null;

  const currentActiveMonthNum = parseInt(currentMonth.split('-')[1], 10);
  const currentActiveYearNum = parseInt(currentMonth.split('-')[0], 10);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonthNum = today.getMonth() + 1;
  const todayMonthStr = `${todayYear}-${String(todayMonthNum).padStart(2, '0')}`;

  const handleSelect = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, '0');
    onSelectMonth(`${selectedYear}-${formattedMonth}`);
    onClose();
  };

  const handleGoToday = () => {
    onSelectMonth(todayMonthStr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#141B29] to-[#0E131F] rounded-t-3xl sm:rounded-3xl max-w-sm w-full shadow-2xl border-t sm:border border-slate-800/90 overflow-hidden flex flex-col">
        
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#0A0D14]/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Escolher Mês</h3>
              <p className="text-[11px] text-slate-400">Navegue rapidamente para qualquer período</p>
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

        {/* Year Selector Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-[#0D121F]/60">
          <button
            onClick={() => setSelectedYear(y => y - 1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            title="Ano anterior"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="text-sm font-black text-slate-200 tracking-wide">
            {selectedYear}
          </span>

          <button
            onClick={() => setSelectedYear(y => y + 1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            title="Próximo ano"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Months Grid */}
        <div className="p-4 grid grid-cols-3 gap-2">
          {MONTH_NAMES.map((name, index) => {
            const isSelected = selectedYear === currentActiveYearNum && (index + 1) === currentActiveMonthNum;
            const isCurrentMonth = selectedYear === todayYear && (index + 1) === todayMonthNum;

            return (
              <button
                key={name}
                onClick={() => handleSelect(index)}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 relative ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                    : isCurrentMonth
                    ? 'bg-slate-800/90 text-emerald-300 border border-emerald-500/40 hover:bg-slate-800'
                    : 'bg-[#0A0D14] text-slate-300 hover:bg-slate-800 border border-slate-800/80 hover:text-white'
                }`}
              >
                <span>{name}</span>
                {isCurrentMonth && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                    isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-950 text-emerald-400'
                  }`}>
                    Hoje
                  </span>
                )}
                {isSelected && (
                  <Check size={12} className="text-white absolute top-1.5 right-1.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer with "Ir para o Mês Atual" shortcut */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0A0D14]/70 flex items-center justify-between">
          <button
            onClick={handleGoToday}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Voltar para o Mês Atual (Hoje)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
