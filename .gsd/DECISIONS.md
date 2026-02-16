# DECISIONS.md

## Phase 6 Pivot
**Date:** 2026-02-16

### Decision: Skip Native Rust Pivot
The user decided to stick with the current `snarkjs` WebView implementation as current performance (~1.5s) is acceptable for MVP.

### Decision: Focus on E2E Workflow & UX
The next phase will prioritize making the system "testable" as a complete product and refining the Production UX (Biometrics, Issuance UX).

### Decision: Expo Go Compatibility
Maintain Expo Go compatibility for now to simplify the development and testing workflow for the user.

## Phase 7: ZK Overhaul
**Date:** 2026-02-16

### Decision: In-Place Rewrite vs. Delete
We chose to **rewrite the internals** of `ZKEngine` and `proof.ts` in-place rather than deleting files.
- **Reason**: Preserves the `useZKEngine` hook API, minimizing disruption to the rest of the application (screens, stores).
- **Scope**: Internal implementation change (untyped bridge -> typed bridge; string assets -> bundled assets).
