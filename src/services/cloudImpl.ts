// Tudo que depende do SDK do Firebase. Carregado sob demanda por ./cloud.ts.
export {
  auth,
  googleProvider,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged,
} from '../firebase';
export {
  subscribeToTransactions,
  saveTransaction,
  deleteTransaction,
  clearAllUserTransactions,
  subscribeToDebts,
  saveDebt,
  deleteDebt,
  subscribeToInvestments,
  saveInvestment,
  deleteInvestment,
  saveUserProfile,
} from './firestoreService';
export { migrateLocalAccountToCloud } from './migrationService';
