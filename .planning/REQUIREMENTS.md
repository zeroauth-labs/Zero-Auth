# Requirements: ZeroAuth

**Defined:** 2026-02-19
**Core Value:** Users can prove and verify credentials without passwords in a secure, seamless flow.

## v1 Requirements

### Wallet APK Parity

- [ ] **WAL-01**: Wallet APK supports credential add and revoke flows
- [ ] **WAL-02**: Wallet APK generates ZK proof + hash for verification
- [ ] **WAL-03**: Wallet APK can open scanner and read QR codes
- [ ] **WAL-04**: Wallet APK displays QR codes for proof presentation
- [ ] **WAL-05**: Wallet APK generates DID + ed25519 keypair
- [ ] **WAL-06**: Wallet APK completes verification steps (e.g., age checks)

### Security & Key Handling

- [ ] **SEC-01**: Keys are stored/signing via Android Keystore
- [ ] **SEC-02**: Biometric/PIN gate before proof generation
- [ ] **SEC-03**: Keystore recovery/re-enrollment flow is supported
- [ ] **SEC-04**: Revocation status check is available
- [ ] **SEC-05**: Offline-safe behavior with graceful degradation

### SDK & Web Integration

- [ ] **SDK-01**: Backwards-compatible API stability improvements
- [ ] **SDK-02**: Modular SDK packaging (verifier/transport/qr/proof)
- [ ] **SDK-03**: Large circuit / large proof payload support
- [ ] **SDK-04**: Proof performance guardrails (timeouts/preflight sizing)
- [ ] **SDK-05**: Lightweight, customizable web UI widget for verification

### UX / Consent

- [ ] **UX-01**: Selective disclosure proof preview before sharing

## v2 Requirements

(Deferred to future release)

### Wallet Features

- **WAL-07**: Multi-device sync with user-controlled encryption
- **WAL-08**: Advanced policy engine for high-risk proofs

### SDK Features

- **SDK-06**: Privacy-preserving telemetry (opt-in aggregate metrics)

## Out of Scope

| Feature | Reason |
|---------|--------|
| iOS native build | Android-first focus |
| Production Play Store release | Not required this milestone |
| Full device matrix testing | Not required this milestone |
| Formal pen test | Not required this milestone |
| Breaking SDK changes | Must maintain backwards compatibility |

## Traceability

| Requirement | Phase | Status |
|------------|-------|--------|
| WAL-01 | Phase 1 | Pending |
| WAL-02 | Phase 1 | Pending |
| WAL-03 | Phase 1 | Pending |
| WAL-04 | Phase 1 | Pending |
| WAL-05 | Phase 1 | Pending |
| WAL-06 | Phase 1 | Pending |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 1 | Pending |
| SEC-05 | Phase 1 | Pending |
| SDK-01 | Phase 3 | Pending |
| SDK-02 | Phase 3 | Pending |
| SDK-03 | Phase 3 | Pending |
| SDK-04 | Phase 3 | Pending |
| SDK-05 | Phase 3 | Pending |
| UX-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after initial definition*
