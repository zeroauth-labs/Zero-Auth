# ZeroAuth

## What This Is

ZeroAuth is a passwordless login and credential verification service with three parts: a wallet app, a relay service, and an SDK. It enables users to add/revoke credentials, generate proofs, and verify claims (e.g., age) with QR-based flows.

## Core Value

Users can prove and verify credentials without passwords in a secure, seamless flow.

## Requirements

### Validated

- ✓ Wallet supports credential add/revoke, proof generation, and verification flows — existing
- ✓ QR-based verification flow works end-to-end — existing
- ✓ DID + ed25519 keypair generation is supported — existing
- ✓ Relay service handles verification requests — existing
- ✓ SDK exposes core verification capabilities — existing

### Active

- [ ] Android APK parity with Expo Go features (credential add/revoke, proof + hash gen, QR scan, DID + ed25519, age verification)
- [ ] Android Keystore used for keypair storage/signing (standard Keystore, fallback behavior allowed)
- [ ] SDK stability and modularity improvements without breaking changes
- [ ] Support larger circuits and large proof payloads without failures

### Out of Scope

- Production readiness (Play Store release, full device matrix, formal pen test) — not required this milestone
- iOS native build — Android-first focus
- Breaking SDK changes — backwards compatibility required

## Context

- Existing codebase includes a wallet app, relay service, and SDK.
- Current goal is to move from Expo Go to a functional Android APK while improving security handling and SDK robustness.

## Constraints

- **Platform**: Android APK required — transition off Expo Go
- **Security**: Use Android Keystore for keypair storage/signing — standard Keystore
- **Compatibility**: SDK changes must be backwards compatible
- **Languages**: SDK scope is TypeScript/JavaScript for this milestone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Android Keystore for keypair storage/signing | Secure key handling on device | — Pending |
| SDK changes must be backwards compatible | Avoid breaking integrators | — Pending |
| Focus on functional APK, not production readiness | Ship usable build quickly | — Pending |

---
*Last updated: 2026-02-19 after initialization*
