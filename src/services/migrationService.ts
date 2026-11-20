import { AuthSessionUser } from '../types';
import { loadUserAccountData } from '../utils/userStorage';
import { syncLocalDataToFirestore } from './firestoreService';
import { clearPendingMigration, markCpfMigrated } from '../utils/legacyAccounts';

/**
 * Leva os dados de uma conta antiga (salva só no aparelho) para uma conta na nuvem.
 *
 * Os dados locais NÃO são apagados: ficam guardados no navegador como cópia de segurança.
 * Itens que já existem na conta da nuvem não são sobrescritos.
 */
export async function migrateLocalAccountToCloud(
  localUser: AuthSessionUser,
  uid: string,
  email?: string | null
): Promise<{ count: number; skipped: number }> {
  const local = loadUserAccountData({ name: localUser.name, cpf: localUser.cpf });
  const result = await syncLocalDataToFirestore(
    uid,
    local.transactions,
    local.debts,
    local.investments
  );
  markCpfMigrated(localUser.cpf, uid, email);
  clearPendingMigration();
  return result;
}
