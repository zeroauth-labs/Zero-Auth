# Feature Research

**Domain:** Passwordless credential wallet + verification flow (Android APK parity)
**Researched:** 2026-02-19
**Confidence:** LOW

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| APK parity with existing Expo Go flows | Users expect Android APK to do everything the dev preview does | MEDIUM | Requires full Android build pipeline and parity UI/UX with current credential add/revoke, proof generation, QR scan flows |
| Secure key storage in Android Keystore | Hardware-backed keys are baseline for wallet trust | MEDIUM | Backing DID/ed25519 keys with Keystore; align with existing DID + ed25519 support |
| Credential list + details view | Users need to see and manage credentials | LOW | Uses existing credential add/revoke; add filtering and detail metadata |
| Issuance via QR/deeplink | Standard for credential wallets | MEDIUM | Builds on QR scan + proof/hash; ensure APK handles deep links |
| Verification via QR display/scan | Core wallet-to-verifier flow | MEDIUM | Build on current QR scan; add QR display for proof presentation |
| Proof generation with error handling | Verification must be reliable | HIGH | Large circuits support and performance are critical for APK stability |
| Revocation status check | Verifiers expect revocation handling | MEDIUM | Tied to existing revoke feature; needs network and status cache |
| User auth (PIN/biometric) before proof | Protects credential access | MEDIUM | OS biometric prompt; fallback PIN; avoid storing biometrics directly |
| Offline-safe behavior | Wallet should not fail hard without network | MEDIUM | Cache issuer schemas, revocation status; degrade gracefully |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Large-circuit support in SDK | Enables higher-scope credentials and complex proofs | HIGH | Aligns with milestone: SDK stability for larger circuits |
| Proof performance profiling + preflight | Reduces user wait and failure rates | MEDIUM | Pre-calc, circuit selection, memory checks on device |
| Selective disclosure UX | Builds trust by showing exactly what is shared | MEDIUM | Provide a human-readable proof summary before submission |
| Verifier SDK modularity | Easier partner integration | MEDIUM | SDK modules for verification, revocation, QR, and transport |
| Privacy-preserving telemetry | Helps improve reliability without leaking PII | MEDIUM | Opt-in aggregate metrics only; no credential content |
| Multi-factor local unlock policy | Stronger security than default wallet unlock | MEDIUM | Policy engine: biometric + PIN for high-risk proofs |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Cloud key escrow by default | Convenience for recovery | Breaks trust model; increases breach risk | Local-only keys + user-controlled recovery phrase |
| Auto-upload credentials to server | Cross-device sync | Expands attack surface and regulatory risk | Encrypted export/import with explicit user consent |
| “Magic login” fallback with passwords | Familiar UX | Undermines passwordless narrative | Use device unlock + session re-auth |
| Hidden proof details (“one-tap share”) | Faster flow | User cannot verify what is shared | Explicit proof preview with field-level consent |

## Feature Dependencies

```
[APK parity flows]
    └──requires──> [Credential add/revoke]
                       └──requires──> [DID + ed25519 keys]
    └──requires──> [Proof + hash generation]
    └──requires──> [QR scan]
    └──requires──> [Android Keystore]

[Verification via QR display]
    └──requires──> [Proof + hash generation]

[Revocation status check]
    └──requires──> [Credential revoke]
    └──requires──> [Network transport]

[Large-circuit support]
    └──requires──> [SDK modularity]
    └──enhances──> [Proof generation]
```

### Dependency Notes

- **APK parity flows require credential add/revoke:** these features are the base user actions already available in Expo Go and must work in APK.
- **APK parity flows require proof + hash generation:** verification depends on stable proof output and hashing.
- **APK parity flows require QR scan:** issuance and verification are QR-based today; parity requires Android QR handling.
- **APK parity flows require Android Keystore:** secure key storage is expected for production APK.
- **Large-circuit support enhances proof generation:** adds reliability and performance for complex proofs in Android.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] APK parity for existing flows (credential add/revoke, proof generation, QR scan) — core functionality on Android
- [ ] Android Keystore-backed keys — baseline security for production APK
- [ ] QR display for proof presentation — completes verifier flow
- [ ] Basic revocation status check — verifier trust and compliance

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] SDK modularity for verifier partners — accelerate integrations
- [ ] Large-circuit support and stability — reduce proof failures
- [ ] Selective disclosure UX — increase user trust

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Multi-device sync with user-controlled encryption — requires stronger threat modeling
- [ ] Advanced policy engine for high-risk proofs — useful once usage patterns are known

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| APK parity flows | HIGH | MEDIUM | P1 |
| Android Keystore-backed keys | HIGH | MEDIUM | P1 |
| QR display for proof presentation | HIGH | MEDIUM | P1 |
| Revocation status check | HIGH | MEDIUM | P1 |
| Large-circuit support | MEDIUM | HIGH | P2 |
| Selective disclosure UX | MEDIUM | MEDIUM | P2 |
| SDK modularity for verifiers | MEDIUM | MEDIUM | P2 |
| Privacy-preserving telemetry | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A | Competitor B | Our Approach |
|---------|--------------|--------------|--------------|
| Credential wallet + QR verification | Not assessed | Not assessed | APK parity with Expo Go flows |
| Hardware-backed keys | Not assessed | Not assessed | Android Keystore + DID/ed25519 |
| Selective disclosure UX | Not assessed | Not assessed | Explicit proof preview |

## Sources

- Project context and milestone notes (no external sources)

---
*Feature research for: passwordless credential wallet + verification flow*
*Researched: 2026-02-19*
