# ZeroAuth

## What This Is

ZeroAuth is a passwordless login and credential verification service with three parts: a wallet app, a relay service, and an SDK. It enables users to add/revoke credentials, generate proofs, and verify claims (e.g., age) with QR-based flows.

## Core Value

Users can prove and verify credentials without passwords in a secure, seamless flow.

## Requirements

### Validated

**v1.0 (Initial):**
- ✓ Wallet supports credential add/revoke, proof generation, and verification flows — existing
- ✓ QR-based verification flow works end-to-end — existing
- ✓ DID + ed25519 keypair generation is supported — existing
- ✓ Relay service handles verification requests — existing
- ✓ SDK exposes core verification capabilities — existing

**v1.1 Production Hardening:**
- ✓ Production-grade relay infrastructure (Render) and managed database (Supabase) with no localhost dependencies — v1.1
- ✓ Demo site hosted on GitHub Pages (no ngrok or local hosting) — v1.1
- ✓ ZK generation/verification works end-to-end at each phase (no demo/mock flows) — v1.1
- ✓ SDK is intuitive and modular with configurable credential requests, timers, and customizable login/verification UI — v1.1
- ✓ Wallet uses encrypted device keypair/DID with reset/reinstall generating new identity and clearing issued credentials — v1.1
- ✓ Inputs/outputs audited for industry-standard formats (QR, ZK, hashing, signing) — v1.1
- ✓ Relay performance is efficient and fast under production use — v1.1

### Active

- [ ] Multi-claim proofs (multiple credentials in one QR) — v2.0
- [ ] Full SDK theming support (SDK-03) — v2.0
- [ ] Typed error taxonomy (SDK-07) — v2.0
- [ ] Cryptographic ZK verification in relay — v2.0

### Out of Scope

- Production readiness (Play Store release, full device matrix, formal pen test) — not required this milestone
- iOS native build — Android-first focus
- Breaking SDK changes — backwards compatibility required

## Current State: v1.1 Shipped

**Status:** ✅ Shipped 2026-02-22

**Production URLs:**
- Relay: https://zeroauth-relay.onrender.com
- Demo: https://zeroauth-labs.github.io/Zero-Auth/
- Database: Supabase (viosipylwvcscavdwguj.supabase.co)

**v1.1 Accomplishments:**
- Production infrastructure (Render + Supabase + GitHub Pages)
- SDK with button, modal, QR code support
- Wallet security hardened (encrypted keys, complete reset)
- Rate limiting and logging

**Tech Debt (v2.0):**
- Multi-claim QR support
- Full SDK theming
- Cryptographic ZK verification in relay

## Current Milestone: v1.2 Credential Validation

**Goal:** Fix credential validation logic and improve verification reliability.

## Context

- Existing codebase includes a wallet app, relay service, and SDK.
- v1.1 shipped with production infrastructure (Render, Supabase, GitHub Pages)
- Next milestone targets credential validation fixes and improvements

## Constraints

- **Platform**: Android APK required — transition off Expo Go
- **Security**: Use Android Keystore for keypair storage/signing — standard Keystore
- **Compatibility**: SDK changes must be backwards compatible
- **Languages**: SDK scope is TypeScript/JavaScript for this milestone
- **Hosting**: No localhost dependencies — use Render, Supabase, and GitHub Pages
- **Verification**: ZK generation/verification must function at every phase
- **GSD files**: Planning files must be readable locally but not pushed to GitHub

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Android Keystore for keypair storage/signing | Secure key handling on device | ✅ Done (SecureStore) |
| SDK changes must be backwards compatible | Avoid breaking integrators | ✅ Done |
| Focus on functional APK, not production readiness | Ship usable build quickly | ✅ Done |
| Move relay to Render + Supabase | Remove localhost dependencies and improve reliability | ✅ Done |
| Host demo site on GitHub Pages | Replace ngrok/local demo hosting | ✅ Done |
| Remove demo/mock ZK flows | Ensure production-grade proof generation/verification | ✅ Done |

---

*Last updated: 2026-02-22 after v1.1 milestone*
