---
phase: 8
plan: 2
wave: 1
---

# Plan 8.2: SDK Enhancements (Ngrok & Types)

## Objective
Update the SDK to robustly handle `ngrok` tunnels (skipping browser warnings) and standardize data types across the monorepo (starting with SDK exports).

## Context
- .gsd/ARCHITECTURE.md
- zero-auth-sdk/src/index.ts

## Tasks

<task type="auto">
  <name>Define Shared Types</name>
  <files>zero-auth-sdk/src/types.ts</files>
  <action>
    Create `src/types.ts`.
    Export interfaces: `Session`, `VerificationResult`, `ProofPayload`, `ZKProof`.
    Move these out of `index.ts`.
  </action>
  <verify>test -f zero-auth-sdk/src/types.ts</verify>
  <done>Types are explicit and reusable.</done>
</task>

<task type="auto">
  <name>Update SDK Client</name>
  <files>zero-auth-sdk/src/index.ts</files>
  <action>
    Import types from `./types`.
    Update `fetch` calls to ALWAYS include:
    - `bypass-tunnel-reminder: true` (Localtunnel)
    - `ngrok-skip-browser-warning: true` (Ngrok)
    Refactor `verify()` to use `SessionService`-like structure if applicable, or just clean up the polling logic.
    Improve error logging (keep the verbose logs we added).
  </action>
  <verify>grep "ngrok-skip-browser-warning" zero-auth-sdk/src/index.ts</verify>
  <done>SDK fetch calls have correct bypass headers.</done>
</task>

## Success Criteria
- [ ] SDK builds without errors (`npm run build`).
- [ ] Fetch calls include both tunnel bypass headers.
