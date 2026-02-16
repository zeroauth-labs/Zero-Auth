# Debug Session: ZKEngine Startup Crash

## Symptom 3 (New): ZKEngine Crash on Load
**Description:** `TypeError: Cannot read property 'prototype' of undefined` in `_layout.tsx` within `Blob` polyfill, triggered by `snarkjs` import. Also `Module "undefined" is missing from the asset registry`.
**Location:** `app/_layout.tsx:45`, `components/ZKEngine.tsx:43`
**Cause:**
1. `snarkjs.min.js` executes on `require` if extension is `.js`.
2. It calls `new Blob`.
3. `global.Blob` in `_layout.tsx` tries `require('buffer').Blob`, which was undefined, causing crash.
4. `Asset.fromModule` failed because `require` threw.

## Resolution
**Root Cause:** `buffer` polyfill lacks `Blob` export, and Metro treats `.js` as code not asset.
**Fix:**
1. Patched `app/_layout.tsx` to fallback to `NativeBlob` if `buffer.Blob` is missing.
2. Renamed `assets/snarkjs.min.js` -> `assets/snarkjs.bundle` (and `poseidon.bundle`).
3. Added `bundle` to `metro.config.js` `assetExts`.
4. Updated `ZKEngine.tsx` to require `.bundle` files.
**Action:** User must run `npx expo start -c` to clear cache.

## Symptom 1 (Old): SecureStore Invalid Key Error
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

**Root Cause 7 (ZK Stuck):** `ZKEngine` had no timeout/error handling. Added 20s timeout and `onerror` for scripts. Also, external CDNs were unreliable.
**Fix 7:** Updated `ZKEngine.tsx` to bundle `snarkjs` and `poseidon` locally, ensuring offline capability.

**Root Cause 8 (Demo Mismatch):** Old demo credentials persisted.
**Fix 8:** Updated `seedDemoData` to auto-clear `demo-*` IDs.

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
