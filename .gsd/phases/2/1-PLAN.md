---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Verify Flow & Bridge Integration

## Objective
Refactor the simulated verification flow to use the async ZK Bridge for commitment generation and ensure data consistency.

## Context
- zero-auth-wallet/app/add-credential/verify.tsx
- zero-auth-wallet/lib/hashing.ts
- zero-auth-wallet/components/ZKEngine.tsx

## Tasks

<task type="auto">
  <name>Refactor VerifyScreen for Async Hashing</name>
  <files>
    - zero-auth-wallet/app/add-credential/verify.tsx
  </files>
  <action>
    - Import `useZKEngine`.
    - Replace sync `commitAttribute` call with async bridge call.
    - Remove direct `initPoseidon` (bridge handles this).
    - Ensure `birthYear` is passed correctly from the previous form screen instead of being hardcoded.
  </action>
  <verify>Logs show 'POSEIDON_HASH' request in ZKEngine</verify>
  <done>Verification flow completes successfully using the WebView bridge.</done>
</task>

<task type="auto">
  <name>Secure Salt Persistence</name>
  <files>
    - zero-auth-wallet/app/add-credential/verify.tsx
  </files>
  <action>
    - Ensure salt is generated once and persisted in `SecureStore` BEFORE adding the credential to the store.
    - Verify that the `credentialId` used for the salt key matches the one in the store.
  </action>
  <verify>Check SecureStore manually or via logs</verify>
  <done>Salt is securely stored and accessible by its credential ID.</done>
</task>

## Success Criteria
- [ ] Verification flow successfully uses the WebView bridge for commitments.
- [ ] No hardcoded attributes used in the final credential state.
