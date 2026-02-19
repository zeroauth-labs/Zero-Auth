# Pitfalls Research

**Domain:** Mobile wallet app + relay + ZK SDK (Expo to APK, Android Keystore, large circuits)
**Researched:** 2026-02-19
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Expo Go assumptions in a real APK

**What goes wrong:**
Features work in Expo Go but break in the standalone APK due to missing native modules, different JS runtime (Hermes/JSC), or release build optimizations.

**Why it happens:**
Expo Go bundles many native modules and uses dev settings; the APK only includes what is explicitly configured.

**How to avoid:**
Audit required native modules before building; align JS engine with production; run nightly APK builds with the exact release config and test on-device.

**Warning signs:**
Crashes only in release builds, undefined native modules, or behavior differences between Expo Go and APK.

**Phase to address:**
Phase 1 (APK build pipeline + release config parity testing).

---

### Pitfall 2: Keystore keys invalidated or inaccessible

**What goes wrong:**
Keys become unusable after OS update, biometric changes, or device lock setting changes; wallet breaks or loses access to proofs/signing.

**Why it happens:**
Android Keystore enforces invalidation rules based on user authentication policies and device state.

**How to avoid:**
Define clear key policies (user authentication required or not), implement key rotation and re-enrollment flows, and always test with biometric reset, device lock changes, and OS upgrades.

**Warning signs:**
Key retrieval errors like `KeyPermanentlyInvalidatedException`, failures after enabling/disabling biometrics, or unexpected re-auth prompts.

**Phase to address:**
Phase 2 (Keystore integration + recovery flows).

---

### Pitfall 3: Release signing and update path mismatch

**What goes wrong:**
Users cannot update, or data tied to app signature becomes inaccessible after switching signing keys or build flavors.

**Why it happens:**
Debug vs release signing keys differ; changing keystore or applicationId breaks Android’s update continuity.

**How to avoid:**
Lock release signing early, store signing assets securely, use consistent applicationId, and verify upgrade paths with test devices.

**Warning signs:**
“App not installed” on update, signature mismatch errors, or data loss after reinstall.

**Phase to address:**
Phase 1 (APK signing and release pipeline).

---

### Pitfall 4: Large circuit assets cause OOM and slow startup

**What goes wrong:**
Large proving keys or circuit files cause APK bloat, slow first launch, or out-of-memory crashes when loaded into JS/native memory.

**Why it happens:**
Circuit artifacts are huge; loading them eagerly or copying on each run spikes memory and IO.

**How to avoid:**
Stream or mmap large assets, lazy-load by circuit type, cache on disk with versioning, and track memory usage per proof step.

**Warning signs:**
High cold-start times, APK size growth beyond store limits, or memory-related crashes in release only.

**Phase to address:**
Phase 3 (SDK refactor for large circuits + asset management).

---

### Pitfall 5: Proof generation blocks the UI thread

**What goes wrong:**
App freezes or ANRs during proof generation on lower-end devices.

**Why it happens:**
ZK proof computation runs on the JS thread or the main UI thread instead of a dedicated worker or native thread.

**How to avoid:**
Move proof generation to a native thread or background worker, add progress reporting, and set timeouts to keep the UI responsive.

**Warning signs:**
Frame drops, “App not responding” warnings, or unresponsive UI during proofs.

**Phase to address:**
Phase 3 (SDK refactor + performance isolation).

---

### Pitfall 6: Keystore data backed up or migrated unexpectedly

**What goes wrong:**
Keys are lost or behave inconsistently after device restore or app migration; auth breaks and users need to re-enroll.

**Why it happens:**
Keystore keys are device-bound and not always restorable; backup/restore workflows are inconsistent across vendors.

**How to avoid:**
Design for re-enrollment, store only encrypted backups of non-sensitive metadata, and explicitly document recovery behavior.

**Warning signs:**
Users report failures after device migration or restore; errors only on specific OEM devices.

**Phase to address:**
Phase 2 (Keystore integration + recovery/backup behavior).

---

### Pitfall 7: Build shrinker removes or breaks ZK/crypto libs

**What goes wrong:**
R8/Proguard strips native symbols or obfuscates classes used by JNI, causing runtime crashes.

**Why it happens:**
Release builds enable shrinking; native and reflective calls are not referenced directly in Java/Kotlin code.

