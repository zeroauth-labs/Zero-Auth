# Project Research Summary

**Project:** ZeroAuth
**Domain:** Passwordless credential wallet + relay service + TS/JS SDK
**Researched:** 2026-02-19
**Confidence:** MEDIUM

## Executive Summary

ZeroAuth is a passwordless credential wallet with QR-based verification, backed by a relay service and a TS/JS SDK. The research indicates this is best built as an Android-first Expo-managed app with a dev client and native modules, paired with a Fastify relay and a TypeScript SDK, while isolating key management and proof orchestration behind adapters to keep UI and SDK stable.

The recommended approach is to first reach Android APK parity with existing Expo Go flows, then integrate Android Keystore-backed keys via a stable key adapter, and finally harden proof/relay/SDK handling for large circuits and payloads. This sequencing aligns with dependency constraints and minimizes risk while preserving backward compatibility for the SDK.

Primary risks are APK release differences vs Expo Go, Keystore invalidation and recovery, and large-circuit performance/memory issues. These are mitigated by enforcing release-build parity testing early, defining key policies with re-enrollment flows, and introducing circuit registries, asset caching, and size-aware transport before expanding proof complexity.

## Key Findings

### Recommended Stack

Expo SDK 54 with React Native 0.81 is the most compatible path for Android APK parity while still allowing native module access via EAS dev client. The relay and SDK should remain in modern Node/TypeScript (Node 24 LTS, Fastify 5, TS 5.9) to support large payloads and stable typing. For Android storage and crypto, Keystore-backed `react-native-keychain` plus `react-native-quick-crypto` are required to avoid Expo Go limitations and deprecated crypto shims. See `./.planning/research/STACK.md`.

**Core technologies:**
- Expo SDK 54: wallet runtime and APK builds — keeps Expo-managed workflow while enabling native modules.
- React Native 0.81: mobile UI/runtime — aligned with Expo 54 release cadence and stability.
- Node.js 24 LTS: relay + tooling runtime — supports modern TS and Fastify 5.
- Fastify 5: relay HTTP API — performant and schema-driven for large proof payloads.
- PostgreSQL 18: relay persistence — durable metadata and audit trails.
- TypeScript 5.9: wallet/relay/SDK typing — stable, accurate SDK type surface.

### Expected Features

The MVP is centered on Android APK parity with current flows (credential add/revoke, proof generation, QR scan/display) plus Keystore-backed keys and basic revocation status checks. Differentiators include large-circuit support, selective disclosure UX, and modular verifier SDK packaging. Multi-device sync and advanced policy engines should be deferred to v2+. See `./.planning/research/FEATURES.md`.

**Must have (table stakes):**
- APK parity for existing flows — users expect the same behavior as Expo Go.
- Android Keystore-backed keys — baseline trust and security.
- QR display for proof presentation — completes verifier flow.
- Revocation status check — required for verifier trust.

**Should have (competitive):**
- Large-circuit support in SDK — reduces proof failures for complex credentials.
- Selective disclosure UX — explicit user consent on data shared.
- SDK modularity for verifiers — easier partner integration.

**Defer (v2+):**
- Multi-device encrypted sync — high complexity and threat-model work.
- Advanced policy engine — depends on usage patterns.

### Architecture Approach

Use a layered wallet/relay/SDK architecture with adapter boundaries: a key management adapter (Keystore + fallback), a circuit registry and proof orchestration module, and size-aware transport between wallet, relay, and SDK. This keeps UI thin, enables APK parity without code churn, and allows scaling to large proof payloads. See `./.planning/research/ARCHITECTURE.md`.

**Major components:**
1. Wallet UI + ZK Engine bridge — scans QR, prompts user, generates proofs via WebView.
2. Key Mgmt Adapter — abstracts Keystore and fallback storage, signs DID/ed25519.
3. Relay API + Session Service — manages sessions, validates proofs, stores state in Redis.
4. SDK transport/types — standard verifier handshake, polling, and compatibility.

