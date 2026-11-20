# Security Specification & Test Matrix

## 1. Data Invariants
1. **User Isolation**: A user can only read, write, update, and delete documents within their own subtree `/users/{userId}/**` where `request.auth.uid == userId`.
2. **Identity Integrity**: `userId` field inside document data must strictly match `request.auth.uid`. No user can create or update a transaction, debt, or investment assigned to another user UID.
3. **Valid ID Checks**: Document IDs have a maximum length of 128 characters and the `id` field must match the document ID.
4. **Boundary & Schema Constraints**:
   - Transaction: `amount` must be a number >= 0; `description` <= 200 chars; `type` must be `'income' | 'expense'`.
   - Debt: `totalAmount` >= 0; `paidAmount` >= 0; `title` <= 200 chars; `status` in `['active', 'negotiating', 'paid']`.
   - Investment: `investedAmount` >= 0; `currentValue` >= 0; `title` <= 200 chars; `institution` <= 100 chars.
5. **No Cross-User Access**: Unauthenticated requests or cross-user requests are unconditionally rejected (PERMISSION_DENIED).

## 2. The Dirty Dozen Payloads (Targeting PERMISSION_DENIED)
1. **Payload 1 (Unauthenticated Write)**: Write to `/users/user123/transactions/tx1` with `request.auth == null`.
2. **Payload 2 (Cross-User Read)**: User `attacker_456` reads `/users/victim_123/transactions/tx1`.
3. **Payload 3 (Cross-User Create)**: User `attacker_456` writes to `/users/victim_123/transactions/tx_evil`.
4. **Payload 4 (Identity Spoofing)**: User `user123` creates a transaction with `userId: "admin999"` instead of `"user123"`.
5. **Payload 5 (Path Injection/Poisoning)**: User `user123` writes with a malicious document ID containing path traversal characters `../../other`.
6. **Payload 6 (Oversized Payload Denial of Wallet)**: Transaction description with 50,000 characters.
7. **Payload 7 (Invalid Enum Type)**: Transaction with `type: "crypto_drain"` instead of `"income"` or `"expense"`.
8. **Payload 8 (Negative Amount Violation)**: Transaction with negative `amount: -500`.
9. **Payload 9 (Ghost Field Injection)**: Attempt to inject shadow field `isSuperAdmin: true` inside a UserProfile or Transaction document.
10. **Payload 10 (Debt Overpayment Corruption)**: Debt with negative `totalAmount: -1000`.
11. **Payload 11 (Invalid Debt Status)**: Debt with `status: "erased_by_hacker"`.
12. **Payload 12 (Root Document Write Hijack)**: Direct write to root catch-all collection `/system_secrets/config`.

## 3. Compatibilidade com dados existentes
As validações só se aplicam aos campos que estão sendo criados ou alterados na escrita
(`request.resource.data.diff(resource.data).affectedKeys()`). Documentos gravados por versões
antigas do app continuam podendo ser lidos, editados e apagados pelo dono, mesmo que tenham
campos que hoje não são mais aceitos.

## 4. Como testar
`npm run test:rules` sobe o emulador do Firestore e roda `tests/firestore-rules.test.mjs`
(cobre os cenários acima). Precisa de Java instalado.