**How to avoid:**
Add keep rules for JNI/reflection, validate with release builds, and keep a known-good proguard config in version control.

**Warning signs:**
Crashes only in release builds with `ClassNotFoundException` or native symbol errors.

**Phase to address:**
Phase 1 (APK release build hardening).

---

### Pitfall 8: Relay/SDK protocol changes break app compatibility

**What goes wrong:**
Proofs fail or relay rejects requests after SDK refactor or circuit upgrades.

**Why it happens:**
Circuit parameters and proof formats are tightly coupled; versioning is ignored or undocumented.

**How to avoid:**
Introduce explicit protocol and circuit versioning, backward compatibility windows, and relay-side validation with clear error codes.

**Warning signs:**
Increased proof verification failures after SDK update; inconsistent behavior across app versions.

**Phase to address:**
Phase 3 (SDK refactor + relay compatibility).

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep Expo Go-only modules for speed | Faster dev loop | APK fails or lacks functionality | Only for prototyping, never in production |
| Hardcode circuit file paths in JS | Quick integration | Fragile builds, storage/upgrade issues | Never |
| Skip key rotation | Simpler keystore usage | No recovery path after invalidation | Never |
| Bundle all circuit artifacts in APK | Offline availability | APK size bloat, slow installs | Only for small circuits in early alpha |
| Run proofs on JS thread | Easy integration | ANRs and bad UX | Never |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Android Keystore | Using default auth settings with no recovery | Define key policies and implement re-enrollment flow |
| Play/App signing | Changing signing keys midstream | Lock signing keys early and test upgrade path |
| Native crypto libs | Missing JNI keep rules | Add Proguard/R8 keep rules and test release builds |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Eagerly loading full circuit assets | Slow app start, high RAM | Lazy-load, cache, mmap/stream | Breaks on mid/low-end devices |
| Proof generation on UI thread | UI freezes, ANRs | Move to worker/native threads | Breaks on any device under load |
| Re-downloading circuit data each run | High bandwidth, long delays | Versioned cache with checksum | Breaks on poor networks |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing secrets outside Keystore | Key extraction on rooted devices | Use Keystore-backed keys + encrypted storage |
| Logging sensitive material in release | Data leakage | Strip logs in release builds, add redaction |
| Not binding proofs to app/device context | Replay or misuse of proofs | Add context binding and nonce validation |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress/timeout UI for proofs | Users think app is frozen | Show progress with cancel and retry |
| Hard failures on key invalidation | Users locked out | Provide re-enrollment and recovery messaging |
| Huge first-time download without warning | Drop-offs on cellular | Preflight size + wifi recommendation |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **APK build:** Works in debug but fails in release — verify release config + Proguard keep rules
- [ ] **Keystore integration:** Keys work in one session — verify biometric reset, OS update, device restore
- [ ] **Large circuits:** Proofs work on flagship — verify mid/low-end devices and cold-start times
- [ ] **SDK refactor:** Proofs pass locally — verify relay compatibility and versioned proofs

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Keystore invalidation | MEDIUM | Prompt re-enrollment, rotate keys, re-derive non-sensitive state |
| Release signing mismatch | HIGH | Reissue with correct signing, communicate update path, preserve data migration where possible |
| Large circuit OOM | MEDIUM | Move assets to on-demand download, implement streaming loader |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Expo Go assumptions in APK | Phase 1 (APK pipeline) | Release build smoke test on 3 devices |
| Keystore invalidation | Phase 2 (Keystore integration) | Biometric reset + OS update test matrix |
| Signing mismatch | Phase 1 (APK pipeline) | Upgrade test from previous signed build |
| Large circuit OOM | Phase 3 (SDK refactor) | Memory profiling on mid-tier device |
| Proof on UI thread | Phase 3 (SDK refactor) | UI responsiveness test during proof |
| Keystore backup/migration issues | Phase 2 (Keystore integration) | Device restore and migration tests |
| Shrinker breaks JNI | Phase 1 (APK pipeline) | Release build with minify enabled |
| Relay/SDK incompatibility | Phase 3 (SDK refactor) | End-to-end proof verification in relay |

## Sources

- Personal experience / known issues (MEDIUM confidence, needs validation)
- Android Keystore docs and Expo build docs should be consulted for implementation specifics

---
*Pitfalls research for: ZeroAuth APK + Keystore + ZK SDK refactor*
*Researched: 2026-02-19*