### Critical Pitfalls

1. **Expo Go assumptions in APK** — require release-build parity testing and native module audits early.
2. **Keystore key invalidation** — define key policies and re-enrollment/rotation flows, test biometric/OS changes.
3. **Release signing mismatch** — lock signing early and verify upgrade paths on devices.
4. **Large circuit OOM or slow startup** — lazy-load circuits, cache assets, and avoid eager loading.
5. **Proof generation on UI thread** — move proof work off the UI thread and add progress/timeout handling.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: APK Parity + Release Hardening
**Rationale:** APK parity is the gating dependency for every user-facing flow; release build differences must be solved first to avoid false confidence from Expo Go.
**Delivers:** Working Android APK with parity for add/revoke, proof generation, QR scan/display; release signing and shrinker configuration validated.
**Addresses:** APK parity flows, QR display, basic revocation check.
**Avoids:** Expo Go assumptions, shrinker/JNI breakage, signing mismatch.

### Phase 2: Keystore Integration + Recovery UX
**Rationale:** Secure key storage is mandatory for production-like APKs and depends on stabilized release builds and adapter boundaries.
**Delivers:** Keystore-backed key adapter, biometric/PIN gating, re-enrollment and recovery paths, key policy definition.
**Uses:** `react-native-keychain`, Android Keystore modules.
**Implements:** Key Mgmt Adapter boundary in wallet architecture.

### Phase 3: SDK/Proof Scaling + Compatibility
**Rationale:** Large-circuit support and SDK modularity depend on stable key storage and parity flows; this phase tackles performance, payload size, and protocol compatibility.
**Delivers:** Circuit registry + asset cache, size-aware transport, relay body limits, SDK modularity, selective disclosure UX.
**Addresses:** Large-circuit support, SDK modularity, selective disclosure.
**Avoids:** OOM/slow startup, UI thread blocking, relay/SDK incompatibility.

### Phase Ordering Rationale

- APK parity and release hardening are prerequisites for validating any other work on real devices.
- Keystore integration requires stable adapters and release builds to safely test invalidation/recovery flows.
- Large-circuit and SDK refactors require stable proof and key paths to avoid breaking compatibility.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Keystore policies, invalidation, and recovery flows need OS-level validation.
- **Phase 3:** Large-circuit performance and relay/SDK compatibility require profiling and protocol versioning research.

Phases with standard patterns (skip research-phase):
- **Phase 1:** APK build pipeline, signing, and release config are well-documented patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Based on official docs and release notes; good version alignment. |
| Features | LOW | Mostly inferred from project context; minimal external validation. |
| Architecture | MEDIUM | Internal architecture notes plus standard patterns. |
| Pitfalls | MEDIUM | Experience-based with known Android/ZK failure modes; needs validation. |

**Overall confidence:** MEDIUM

### Gaps to Address

- Keystore policy details and recovery UX — validate against Android Keystore docs and device-specific behavior.
- Proof performance on mid/low-end devices — run profiling to confirm memory/CPU assumptions for large circuits.
- SDK/relay protocol versioning — define explicit versioning and compatibility windows.

## Sources

### Primary (HIGH confidence)
- https://docs.expo.dev/versions/latest/ — Expo SDK 54 matrix and Node requirements.
- https://nodejs.org/en/download — Node.js 24 LTS versioning.
- https://github.com/fastify/fastify/releases — Fastify 5.7.4 release information.

### Secondary (MEDIUM confidence)
- `./.planning/codebase/ARCHITECTURE.md` — internal architecture notes.
- `./.planning/codebase/INTEGRATIONS.md` — integration audit.
- https://github.com/oblador/react-native-keychain/releases — Keystore module versioning.

### Tertiary (LOW confidence)
- Project context and milestone notes — feature prioritization and MVP assumptions.
- Personal experience/known issues — pitfalls and recovery strategies requiring validation.

---
*Research completed: 2026-02-19*
*Ready for roadmap: yes*
