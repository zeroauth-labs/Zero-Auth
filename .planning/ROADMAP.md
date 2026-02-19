# Roadmap: ZeroAuth

## Overview

ZeroAuth delivers a passwordless credential verification system with three components: a wallet app (Android APK), a relay service, and an SDK. The v1.0 MVP focuses on achieving APK parity with existing Expo Go features, integrating Android Keystore for secure key management, and hardening the SDK for production use. The journey moves from functional APK → secure keys → scalable SDK.

## Phases

- [ ] **Phase 1: APK Parity + Release Hardening** - Working Android APK with feature parity to Expo Go
- [ ] **Phase 2: Keystore Integration + Recovery UX** - Secure key storage with biometric gating and recovery flows
- [ ] **Phase 3: SDK/Proof Scaling + Compatibility** - Production-ready SDK with large circuit support

## Phase Details

### Phase 1: APK Parity + Release Hardening
**Goal**: Working Android APK that matches Expo Go functionality with validated release build
**Depends on**: Nothing (first phase)
**Requirements**: WAL-01, WAL-02, WAL-03, WAL-04, WAL-05, WAL-06, SEC-04, SEC-05
**Plans**:
- [ ] 01-01-PLAN.md — EAS Build Setup
- [ ] 01-02-PLAN.md — QR Code Generation (WAL-04)
- [ ] 01-03-PLAN.md — Revocation Status Check (SEC-04)
- [ ] 01-04-PLAN.md — Offline Support (SEC-05)
**Success Criteria** (what must be TRUE):
  1. User can add credentials to wallet and revoke them on APK
  2. User can generate ZK proof and hash for verification requests
  3. User can open scanner and read QR codes on APK
  4. User can display QR codes for proof presentation
  5. User can generate DID with ed25519 keypair
  6. User can complete verification steps (e.g., age verification)
  7. User can check revocation status before presenting proofs
  8. App degrades gracefully when offline (shows cached state, queues actions)
**Plans**: TBD

### Phase 2: Keystore Integration + Recovery UX
**Goal**: Secure key storage via Android Keystore with user-friendly recovery paths
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Keys are stored and signing operations use Android Keystore
  2. User must authenticate with biometric or PIN before proof generation
  3. User can recover or re-enroll keys when Keystore data is invalidated
**Plans**: TBD

### Phase 3: SDK/Proof Scaling + Compatibility
**Goal**: Production-ready SDK with modular packaging, large proof support, and improved UX
**Depends on**: Phase 2
**Requirements**: SDK-01, SDK-02, SDK-03, SDK-04, SDK-05, UX-01
**Success Criteria** (what must be TRUE):
  1. SDK maintains backwards-compatible API (no breaking changes)
  2. SDK is packaged in modular parts (verifier/transport/qr/proof)
  3. Large circuits and large proof payloads generate without failures
  4. Proof generation includes timeouts and preflight size checks
  5. Lightweight web UI widget available for verification flows
  6. User sees selective disclosure preview before sharing data
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. APK Parity + Release Hardening | 4 planned | Ready to execute | - |
| 2. Keystore Integration + Recovery UX | 0/TBD | Not started | - |
| 3. SDK/Proof Scaling + Compatibility | 0/TBD | Not started | - |

---

*Roadmap created: 2026-02-19*
