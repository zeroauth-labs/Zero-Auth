# ROADMAP.md

> **Current Phase**: Phase 1: Foundation & Stability
> **Milestone**: v1.0 MVP

## Must-Haves (from SPEC)
- [ ] Stable mobile ZK proof generation.
- [ ] Basic "Age Verification" flow (SDK -> Wallet -> Relay).
- [ ] Credential import via JSON.

## Phases

### Phase 1: Foundation & WebView ZK
**Status**: ✅ Complete
**Objective**: Implement stable ZK proof generation using the **WebView Strategy** to bypass Hermes WASM limitations in Expo Go.
**Requirements**: REQ-01, TECH-01

### Phase 2: Credential & Local Hashing
**Status**: ✅ Complete
**Objective**: Implement local credential storage and JSON import.
**Requirements**: REQ-02, REQ-04

### Phase 3: Session Management & Revocation
**Status**: ✅ Complete
**Objective**: Build the wallet session dashboard and Relay revocation logic.
**Requirements**: REQ-06, REQ-07

### Phase 4: Extended Claims & Verification
**Status**: ✅ Complete
**Objective**: Implement "Student Status" and "Minor Verification" circuits. Expand the SDK to support multi-claim verification requests.
**Requirements**: REQ-08, REQ-09

### Phase 5: SDK Refinement & Production Prep
**Status**: ✅ Complete
**Objective**: Optimize asset loading for Expo Go and implement robust SDK polling error handling.
**Requirements**: REQ-05, TECH-01

### Phase 6: Production UX & E2E Testing
**Status**: ✅ Complete
**Objective**: Finalize biometric integration, implement a unified E2E test workflow, and refine the credential issuance UX.
**Requirements**: REQ-10, REQ-11

### Phase 7: ZK Generation Overhaul
**Status**: ✅ Complete
**Objective**: Rebuild and rigorously validate the ZK proof generation pipeline from scratch, ensuring reliability, correctness, and offline capability.
**Depends on**: Phase 6

**Tasks**:
- [x] Bundle ZK assets (snarkjs, poseidon)
- [x] Implement strict ZK Bridge Protocol
- [x] Rewrite ZKEngine with State Machine

**Verification**:
- [x] `npm run bundle:zk` generates assets.
- [x] `tsc` passes (Type safety verified).

### Phase 8: System Stabilization (Real Network)
**Status**: ✅ Complete
**Objective**: ensure end-to-end reliability over real networks using tunnels (Ngrok) and robust error handling.
**Tasks**:
- [x] Refactor Relay services.
- [x] Harden SDK against network failures & CORS.
- [x] Verify physical device connectivity.

### Phase 9: Native Performance (Future Pivot)
**Status**: ⏸️ Deprioritized
**Objective**: (Optional) Transition to native Rust if performance benchmarks degrade with complex circuits.
**Requirements**: TECH-02
