import { useEffect, useState } from 'react';
import type { AuthSessionUser } from '../types';
import type { FinanceData } from './useFinanceData';
import type { AddToast } from './useToasts';
import {
  getCurrentFirebaseUser,
  migrateLocalAccountToCloud,
  onAuthChange,
  preloadCloud,
  saveUserProfile,
  signInWithGoogle,
  signOutCloud,
} from '../services/cloud';
import { purgeLegacySharedStorage } from '../utils/userStorage';
import { getPendingMigration } from '../utils/legacyAccounts';

const SESSION_KEY = 'aquigastos_active_session';

function readSavedSession(): AuthSessionUser | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function persistSession(user: AuthSessionUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

function toCloudUser(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): AuthSessionUser {
  return {
    name: user.displayName || user.email?.split('@')[0] || 'Minhas Finanças',
    cpf: user.email || user.uid,
    uid: user.uid,
    email: user.email || undefined,
    photoURL: user.photoURL || undefined,
    isCloudSynced: true,
  };
}

/** Estado da sessão: quem está usando o app agora e se está logado na nuvem. */
export function useSessionState() {
  const [initialUser] = useState<AuthSessionUser | null>(readSavedSession);
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(initialUser);
  // UID do Firebase quando há login na nuvem (null em contas só do aparelho)
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  return { initialUser, currentUser, setCurrentUser, firebaseUid, setFirebaseUid };
}

export type SessionState = ReturnType<typeof useSessionState>;

/**
 * Login, logout, troca de conta e acompanhamento do Firebase Auth.
 * Sempre troca os dados junto com o usuário, para nada vazar entre contas.
 */
export function useAuthSession(session: SessionState, data: FinanceData, addToast: AddToast) {
  const { initialUser, setCurrentUser, firebaseUid, setFirebaseUid } = session;
  const { loadAccount, clearData } = data;

  const enterAccount = (user: AuthSessionUser) => {
    loadAccount(user);
    setCurrentUser(user);
    setFirebaseUid(user.uid || null);
    persistSession(user);
  };

  const leaveAccount = () => {
    setCurrentUser(null);
    setFirebaseUid(null);
    clearData();
    persistSession(null);
    purgeLegacySharedStorage();
  };

  // Acompanha o login do Firebase (carregado em segundo plano)
  useEffect(() => {
    purgeLegacySharedStorage();
    preloadCloud();
    const savedCpf = initialUser?.cpf;
    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        const cloudUser = toCloudUser(fbUser);
        const account = loadAccount(cloudUser);
        setFirebaseUid(fbUser.uid);
        setCurrentUser(cloudUser);
        persistSession(cloudUser);
        try {
          await saveUserProfile(fbUser.uid, {
            displayName: cloudUser.name,
            email: cloudUser.email,
            photoURL: cloudUser.photoURL,
            cpf: savedCpf && !savedCpf.includes('@') ? savedCpf : undefined,
            hideBalance: account.hideBalance,
          });
        } catch (e) {
          console.warn('Profile sync notice:', e);
        }
      } else {
        setFirebaseUid(null);
        // A sessão salva era de uma conta na nuvem, mas o login expirou/foi encerrado:
        // volta para a tela de login (o cache local da conta continua guardado).
        if (readSavedSession()?.uid) {
          persistSession(null);
          setCurrentUser(null);
          clearData();
        }
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retoma uma migração para a nuvem que foi interrompida (os dados locais nunca são apagados).
  useEffect(() => {
    if (!firebaseUid) return;
    const pending = getPendingMigration();
    if (!pending || pending.uid !== firebaseUid) return;
    getCurrentFirebaseUser()
      .then((fbUser) =>
        migrateLocalAccountToCloud({ name: pending.name, cpf: pending.cpf }, firebaseUid, fbUser?.email)
      )
      .then(({ count }) => {
        if (count > 0) addToast('success', `${count} itens do aparelho foram enviados para a nuvem.`);
      })
      .catch((e) => console.warn('Pending migration retry notice:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUid]);

  const handleLoginSuccess = (user: AuthSessionUser) => {
    enterAccount(user);
  };

  const handleLogout = async () => {
    try {
      await signOutCloud();
    } catch (e) {
      console.error('Sign out error', e);
    }
    leaveAccount();
    addToast('info', 'Você saiu da sua conta.');
  };

  const handleSwitchAccount = async () => {
    const fbUser = await getCurrentFirebaseUser().catch(() => null);
    const isGoogleAccount = Boolean(fbUser?.providerData?.some((p) => p.providerId === 'google.com'));
    if (!isGoogleAccount) {
      // Contas de e-mail: volta para a tela de login para escolher outra conta.
      await handleLogout();
      return;
    }
    try {
      await signOutCloud();
    } catch (e) {
      console.warn('Sign out error on switch account:', e);
    }
    leaveAccount();

    try {
      const result = await signInWithGoogle(true);
      const cloudUser = toCloudUser(result.user);
      enterAccount(cloudUser);
      addToast('success', `Conectado como ${cloudUser.name}!`);
    } catch (err: any) {
      console.error('Switch account error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        addToast('error', 'Não foi possível trocar de conta no momento.');
      }
    }
  };

  return { handleLoginSuccess, handleLogout, handleSwitchAccount };
}
