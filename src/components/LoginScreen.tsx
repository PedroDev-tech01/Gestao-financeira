import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Loader2,
  ChevronLeft,
  History,
} from 'lucide-react';
import type { FirebaseUser } from '../firebase';
import { AuthSessionUser } from '../types';
import { CloudAuthPanel } from './CloudAuthPanel';
import { hasLegacyCpfAccounts, verifyLegacyCpfLogin, getCpfMigrationInfo, DEMO_CPF } from '../utils/legacyAccounts';
export type { AuthSessionUser };

interface LoginScreenProps {
  onLoginSuccess: (user: AuthSessionUser) => void;
}

export { maskCPF, validateCPF } from '../utils/cpf';
import { maskCPF } from '../utils/cpf';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyAvailable] = useState(() => hasLegacyCpfAccounts());
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [legacyLoading, setLegacyLoading] = useState(false);

  useEffect(() => {
    const savedCpf = localStorage.getItem('aquigastos_remembered_cpf');
    if (savedCpf) setCpf(maskCPF(savedCpf));
  }, []);

  const handleCloudAuthenticated = (user: FirebaseUser) => {
    onLoginSuccess({
      name: user.displayName || user.email?.split('@')[0] || 'Minhas Finanças',
      cpf: user.email || user.uid,
      uid: user.uid,
      email: user.email || undefined,
      photoURL: user.photoURL || undefined,
      isCloudSynced: true,
    });
  };

  // Login de contas antigas por CPF (somente as que já existem neste aparelho)
  const handleLegacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const rawCpf = cpf.replace(/\D/g, '');
    if (rawCpf.length !== 11) {
      setErrorMsg('Digite o CPF com 11 dígitos.');
      return;
    }
    if (!password) {
      setErrorMsg('Digite a senha da sua conta antiga.');
      return;
    }

    setLegacyLoading(true);
    try {
      const result = await verifyLegacyCpfLogin(rawCpf, password);
      if (!result.ok) {
        setErrorMsg(
          result.reason === 'wrong_password'
            ? 'Senha incorreta para este CPF.'
            : 'Não encontramos conta com este CPF neste aparelho. Novos cadastros são feitos com Google ou e-mail.'
        );
        return;
      }
      localStorage.setItem('aquigastos_remembered_cpf', rawCpf);
      onLoginSuccess({ name: result.name || 'Minhas Finanças', cpf: rawCpf });
    } finally {
      setLegacyLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setErrorMsg('');
    onLoginSuccess({ name: 'Usuário Demo', cpf: DEMO_CPF });
  };

  const rawTypedCpf = cpf.replace(/\D/g, '');
  const migrationInfo = rawTypedCpf.length === 11 ? getCpfMigrationInfo(rawTypedCpf) : null;

  return (
    <div className="min-h-screen bg-[#15171C] flex items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-y-auto w-full py-8 sm:py-12">

      <div className="w-full max-w-md bg-[#1E2128] rounded-3xl p-6 sm:p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden mb-3 border border-emerald-500/30 bg-[#1E2128]">
            <img src="/icon.svg" alt="AquiGastos App Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Aqui<span className="text-slate-400">Gastos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {showLegacy
              ? 'Acesse sua conta antiga para levar seus dados para a nuvem'
              : 'Entre para acessar suas finanças em qualquer aparelho'}
          </p>
        </div>

        {!showLegacy ? (
          <>
            <CloudAuthPanel onAuthenticated={handleCloudAuthenticated} />

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-3">
              {legacyAvailable && (
                <button
                  id="btn-legacy-cpf-login"
                  type="button"
                  onClick={() => { setShowLegacy(true); setErrorMsg(''); }}
                  className="w-full py-2 px-3 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-700/40 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <History size={14} />
                  <span>Tenho uma conta antiga com CPF neste aparelho</span>
                </button>
              )}
              <button
                id="btn-demo-login"
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-[#15171C] hover:bg-slate-800/70 border border-slate-800/80 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} className="text-emerald-400" />
                <span>Experimentar sem conta (fica só neste aparelho)</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {migrationInfo && (
              <div className="mb-5 p-3.5 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl text-xs text-emerald-200">
                Os dados deste CPF já foram enviados para a nuvem
                {migrationInfo.email ? <> na conta <strong>{migrationInfo.email}</strong></> : null}.
                Prefira entrar por ela. A cópia antiga continua guardada aqui.
              </div>
            )}

            <form onSubmit={handleLegacySubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold  text-slate-400 mb-1.5">CPF</label>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="input-login-cpf"
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => { setCpf(maskCPF(e.target.value)); if (errorMsg) setErrorMsg(''); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#15171C] border border-slate-800 rounded-xl text-sm font-medium tracking-wide text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold  text-slate-400 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(''); }}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#15171C] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-1"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={legacyLoading}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-white font-bold text-sm text-slate-950 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-75"
              >
                {legacyLoading && <Loader2 size={16} className="animate-spin" />}
                <span>Entrar na conta antiga</span>
                {!legacyLoading && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="mt-4 text-[11px] text-slate-500 text-center leading-relaxed">
              Depois de entrar, use o botão <strong className="text-slate-300">Salvar na nuvem</strong> para criar
              sua conta e não perder seus dados se trocar de aparelho.
            </p>

            <button
              type="button"
              onClick={() => { setShowLegacy(false); setErrorMsg(''); }}
              className="mt-5 w-full flex items-center justify-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <ChevronLeft size={14} />
              Voltar
            </button>
          </>
        )}

        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck size={13} className="text-emerald-500/70" />
          <span>Login protegido pelo Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
};
