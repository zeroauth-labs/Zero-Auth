---
phase: 7
plan: 1
wave: 1
---

# Plan 7.1: ZK Infrastructure & Types

## Objective
Formalize the ZK asset bundling process and define a strict type system for the React Native <-> WebView bridge. This eliminates "magic" configuration and `any` types.

## Context
- .gsd/phases/7/RESEARCH.md
- zero-auth-wallet/metro.config.js
- zero-auth-wallet/lib/qr-protocol.ts

## Tasks

<task type="auto">
  <name>Create ZK Bundling Script</name>
  <files>scripts/bundle-zk.js, package.json</files>
  <action>
    Create a script that uses `esbuild` to explicitly bundle `snarkjs` and `poseidon-lite` into `zero-auth-wallet/assets/*.bundle` files.
    - Input: `node_modules/snarkjs`, `node_modules/poseidon-lite`
    - Output: `assets/snarkjs.bundle`, `assets/poseidon.bundle`
    - Update `package.json` to have a `bundle:zk` script.
  </action>
  <verify>npm run bundle:zk && ls zero-auth-wallet/assets/*.bundle</verify>
  <done>Bundles exist and are non-zero size</done>
</task>

<task type="auto">
  <name>Define ZK Bridge Protocol</name>
  <files>zero-auth-wallet/lib/zk-bridge-types.ts</files>
  <action>
    Create a shared type definition file for the bridge.
    - Define `BridgeRequest` (INIT, PROVE, STATUS)
    - Define `BridgeResponse` (LOG, RESULT, ERROR)
    - Define `ProofResult` structure (pi_a, etc.)
  </action>
  <verify>cat zero-auth-wallet/lib/zk-bridge-types.ts</verify>
  <done>Types are exported and valid typescript</done>
</task>

## Success Criteria
- [ ] `npm run bundle:zk` generates reproducible assets.
- [ ] Bridge types cover all current use cases (Prove, Hash).
