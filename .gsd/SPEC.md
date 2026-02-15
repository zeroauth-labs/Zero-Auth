# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Zero Auth is a privacy-first, passwordless authentication ecosystem that replaces traditional login flows with Zero-Knowledge proofs. Users scan a QR code, prove their identity locally on their device, and authenticate without sharing private documents or emails.

## Goals
1.  **Privacy-First Auth**: Authenticate users without exchanging PII (Personally Identifiable Information).
2.  **Passwordless Experience**: Scan-to-login flow using the Zero Auth Wallet and SDK.
3.  **Local ZK Generation**: Proofs are generated strictly on-device to ensure maximum security.
4.  **Selective Disclosure**: Enable specific claims like "Is over 18", "Is a Student", or "Accredited Investor" without revealing birth dates, school names, or financial balances.
5.  **Session Revocation**: Give users visibility and control over active authenticated sessions.
6.  **Digital Badging**: Prove specific skills or certifications (e.g., "Senior Developer") via localized badge credentials.

## Non-Goals (Out of Scope for MVP)
-   Biometric backup/recovery (Identity Recovery).
-   Direct Issuer-to-Db sync (Issuance via JSON/JWT import instead).
-   Cross-device session sync for the wallet.

## Users
-   **End Users**: Privacy-conscious individuals who want to login securely and prove attributes.
-   **Verifiers/Developers**: Website owners who want to offer ZK-auth via the SDK.
-   **Issuers**: Organizations providing credentials (simulated via JSON flows for MVP).

## Constraints
-   **Environment**: Must work on mobile devices with limited WebAssembly support (React Native/Hermes).
-   **Performance**: ZK proof generation must be fast enough for a good mobile UX (< 3s target).
-   **Security**: Minimal data retention on the Relay (stateless where possible).

## Success Criteria
- [ ] Wallet successfully generates a valid proof for "Age > 18".
- [ ] Relay successfully verifies proof and completes session.
- [ ] User can see and delete an active session in the Wallet dashboard.
- [ ] SDK polling detects completion and returns proof to the verifier.
