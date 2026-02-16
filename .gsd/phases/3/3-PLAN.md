---
phase: 3
plan: 3
wave: 3
---

# Plan 3.3: Verification & SDK Adjustments

## Objective
Verify the end-to-end revocation flow and ensure the SDK handles the 'REVOKED' status gracefully.

## Context
- zero-auth-sdk/src/index.ts (or client logic)
- .gsd/VERIFICATION.md

## Tasks

<task type="auto">
  <name>Update SDK Polling Logic</name>
  <files>
    - zero-auth-sdk/src/index.ts
  </files>
  <action>
    - Update the session polling loop to detect `status === 'REVOKED'`.
    - Stop polling and throw/return a 'Session Revoked' error.
  </action>
  <verify>Simulate revocation while SDK is polling</verify>
  <done>SDK correctly identifies and reacts to revoked sessions.</done>
</task>

<task type="auto">
  <name>End-to-End Revocation Test</name>
  <files>
    - .gsd/phases/3/VERIFICATION.md
  </files>
  <action>
    - Start a session via SDK.
    - Approve in Wallet.
    - Verify SDK says 'Authenticated'.
    - Revoke in Wallet.
    - Verify SDK (or a subsequent check) shows 'Revoked'.
  </action>
  <verify>Manual E2E run</verify>
  <done>Complete lifecycle from creation to revocation is verified.</done>
</task>

## Success Criteria
- [ ] Revocation is instantaneous (verified by SDK polling stop).
- [ ] No residual state remains in Relay after revocation + TTL.
