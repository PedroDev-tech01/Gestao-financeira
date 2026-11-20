import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Cloud,
  Loader2,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  getAuthErrorMessage,
  FirebaseUser,
} from '../firebase';

type Mode = 'login' | 'register' | 'reset';

interface CloudAuthPanelProps {
  /** Chamado assim que o Firebase confirma a conta (Google ou e-mail). */
  onAuthenticated: (user: FirebaseUser) => void | Promise<void>;
  /** Modo inicial do formulário de e-mail. */
  initialMode?: Mode;
  /** Nome sugerido para o cadastro (ex.: nome da conta antiga por CPF). */
  suggestedName?: string;
  /** Desabilita tudo enquanto quem usa o painel faz algo depois do login. */
  busy?: boolean;
}

const inputClass =
  'w-full pl-10 pr-4 py-2.5 bg-[#0A0C10] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors';
const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';

export const CloudAuthPanel: React.FC<CloudAuthPanelProps> = ({
  onAuthenticated,
  initialMode = 'login',
  suggestedName = '',
  busy = false,
}) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState(suggestedName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);

  const disabled = busy || loading !== null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleGoogle = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading('google');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await onAuthenticated(result.user);
    } catch (error) {
      console.error('Google auth error:', error);
      setErrorMsg(getAuthErrorMessage(error));
    } finally {
      setLoading(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Digite seu e-mail.');
      return;
    }

    if (mode === 'reset') {
      setLoading('email');
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessMsg('Se existir uma conta com este e-mail, enviamos um link para criar uma nova senha. Confira também o spam.');
      } catch (error) {
        setErrorMsg(getAuthErrorMessage(error));
      } finally {
        setLoading(null);
      }
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('Informe seu nome.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }
    }

    setLoading('email');
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        try {
          await updateProfile(cred.user, { displayName: name.trim().slice(0, 120) });
        } catch (profileError) {
          console.warn('updateProfile notice:', profileError);
        }
        await onAuthenticated(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        await onAuthenticated(cred.user);
      }
    } catch (error) {
      console.error('Email auth error:', error);
      setErrorMsg(getAuthErrorMessage(error));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      {errorMsg && (
        <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Google */}
      {mode !== 'reset' && (
        <>
          <button
            id="btn-google-login"
            type="button"
            onClick={handleGoogle}
            disabled={disabled}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed border border-slate-200"
          >
            {loading === 'google' ? (
              <Loader2 size={18} className="animate-spin text-emerald-600" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <div className="flex flex-col items-start text-left leading-tight">
              <span className="font-extrabold text-xs sm:text-sm">
                {loading === 'google' ? 'Conectando...' : 'Continuar com a Conta Google'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <Cloud size={10} className="text-emerald-600" />
                Seus dados ficam salvos na nuvem
              </span>
            </div>
          </button>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#11141D] px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider shrink-0">
              ou com e-mail
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>
        </>
      )}

      {/* E-mail e senha */}
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className={labelClass}>Seu nome</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="input-auth-name"
                type="text"
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                autoComplete="name"
                disabled={disabled}
              />
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>E-mail</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="input-auth-email"
              type="email"
              inputMode="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
              disabled={disabled}
            />
          </div>
        </div>

        {mode !== 'reset' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Senha</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="input-auth-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Mínimo de 6 caracteres' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                disabled={disabled}
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
        )}

        {mode === 'register' && (
          <div>
            <label className={labelClass}>Confirmar senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="input-auth-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                disabled={disabled}
              />
            </div>
          </div>
        )}

        <button
          id="btn-submit-email-auth"
          type="submit"
          disabled={disabled}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading === 'email' && <Loader2 size={16} className="animate-spin" />}
          <span>
            {mode === 'register' ? 'Criar conta' : mode === 'reset' ? 'Enviar link para nova senha' : 'Entrar'}
          </span>
          {loading !== 'email' && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="text-xs text-slate-400 text-center mt-4">
        {mode === 'login' && (
          <>
            Ainda não tem conta?
            <button type="button" onClick={() => switchMode('register')} className="ml-1.5 font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer">
              Criar conta
            </button>
          </>
        )}
        {mode === 'register' && (
          <>
            Já tem conta?
            <button type="button" onClick={() => switchMode('login')} className="ml-1.5 font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer">
              Entrar
            </button>
          </>
        )}
        {mode === 'reset' && (
          <button type="button" onClick={() => switchMode('login')} className="font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer">
            Voltar para o login
          </button>
        )}
      </p>
    </div>
  );
};
