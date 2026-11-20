import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  User,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Cloud,
  Loader2
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { AuthSessionUser } from '../types';
export type { AuthSessionUser };

interface LoginScreenProps {
  onLoginSuccess: (user: AuthSessionUser) => void;
}

// Helper to mask CPF as 000.000.000-00
export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  // Reject repetitive numbers (like 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  // Standard CPF checksum validation
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(10))) return false;

  return true;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberCpf, setRememberCpf] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setSuccessMsg('Autenticado com sucesso na nuvem Google!');
      onLoginSuccess({
        name: user.displayName || 'Usuário Google',
        cpf: user.email || 'Conta Google',
        uid: user.uid,
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        isCloudSynced: true,
      });
    } catch (error: any) {
      console.error('Firebase Google Auth error:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Janela do Google fechada antes de concluir o login.');
      } else {
        setErrorMsg('Erro ao conectar com a Conta Google. Tente novamente ou use CPF.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Load remembered CPF or stored users on mount
  useEffect(() => {
    const savedCpf = localStorage.getItem('aquigastos_remembered_cpf');
    if (savedCpf) {
      setCpf(maskCPF(savedCpf));
    }
  }, []);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = maskCPF(e.target.value);
    setCpf(formatted);
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const rawCpf = cpf.replace(/\D/g, '');

    if (rawCpf.length !== 11) {
      setErrorMsg('Por favor, digite um CPF válido com 11 dígitos.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('A senha deve conter no mínimo 4 dígitos.');
      return;
    }

    // Load registered accounts from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('aquigastos_registered_users') || '[]');

    if (isRegisterMode) {
      // Registration Mode
      if (!name.trim()) {
        setErrorMsg('Informe seu nome para o cadastro.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }

      const existingIndex = storedUsers.findIndex((u: any) => u.cpf === rawCpf);
      if (existingIndex >= 0) {
        setErrorMsg('Este CPF já está cadastrado. Faça login ou use outro CPF.');
        return;
      }

      const newUser = {
        name: name.trim(),
        cpf: rawCpf,
        password: password,
        createdAt: new Date().toISOString(),
      };

      storedUsers.push(newUser);
      localStorage.setItem('aquigastos_registered_users', JSON.stringify(storedUsers));

      if (rememberCpf) {
        localStorage.setItem('aquigastos_remembered_cpf', rawCpf);
      } else {
        localStorage.removeItem('aquigastos_remembered_cpf');
      }

      setSuccessMsg('Cadastro realizado com sucesso! Entrando...');
      setTimeout(() => {
        onLoginSuccess({ name: newUser.name, cpf: rawCpf });
      }, 600);

    } else {
      // Login Mode
      const user = storedUsers.find((u: any) => u.cpf === rawCpf);

      if (user) {
        if (user.password !== password) {
          setErrorMsg('Senha incorreta para este CPF.');
          return;
        }

        if (rememberCpf) {
          localStorage.setItem('aquigastos_remembered_cpf', rawCpf);
        } else {
          localStorage.removeItem('aquigastos_remembered_cpf');
        }

        onLoginSuccess({ name: user.name || 'Minhas Finanças', cpf: rawCpf });
      } else {
        // If not registered yet, auto-register seamlessly without error
        const newUser = {
          name: name.trim() || 'Minhas Finanças',
          cpf: rawCpf,
          password: password,
          createdAt: new Date().toISOString(),
        };
        storedUsers.push(newUser);
        localStorage.setItem('aquigastos_registered_users', JSON.stringify(storedUsers));
        if (rememberCpf) {
          localStorage.setItem('aquigastos_remembered_cpf', rawCpf);
        }
        setSuccessMsg('Acesso liberado com sucesso!');
        setTimeout(() => {
          onLoginSuccess({ name: newUser.name, cpf: rawCpf });
        }, 300);
      }
    }
  };

  const handleDemoLogin = () => {
    setErrorMsg('');
    const demoCpf = '123.456.789-00';
    const demoUser = {
      name: 'Usuário Demo',
      cpf: '12345678900',
    };
    onLoginSuccess(demoUser);
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-y-auto w-full py-8 sm:py-12">
      
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#11141D] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 mb-3 border border-emerald-500/30 bg-[#0E131F]">
            <img src="/icon.svg" alt="AquiGastos App Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Aqui<span className="text-emerald-400">Gastos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {isRegisterMode
              ? 'Cadastre seus dados para acessar sua gestão financeira'
              : 'Entre com seu CPF e senha para acessar suas finanças'}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Cloud Firebase Google Sign-In - Primary Recommended Option */}
        <div className="mb-6">
          <button
            id="btn-google-login"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed group border border-slate-200"
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin text-emerald-600" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <div className="flex flex-col items-start text-left leading-tight">
              <span className="font-extrabold text-xs sm:text-sm">
                {isGoogleLoading ? 'Conectando à nuvem...' : 'Entrar com a Conta Google'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <Cloud size={10} className="text-emerald-600" />
                Dados gravados no Firebase Firestore
              </span>
            </div>
          </button>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#11141D] px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider shrink-0">
              ou acesse com CPF
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>
        </div>

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Field (Only in Register Mode) */}
          {isRegisterMode && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="input-login-name"
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0A0C10] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
              </div>
            </div>
          )}

          {/* CPF Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              CPF
            </label>
            <div className="relative">
              <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="input-login-cpf"
                type="text"
                inputMode="numeric"
                required
                maxLength={14}
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0A0C10] border border-slate-800 rounded-xl text-sm font-medium tracking-wide text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Senha
              </label>
              {!isRegisterMode && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('Para redefinir, cadastre uma nova senha através de "Cadastre-se".');
                  }}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="input-login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-[#0A0C10] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
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

          {/* Confirm Password Field (Only in Register Mode) */}
          {isRegisterMode && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="input-login-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0A0C10] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {/* Remember CPF Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="checkbox-remember-cpf"
                type="checkbox"
                checked={rememberCpf}
                onChange={(e) => setRememberCpf(e.target.checked)}
                className="w-4 h-4 rounded bg-[#0A0C10] border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-emerald-500"
              />
              <span className="text-xs text-slate-400 font-medium">Lembrar meu CPF</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-login"
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>{isRegisterMode ? 'Criar Acesso e Entrar' : 'Entrar no Aplicativo'}</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </form>

        {/* Divider / Toggle Mode */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-3">
          <p className="text-xs text-slate-400">
            {isRegisterMode ? 'Já possui cadastro com seu CPF?' : 'Primeiro acesso ou novo cadastro?'}
            <button
              id="btn-toggle-login-mode"
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="ml-1.5 font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              {isRegisterMode ? 'Fazer Login' : 'Cadastre-se agora'}
            </button>
          </p>

          {/* Quick Demo Access Button */}
          <button
            id="btn-demo-login"
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2 px-3 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-[#0A0C10] hover:bg-slate-800/70 border border-slate-800/80 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} className="text-emerald-400" />
            <span>Acessar demonstração rápida (sem preencher)</span>
          </button>
        </div>

        {/* Security badge note */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck size={13} className="text-emerald-500/70" />
          <span>Acesso seguro com criptografia e armazenamento local</span>
        </div>

      </div>

    </div>
  );
};
