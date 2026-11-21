import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Transaction } from '../types';
import { getMonthNameAndYear, formatCurrency } from '../utils/formatters';
import { generateAndDownloadPDF, generateAndDownloadCSV } from '../utils/exportEngine';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  transactions: Transaction[];
  userName: string;
  availableMonths: string[];
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  transactions,
  userName,
  availableMonths,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Compute metrics for the export configuration
  const { filteredTransactions, totalIncome, totalExpense, netBalance, categoryTotals } = useMemo(() => {
    const list = transactions.filter(t => t.date.startsWith(selectedMonth));

    let inc = 0;
    let exp = 0;
    const catMap: Record<string, number> = {};

    list.forEach(t => {
      if (t.type === 'income') {
        inc += t.amount;
      } else if (t.type === 'expense') {
        exp += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }
    });

    const cats = Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: exp > 0 ? (amount / exp) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      filteredTransactions: list,
      totalIncome: inc,
      totalExpense: exp,
      netBalance: inc - exp,
      categoryTotals: cats,
    };
  }, [transactions, selectedMonth]);

  if (!isOpen) return null;

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      generateAndDownloadPDF({
        month: selectedMonth,
        userName,
        transactions: filteredTransactions,
        totalIncome,
        totalExpense,
        netBalance,
        categoryTotals,
      });
      setSuccessMessage('Relatório em PDF gerado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      generateAndDownloadCSV({
        month: selectedMonth,
        userName,
        transactions,
        totalIncome,
        totalExpense,
        netBalance,
        categoryTotals,
      });
      setSuccessMessage('Planilha CSV formatada gerada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1E2128] rounded-t-3xl sm:rounded-3xl max-w-lg w-full border-t sm: overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh]">
        
        {/* Mobile pull indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4.5 border-b border-slate-800 bg-[#15171C]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-emerald-300 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Exportação de Relatórios
              </h2>
              <p className="text-xs text-slate-400">
                Gere demonstrativos detalhados em PDF ou CSV
              </p>
            </div>
          </div>

          <button
            id="close-export-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-semibold animate-in fade-in">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Period Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>Mês de Referência</span>
            </label>
            <select
              id="export-select-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#15171C] border border-slate-800 rounded-xl font-medium text-slate-200 focus:outline-emerald-500 cursor-pointer"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {getMonthNameAndYear(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Metrics Preview */}
          <div className="bg-[#15171C] p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400  block mb-2">
              Resumo do Período ({filteredTransactions.length} lançamentos)
            </span>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Entradas</span>
                <span className="font-bold text-emerald-400">
                  + {formatCurrency(totalIncome)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Saídas</span>
                <span className="font-bold text-rose-400">
                  - {formatCurrency(totalExpense)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Resultado</span>
                <span className={`font-bold ${netBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {netBalance >= 0 ? `+ ${formatCurrency(netBalance)}` : `- ${formatCurrency(Math.abs(netBalance))}`}
                </span>
              </div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-3.5 bg-[#1E2128] hover:bg-[#2A2E37] border border-slate-700/80 rounded-2xl transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400">
                  <FileText size={20} />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                    Baixar Relatório em PDF
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Documento formal para controle e impressão
                  </div>
                </div>
              </div>
              <Download size={18} className="text-slate-400 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-3.5 bg-[#1E2128] hover:bg-[#2A2E37] border border-slate-700/80 rounded-2xl transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Baixar Planilha em CSV (Excel)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Compatível com Excel, Google Sheets e LibreOffice
                  </div>
                </div>
              </div>
              <Download size={18} className="text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
