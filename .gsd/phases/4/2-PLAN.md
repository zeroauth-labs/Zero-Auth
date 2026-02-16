---
phase: 4
plan: 2
wave: 2
---

# Plan 4.2: Wallet Multi-Circuit Integration

## Objective
Update the wallet to support dynamic circuit selection based on the verifier's request.

## Context
- zero-auth-wallet/lib/proof.ts
- zero-auth-wallet/app/approve-request.tsx

## Tasks

<task type="auto">
  <name>Dynamic Asset Loading</name>
  <files>
    - zero-auth-wallet/lib/proof.ts
  </files>
  <action>
    - Refactor `generateProof` to accept a `claimType` parameter.
    - Implement a mapping function that returns the correct `.wasm` and `.zkey` assets for 'Age Verification' and 'Student Status'.
  </action>
  <verify>Manual check of asset mapping logic</verify>
  <done>Proof generator correctly selects assets based on the request types.</done>
</task>

<task type="auto">
  <name>Update Approval UI</name>
  <files>
    - zero-auth-wallet/app/approve-request.tsx
  </files>
  <action>
    - Update the UI to display the specific claim being proved (e.g., "Proving you are a student").
    - Ensure matching logic works for both 'Age Verification' and 'Student ID' credential types.
  </action>
  <verify>Visual check in Expo Go</verify>
  <done>Approval screen shows correct labels and matching for multiple claim types.</done>
</task>

## Success Criteria
- [ ] Wallet can generate proofs for different circuits without hardcoded paths.
- [ ] UI correctly distinguishes between different claim requests.
