# Debug Session: Runtime ReferenceError (Shield)

## Symptom 3: SecureStore Invalid Key Error
**Description:** `Error: Invalid key provided to SecureStore`.
**Location:** `store/auth-store.ts:203`
**Cause:** key `salt_${cred.type}` contains spaces (e.g., "Student ID"), which SecureStore forbids.

## Symptom 4: React Hook Violation
**Description:** `Error: Context can only be read while React is rendering`.
**Location:** `app/add-credential/verify.tsx:43`
**Cause:** `useLocalSearchParams()` is called inside `runVerification` (an async function), not at component top level.

## Resolution

**Root Cause 5:** `step 2` (Poseidon) used a hex string for salt without `0x` prefix, crashing `BigInt()`.
**Fix 5:** Prepended `0x` to salt in `verify.tsx`.

**Root Cause 6:** `auth-store.ts` keyed salts by `type` (normalized), but `approve-request.tsx` reads by `id`. Also `demo-age` type was "Identity", SDK wanted "Age Verification".
**Fix 6:** Updated `auth-store.ts` to use `salt_${cred.id}` and changed type to "Age Verification".

**Action:** Updated `package.json` to auto-open tunnel (`--tunnel`) for `dev:wallet`.

**Root Cause:** The `Shield` icon component was used in the JSX but was missing from the import statement in `app/(tabs)/index.tsx`.
**Fix:** Added `Shield` to the named imports from `lucide-react-native`.
**Verified:** Code inspection confirmed the missing import.

## Symptom
**Description:** App opens but crashes on Dashboard with `ReferenceError: Property 'Shield' doesn't exist`.
**Location:** `app/(tabs)/index.tsx:37`
**Context:** Added `Shield` icon for Settings button in Phase 6.2.

## Evidence
- Code snippet shows `<Shield ... />` usage.
- Error message says `Property 'Shield' doesn't exist`.

## Hypotheses
| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `Shield` is not imported from `lucide-react-native` | 100% | CONFIRMED |
| 2 | `Shield` is imported but named differently (e.g. `ShieldCheck`) | 10% | ELIMINATED |
