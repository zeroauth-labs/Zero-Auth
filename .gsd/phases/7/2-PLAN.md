---
phase: 7
plan: 2
wave: 1
---

# Plan 7.2: ZKEngine v2 Implementation

## Objective
Rewrite `ZKEngine` to use the new strict bridge protocol, implement a proper state machine, and provide granular progress updates.

## Context
- .gsd/phases/7/1-PLAN.md
- zero-auth-wallet/components/ZKEngine.tsx
- zero-auth-wallet/lib/proof.ts

## Tasks

<task type="auto">
  <name>Implement ZKEngine v2</name>
  <files>zero-auth-wallet/components/ZKEngine.tsx</files>
  <action>
    Refactor `ZKEngine` to:
    - Use `BridgeRequest` types from 7.1.
    - Implement `useEffect` to inject the `.bundle` assets (loaded via fs).
    - Add a visible state: `status` (Initializing, Ready, Proving, Error).
    - Handle `BridgeResponse` events (LOG/PROGRESS) to update UI.
  </action>
  <verify>Build project and check for type errors</verify>
  <done>Component compiles and exposes `execute` method matching new signature</done>
</task>

<task type="auto">
  <name>Update Proof Logic</name>
  <files>zero-auth-wallet/lib/proof.ts</files>
  <action>
    Update `generateProof` to use the new `status` based API if applicable, or ensure it handles the new `execute` return types correctly.
    - Ensure `wasm` and `zkey` are passed correctly in the new `PROVE` payload structure.
  </action>
  <verify>Build project</verify>
  <done>Proof generation logic aligns with ZKEngine v2</done>
</task>

## Success Criteria
- [x] ZKEngine reports "Ready" after initialization.
- [x] Proof generation updates status to "Proving".
- [x] Errors are caught and typed (not just "WebView Error").
