import { AuthSessionUser } from '../types';

/**
 * Contas antigas criadas com CPF + senha (só existiam no navegador, sem nuvem).
 *
 * Novos cadastros por CPF foram desativados. Este módulo existe para que quem já
 * tinha conta por CPF continue conseguindo entrar e possa levar os dados para a nuvem
 * sem perder nada.
 */

const REGISTERED_USERS_KEY = 'aquigastos_registered_users';
const PENDING_MIGRATION_KEY = 'aquigastos_pending_migration';
const MIGRATED_PREFIX = 'aquigastos_migrated_cpf_';

export const DEMO_CPF = '12345678900';

interface LegacyStoredUser {
  name?: string;
  cpf: string;
  password?: string; // formato antigo (texto puro)
  passwordHash?: string; // formato novo (SHA-256 com o CPF como "sal")
  createdAt?: string;
}

function readUsers(): LegacyStoredUser[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((u) => u && typeof u.cpf === 'string') : [];
  } catch {
    return [];
  }
}

function writeUsers(users: LegacyStoredUser[]) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

async function hashPassword(cpf: string, password: string): Promise<string | null> {
  // crypto.subtle só existe em contexto seguro (https/localhost)
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  const data = new TextEncoder().encode(`aquigastos:${cpf}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface LegacyLoginResult {
  ok: boolean;
  name?: string;
  reason?: 'not_found' | 'wrong_password';
}

/** Existe alguma conta antiga por CPF salva neste aparelho? */
export function hasLegacyCpfAccounts(): boolean {
  return readUsers().length > 0;
}

/** É uma sessão que vive só neste aparelho (CPF antigo ou demonstração)? */
export function isLocalOnlySession(user: AuthSessionUser | null): boolean {
  return Boolean(user && !user.uid);
}

export function isDemoSession(user: AuthSessionUser | null): boolean {
  return Boolean(user && !user.uid && user.cpf === DEMO_CPF);
}

/**
 * Confere CPF + senha de uma conta antiga. Não cria conta nova.
 * Se a senha ainda estava em texto puro, troca por um hash na hora (sem mudar a senha).
 */
export async function verifyLegacyCpfLogin(
  rawCpf: string,
  password: string
): Promise<LegacyLoginResult> {
  const users = readUsers();
  const index = users.findIndex((u) => u.cpf === rawCpf);
  if (index < 0) return { ok: false, reason: 'not_found' };

  const user = users[index];
  const hashed = await hashPassword(rawCpf, password);

  let valid = false;
  if (user.passwordHash) {
    valid = hashed !== null && user.passwordHash === hashed;
  } else if (typeof user.password === 'string') {
    valid = user.password === password;
  }

  if (!valid) return { ok: false, reason: 'wrong_password' };

  // Atualiza o formato: remove a senha em texto puro do navegador.
  if (hashed && (!user.passwordHash || user.password !== undefined)) {
    const { password: _discard, ...rest } = user;
    users[index] = { ...rest, passwordHash: hashed };
    try {
      writeUsers(users);
    } catch {
      /* se falhar, a conta continua funcionando no formato antigo */
    }
  }

  return { ok: true, name: user.name || 'Minhas Finanças' };
}

// ---- Controle da migração para a nuvem ----

interface PendingMigration {
  cpf: string;
  name: string;
  uid: string;
  startedAt: string;
}

/** Marca que a migração começou, para poder retomar se a página fechar no meio. */
export function setPendingMigration(user: AuthSessionUser, uid: string) {
  const pending: PendingMigration = {
    cpf: user.cpf,
    name: user.name,
    uid,
    startedAt: new Date().toISOString(),
  };
  localStorage.setItem(PENDING_MIGRATION_KEY, JSON.stringify(pending));
}

export function getPendingMigration(): PendingMigration | null {
  try {
    const raw = localStorage.getItem(PENDING_MIGRATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.cpf === 'string' && typeof parsed.uid === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingMigration() {
  localStorage.removeItem(PENDING_MIGRATION_KEY);
}

/** Guarda para qual conta da nuvem os dados deste CPF foram enviados. */
export function markCpfMigrated(cpf: string, uid: string, email?: string | null) {
  localStorage.setItem(
    MIGRATED_PREFIX + cpf,
    JSON.stringify({ uid, email: email || null, migratedAt: new Date().toISOString() })
  );
}

export function getCpfMigrationInfo(cpf: string): { uid: string; email: string | null } | null {
  try {
    const raw = localStorage.getItem(MIGRATED_PREFIX + cpf);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
