---
phase: 7
plan: GAP-1
wave: 1
---

# Plan 7.GAP-1: Stabilize Real ZK Engine

## Objective
Restore the real ZK Engine by fixing the Poseidon library invocation and script injection race conditions.

## Context
- .gsd/phases/7/RESEARCH_GAP.md
- components/ZKEngine.tsx

## Tasks

<task type="auto">
  <name>Fix ZKEngine Bridge & Injection</name>
  <files>zero-auth-wallet/components/ZKEngine.tsx</files>
  <action>
    1. Revert from Mock to Real ZK logic (based on Attempt 5 core).
    2. Fix Poseidon invocation: Use `window['poseidon' + inputs.length]` to grab the correct function.
    3. Improve Script Injection: Use a dedicated useEffect to ensure injection happens exactly once when assets are ready AND webview is ready.
    4. Add detailed logs for each injection step to Metro.
  </action>
  <verify>Check Metro logs for "ZK Engine Fully Ready (v6)" and no "TypeError" during proof generation.</verify>
  <done>
    - [ ] `ZK Engine Fully Ready (v6)` logs in Metro.
    - [ ] `POSEIDON_HASH` returns a valid hash string.
    - [ ] `GENERATE_PROOF` proceeds beyond the hashing stage.
  </done>
</task>

<task type="auto">
  <name>Verify Circuit Asset Availability</name>
  <files>zero-auth-wallet/lib/proof.ts</files>
  <action>
    Ensure `generateProof` correctly passes the real wasm/zkey assets to the engine.
  </action>
  <verify>Trigger proof generation in the UI and observe logs.</verify>
  <done>
    - [ ] Bridge receives `GENERATE_PROOF` request with data.
  </done>
</task>

## Success Criteria
- [ ] Wallet can generate a Poseidon hash using the real library in WebView.
- [ ] Proof generation starts (even if worker OOMs, the bridge must be functional).
