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
**Status**: ⬜ Not Started
**Objective**: Optimize asset loading for Expo Go and implement robust SDK polling error handling.
**Requirements**: REQ-05, TECH-01

### Phase 6: Native Performance (Tech Pivot)
**Status**: ⬜ Not Started
**Objective**: Transition from WebView-based ZK to a native Rust/WASM bridge for maximum performance.
**Requirements**: TECH-02
