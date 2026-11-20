/**
 * Acesso preguiçoso (lazy) ao Firebase.
 *
 * O SDK do Firebase é a maior parte do JavaScript do app (~1,7 MB sem compactar).
 * Como os dados do usuário já ficam em cache no aparelho, a tela abre na hora com
 * esse cache e o Firebase é baixado em segundo plano logo em seguida.
 */
import type { Transaction, DebtItem, InvestmentItem, AuthSessionUser } from '../types';
import type { FirebaseUser } from '../firebase';
import type { UserProfileData } from './firestoreService';

type CloudModule = typeof import('./cloudImpl');

let cloudPromise: Promise<CloudModule> | null = null;

/** Baixa (uma única vez) o Firebase e os serviços de nuvem. */
export function loadCloud(): Promise<CloudModule> {
  if (!cloudPromise) {
    cloudPromise = import('./cloudImpl').catch((error) => {
      // Permite tentar de novo se a rede falhar no primeiro carregamento
      cloudPromise = null;
      throw error;
    });
  }
  return cloudPromise;
}

/** Inicia o download do Firebase quando o navegador estiver livre. */
export function preloadCloud() {
  const start = () => {
    loadCloud().catch((e) => console.warn('Cloud preload notice:', e));
  };
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(start, { timeout: 1500 });
  } else {
    setTimeout(start, 300);
  }
}

/**
 * Para funções que devolvem "unsubscribe" de forma síncrona: devolve uma função
 * que cancela a inscrição mesmo se o Firebase ainda estiver carregando.
 */
function lazySubscription(subscribe: (m: CloudModule) => () => void): () => void {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;
  loadCloud()
    .then((m) => {
      if (cancelled) return;
      unsubscribe = subscribe(m);
    })
    .catch((e) => console.warn('Cloud subscription notice:', e));
  return () => {
    cancelled = true;
    if (unsubscribe) unsubscribe();
  };
}

// ---- Autenticação ----

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return lazySubscription((m) => m.onAuthStateChanged(m.auth, callback));
}

export async function getCurrentFirebaseUser(): Promise<FirebaseUser | null> {
  const m = await loadCloud();
  return m.auth.currentUser;
}

export async function signOutCloud() {
  const m = await loadCloud();
  await m.fbSignOut(m.auth);
}

export async function signInWithGoogle(selectAccount = false) {
  const m = await loadCloud();
  if (selectAccount) m.googleProvider.setCustomParameters({ prompt: 'select_account' });
  return m.signInWithPopup(m.auth, m.googleProvider);
}

// ---- Firestore ----

export function subscribeToTransactions(
  uid: string,
  onData: (items: Transaction[]) => void,
  onError?: (error: Error) => void
) {
  return lazySubscription((m) => m.subscribeToTransactions(uid, onData, onError));
}

export function subscribeToDebts(
  uid: string,
  onData: (items: DebtItem[]) => void,
  onError?: (error: Error) => void
) {
  return lazySubscription((m) => m.subscribeToDebts(uid, onData, onError));
}

export function subscribeToInvestments(
  uid: string,
  onData: (items: InvestmentItem[]) => void,
  onError?: (error: Error) => void
) {
  return lazySubscription((m) => m.subscribeToInvestments(uid, onData, onError));
}

export const saveTransaction = async (uid: string, tx: Transaction) =>
  (await loadCloud()).saveTransaction(uid, tx);
export const deleteTransaction = async (uid: string, id: string) =>
  (await loadCloud()).deleteTransaction(uid, id);
export const clearAllUserTransactions = async (uid: string, ids: string[]) =>
  (await loadCloud()).clearAllUserTransactions(uid, ids);
export const saveDebt = async (uid: string, debt: DebtItem) =>
  (await loadCloud()).saveDebt(uid, debt);
export const deleteDebt = async (uid: string, id: string) =>
  (await loadCloud()).deleteDebt(uid, id);
export const saveInvestment = async (uid: string, inv: InvestmentItem) =>
  (await loadCloud()).saveInvestment(uid, inv);
export const deleteInvestment = async (uid: string, id: string) =>
  (await loadCloud()).deleteInvestment(uid, id);
export const saveUserProfile = async (uid: string, profile: Partial<UserProfileData>) =>
  (await loadCloud()).saveUserProfile(uid, profile);
export const migrateLocalAccountToCloud = async (
  localUser: AuthSessionUser,
  uid: string,
  email?: string | null
) => (await loadCloud()).migrateLocalAccountToCloud(localUser, uid, email);
