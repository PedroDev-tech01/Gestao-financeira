import React, { useState } from 'react';
import { X, CloudUpload, ShieldCheck, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { CloudAuthPanel } from './CloudAuthPanel';
import { auth, FirebaseUser } from '../firebase';
import { AuthSessionUser } from '../types';
import { migrateLocalAccountToCloud } from '../services/migrationService';
import { setPendingMigration } from '../utils/legacyAccounts';

interface CloudMigrationModalProps {
  isOpen: boolean;
  /** Conta que está salva só neste aparelho (CPF antigo ou demonstração). */
  localUser: AuthSessionUser | null;
  itemCount: number;
  onClose: () => void;
  onMigrated: (result: { count: number; skipped: number }) => void;
}

export const CloudMigrationModal: React.FC<CloudMigrationModalProps> = ({
  isOpen,
  localUser,
  itemCount,
  onClose,
  onMigrated,
}) => {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  // Guarda a conta de origem no momento em que o modal abriu: o App troca de
  // sessão assim que o login na nuvem acontece, mas a migração precisa da conta antiga.
  const [sourceUser] = useState<AuthSessionUser | null>(localUser);

  if (!isOpen || !sourceUser) return null;

  const runMigration = async (fbUser: FirebaseUser) => {
    setStatus('uploading');
    setErrorMsg('');
    setPendingMigration(sourceUser, fbUser.uid);
    try {
      const result = await migrateLocalAccountToCloud(sourceUser, fbUser.uid, fbUser.email);
      setStatus('idle');
      onMigrated(result);
    } catch (error) {
      console.error('Migration error:', error);
      setStatus('error');
      setErrorMsg(
        'Sua conta foi criada, mas não conseguimos enviar os dados agora. Nada foi perdido: eles continuam guardados neste aparelho. Toque em "Tentar de novo".'
      );
    }
  };

  const handleRetry = () => {
    const current = auth.currentUser;
    if (current) runMigration(current);
  };

  const canClose = status !== 'uploading';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#11141D] rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border-t sm:border border-slate-800/90 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#0A0D14]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CloudUpload size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Salvar meus dados na nuvem</h3>
              <p className="text-[11px] text-slate-400">Acesse de qualquer aparelho sem perder nada</p>
            </div>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Fechar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="p-5">
          {status === 'uploading' ? (
            <div className="py-10 flex flex-col items-center text-center gap-3">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
              <p className="text-sm font-semibold text-slate-200">Enviando seus dados para a nuvem...</p>
              <p className="text-xs text-slate-400">Não feche esta tela.</p>
            </div>
          ) : status === 'error' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={16} />
                Tentar de novo
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 p-3.5 bg-[#0A0C10] border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed flex gap-2.5">
                <ShieldCheck size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  Você tem <strong className="text-white">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</strong> salvos
                  só neste aparelho. Crie uma conta (ou entre em uma que já tem) e eles serão copiados para a nuvem.
                  Se a conta já tiver dados, nada dela é apagado ou substituído.
                </span>
              </div>
              <CloudAuthPanel
                initialMode="register"
                suggestedName={sourceUser.name === 'Usuário Demo' ? '' : sourceUser.name}
                onAuthenticated={runMigration}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
