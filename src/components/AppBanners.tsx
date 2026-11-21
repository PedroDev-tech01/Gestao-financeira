import React from 'react';
import { CloudUpload, Search, X } from 'lucide-react';

/** Aviso para contas que guardam os dados só no aparelho (CPF antigo ou modo sem conta). */
export const LocalAccountBanner: React.FC<{ isDemo: boolean; onSaveToCloud: () => void }> = ({
  isDemo,
  onSaveToCloud,
}) => {
  return (
    <div className="mb-5 flex items-center gap-3 bg-slate-900 rounded-3xl pl-4 pr-2 py-2">
      <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-[13px] text-slate-300 leading-snug">
        {isDemo ? 'Modo sem conta: ' : 'Salvo só neste aparelho: '}
        <span className="text-slate-400">crie sua conta para não perder nada.</span>
      </p>
      <button
        id="btn-open-cloud-migration"
        type="button"
        onClick={onSaveToCloud}
        className="shrink-0 flex items-center gap-1.5 px-3.5 min-h-[38px] text-[13px] font-semibold text-slate-950 bg-slate-100 hover:bg-white rounded-full cursor-pointer active:scale-[0.98]"
      >
        <CloudUpload size={14} />
        Salvar na nuvem
      </button>
    </div>
  );
};

/** Faixa que aparece enquanto há uma busca ativa no app inteiro. */
export const SearchBanner: React.FC<{ searchQuery: string; onClear: () => void }> = ({ searchQuery, onClear }) => {
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#1E2128] to-[#1E2128] border border-emerald-800/40 rounded-2xl px-4 py-3 mb-5 animate-in fade-in">
      <div className="flex items-center gap-2.5 text-xs min-w-0">
        <div className="w-7 h-7 rounded-xl bg-slate-800 text-emerald-300 flex items-center justify-center shrink-0">
          <Search size={14} />
        </div>
        <div className="truncate">
          <span className="text-slate-300 font-medium">
            Buscando em todo o app: <strong className="text-white font-bold">"{searchQuery}"</strong>
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline ml-2">
            (Filtrando Extrato, Dívidas e Investimentos)
          </span>
        </div>
      </div>
      <button
        onClick={onClear}
        className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ml-2"
        title="Limpar pesquisa (Esc)"
      >
        <X size={13} />
        <span>Limpar</span>
      </button>
    </div>
  );
};
