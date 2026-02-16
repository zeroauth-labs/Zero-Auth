---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Implementation of ZK Bridge Logic

## Objective
Migrate cryptographic operations (Poseidon & Snarkjs) into the WebView environment.

## Context
- zero-auth-wallet/lib/proof.ts
- zero-auth-wallet/lib/hashing.ts
- .gsd/phases/1/RESEARCH.md

## Tasks

<task type="auto">
  <name>Inject Snarkjs & Circomlibjs</name>
  <files>
    - zero-auth-wallet/components/ZKEngine.tsx
  </files>
  <action>
    - Embed minified `snarkjs` and custom `poseidon` scripts into the WebView's `html` source.
    - Setup global listeners in the WebView to handle `POSEIDON_HASH` and `GENERATE_PROOF` requests.
  </action>
  <verify>Check WebView console for Snarkjs version log</verify>
  <done>WebView reports `snarkjs` and `poseidon` are loaded and initialized.</done>
</task>

<task type="auto">
  <name>Refactor Libs to Bridge</name>
  <files>
    - zero-auth-wallet/lib/hashing.ts
    - zero-auth-wallet/lib/proof.ts
  </files>
  <action>
    - Replace local `circomlibjs` calls with async bridge requests to `ZKEngine`.
    - Implement binary asset transfer (passing WASM/ZKey as Base64) to the WebView for proof generation.
  </action>
  <verify>Run a hashing test and compare result with known Poseidon output</verify>
  <done>`generateProof` returns a valid proof object through the bridge.</done>
</task>

## Success Criteria
- [ ] Poseidon hashing works via the bridge.
- [ ] `snarkjs.fullProve` executes successfully inside the WebView.
