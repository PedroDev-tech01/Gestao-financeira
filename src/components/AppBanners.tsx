import React from 'react';
import { CloudUpload, Search, X } from 'lucide-react';

/** Aviso para contas que guardam os dados só no aparelho (CPF antigo ou modo sem conta). */
export const LocalAccountBanner: React.FC<{ isDemo: boolean; onSaveToCloud: () => void }> = ({
  isDemo,
  onSaveToCloud,
}) => {
  return (
    <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-gradient-to-r from-amber-950/40 via-[#131A29] to-[#0E131F] border border-amber-700/40 rounded-2xl px-4 py-3">
      <div className="text-xs text-amber-100 leading-relaxed">
        <strong className="text-amber-300">
          {isDemo ? 'Você está no modo sem conta.' : 'Seus dados estão salvos só neste aparelho.'}
        </strong>{' '}
        Se limpar o navegador ou trocar de celular, eles somem. Crie sua conta para guardar tudo na nuvem.
      </div>
      <button
        id="btn-open-cloud-migration"
        type="button"
        onClick={onSaveToCloud}
        className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer active:scale-[0.98]"
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
    <div className="flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#131A29] to-[#0E131F] border border-emerald-800/40 rounded-2xl px-4 py-3 mb-5 shadow-xs animate-in fade-in">
      <div className="flex items-center gap-2.5 text-xs min-w-0">
        <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
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
        className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ml-2"
        title="Limpar pesquisa (Esc)"
      >
        <X size={13} />
        <span>Limpar</span>
      </button>
    </div>
  );
};
