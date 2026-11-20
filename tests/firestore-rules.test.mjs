// Testes das regras do Firestore (firestore.rules).
// Como rodar (precisa de Java instalado). Na primeira vez instale a biblioteca de testes:
//   npm i -D @firebase/rules-unit-testing
// Depois:
//   npm run test:rules
// O emulador sobe sozinho, roda os testes e desliga.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const testEnv = await initializeTestEnvironment({
  projectId: 'demo-aquigastos',
  firestore: { rules: readFileSync('firestore.rules', 'utf8') },
});

const alice = testEnv.authenticatedContext('alice').firestore();
const bob = testEnv.authenticatedContext('bob').firestore();
const anon = testEnv.unauthenticatedContext().firestore();

const tx = (overrides = {}) => ({
  id: 'tx-1',
  userId: 'alice',
  description: 'Mercado',
  amount: 120.5,
  type: 'expense',
  category: 'Alimentação & Mercado',
  date: '2026-11-20',
  status: 'paid',
  updatedAt: new Date().toISOString(),
  ...overrides,
});

let passed = 0;
async function test(name, fn) {
  await testEnv.clearFirestore();
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FALHOU  ${name}\n`, e);
    process.exitCode = 1;
  }
}

const txRef = (db, user = 'alice', id = 'tx-1') => doc(db, 'users', user, 'transactions', id);

await test('dono cria e lê a própria transação', async () => {
  await assertSucceeds(setDoc(txRef(alice), tx(), { merge: true }));
  await assertSucceeds(getDoc(txRef(alice)));
});

await test('sem login não lê nem grava', async () => {
  await assertFails(setDoc(txRef(anon), tx()));
  await assertFails(getDoc(txRef(anon)));
});

await test('outro usuário não lê nem grava', async () => {
  await assertSucceeds(setDoc(txRef(alice), tx()));
  await assertFails(getDoc(txRef(bob)));
  await assertFails(setDoc(txRef(bob), tx({ userId: 'bob' })));
});

await test('userId falso é bloqueado', async () => {
  await assertFails(setDoc(txRef(alice), tx({ userId: 'admin999' })));
});

await test('valor negativo, tipo inválido e texto gigante são bloqueados', async () => {
  await assertFails(setDoc(txRef(alice), tx({ amount: -500 })));
  await assertFails(setDoc(txRef(alice), tx({ type: 'crypto_drain' })));
  await assertFails(setDoc(txRef(alice), tx({ description: 'x'.repeat(50000) })));
});

await test('campo fantasma é bloqueado', async () => {
  await assertFails(setDoc(txRef(alice), tx({ isSuperAdmin: true })));
});

await test('documento antigo com campo desconhecido continua editável', async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(txRef(ctx.firestore()), tx({ campoAntigo: 'valor de versão anterior' }));
  });
  await assertSucceeds(setDoc(txRef(alice), tx({ description: 'Mercado do mês' }), { merge: true }));
});

await test('dono apaga a própria transação', async () => {
  await assertSucceeds(setDoc(txRef(alice), tx()));
  await assertSucceeds(deleteDoc(txRef(alice)));
});

await test('dívida e investimento válidos; status inválido bloqueado', async () => {
  const debt = doc(alice, 'users', 'alice', 'debts', 'debt-1');
  await assertSucceeds(setDoc(debt, {
    id: 'debt-1', userId: 'alice', title: 'Cartão', totalAmount: 1000, paidAmount: 0,
    status: 'active', createdAt: '2026-11-20', updatedAt: '2026-11-20', paymentHistory: [],
  }));
  await assertFails(setDoc(debt, { status: 'erased_by_hacker' }, { merge: true }));

  const inv = doc(alice, 'users', 'alice', 'investments', 'inv-1');
  await assertSucceeds(setDoc(inv, {
    id: 'inv-1', userId: 'alice', title: 'Reserva', category: 'emergency_fund', institution: 'Nubank',
    investedAmount: 500, currentValue: 520, createdAt: '2026-11-20', updatedAt: '2026-11-20', history: [],
  }));
});

await test('perfil do usuário e caminho fora de /users', async () => {
  await assertSucceeds(setDoc(doc(alice, 'users', 'alice'), {
    id: 'alice', displayName: 'Alice', hideBalance: false, updatedAt: '2026-11-20',
  }, { merge: true }));
  await assertFails(setDoc(doc(alice, 'system_secrets', 'config'), { a: 1 }));
});

await testEnv.cleanup();
assert.ok(passed > 0);
console.log(`\n${passed} testes passaram.`);
