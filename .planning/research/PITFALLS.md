# Pitfalls Research

**Domain:** Zero-knowledge auth relay + SDK/wallet hardening (demo to production)
**Researched:** 2026-02-21
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Shipping a relay that still assumes localhost

**What goes wrong:**
Hidden hardcoded URLs, permissive CORS rules, or local-only secrets make the hosted relay fail in production or silently fall back to insecure defaults.

**Why it happens:**
Demo scaffolding persists (localhost endpoints, mock env vars, debug CORS) and is not fully audited when moving to Render/Supabase/GitHub Pages.

**How to avoid:**
Centralize configuration, add explicit environment validation at startup, and maintain a “no-localhost in prod” CI check that fails builds.

**Warning signs:**
Production build includes `localhost` or `.env.example` values; first deploy works only in the developer’s environment.

**Phase to address:**
Phase 1: Infra migration and environment hardening

---

### Pitfall 2: ZK proof generation/verification mismatch between SDK and relay

**What goes wrong:**
Proofs that validate locally fail in production due to mismatched circuit versions, verification keys, or inconsistent input packing.

**Why it happens:**
Replacing mock ZK with real flows is done incrementally, and versions drift across SDK, relay, and wallet.

**How to avoid:**
Version and publish circuits/verification keys as artifacts, pin SDK/relay to the same version, and include a compatibility test that generates and verifies a proof across components.

**Warning signs:**
Intermittent “invalid proof” errors, especially after deploys or SDK updates.

**Phase to address:**
Phase 2: Real ZK flows + cross-component compatibility

---

### Pitfall 3: IO format drift breaks multi-claim proofs

**What goes wrong:**
Claims are serialized differently across components, leading to verification failures or incorrect claim ordering in multi-claim proofs.

**Why it happens:**
Demo formats evolve organically without a formal schema; multiple teams adjust JSON shapes independently.

**How to avoid:**
Define a canonical schema (with versioning), add strict parsing/validation, and create golden test vectors for single- and multi-claim payloads.

**Warning signs:**
Fixes that add one-off adapters, or bugs that only happen with multi-claim proofs.

**Phase to address:**
Phase 3: IO standards audit and schema enforcement

---

### Pitfall 4: Wallet keypair/DID reset behavior causes account lockouts

**What goes wrong:**
Users can’t recover after device loss or reset; DIDs become inconsistent, breaking proof generation and relay authorization.

**Why it happens:**
Demo wallets store keys without robust encryption, rotation, or recovery flows; reset semantics are undefined.

**How to avoid:**
Define explicit key lifecycle states, encrypt keys with user-verified secrets, and implement a deterministic recovery/reset path tied to DID rotation.

**Warning signs:**
Users report “invalid DID” or “no keypair” after reinstall; support relies on manual DB edits.

**Phase to address:**
Phase 3: Wallet hardening and recovery semantics

---

### Pitfall 5: Relay database migration to Supabase breaks auth/session handling

**What goes wrong:**
Tokens or sessions are stored with assumptions about local DB behavior; migrating to Supabase introduces latency, row-level security mismatches, or connection pooling issues.

**Why it happens:**
Local DB environments don’t enforce the same connection constraints or RLS policies as Supabase.

**How to avoid:**
Model sessions and auth data explicitly for Supabase (RLS, indexes, pooling), and load test with realistic connection limits.

**Warning signs:**
Spike in 401s after deploy, or query timeouts under normal load.

**Phase to address:**
Phase 1: Database migration and auth hardening

---

### Pitfall 6: SDK configuration becomes fragmented and inconsistent

**What goes wrong:**
Apps integrate multiple config flags and get contradictory behavior (e.g., “dev relay” + “prod circuit”).

**Why it happens:**
Incremental additions to SDK configuration without a single source of truth or validation schema.

**How to avoid:**
Define a strict config schema with defaults, deprecations, and validation errors; provide a single high-level config API.

**Warning signs:**
SDK consumers rely on copy-pasted examples or hidden env flags to make things work.

**Phase to address:**
Phase 2: SDK modularity and config redesign

---

### Pitfall 7: GitHub Pages hosting breaks auth flows and callback URLs

**What goes wrong:**
Static hosting cannot handle dynamic callback routes or secure cookie flows, breaking login/relay handshake.

**Why it happens:**
Demo site assumptions about server-side routing are carried over to static hosting.

**How to avoid:**
Use hash-based routing or explicit static routes, move auth callbacks to relay endpoints, and validate CORS/callback URLs in production.

**Warning signs:**
Login works locally but fails in deployed demo; 404s on deep links.

**Phase to address:**
Phase 1: Hosting and routing alignment

---

### Pitfall 8: Relay performance collapses under real proof verification load

**What goes wrong:**
Proof verification saturates CPU, causing timeouts and cascading failures.

**Why it happens:**
Demo verification uses mocked or lightweight proofs; production proofs are heavier and not profiled.

**How to avoid:**
Benchmark real proof verification, introduce batching or queueing, and separate verification workers from request handling.

**Warning signs:**
CPU spikes on relay, increased latency even at low QPS.

**Phase to address:**
Phase 4: Performance hardening and capacity planning

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep mock ZK paths in production | Faster rollout | Hard-to-debug mismatches and security gaps | Never |
| Allow multiple config sources without validation | Flexibility for early adopters | Drift and inconsistent behavior | Only in internal alpha |
| Store wallet keys unencrypted “temporarily” | Faster dev | Irreversible security liability | Never |
| Ignore schema versioning for claims | Quick iteration | Multi-claim incompatibility and brittle parsing | Only before first external integrator |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Render | Assuming long-running background tasks are safe in web dynos | Move proof verification to worker or queue; keep web dynos fast |
| Supabase | Using default RLS policies without modeling auth flows | Design RLS + indexes for session/relay workloads |
| GitHub Pages | Relying on server-side routing or cookie callbacks | Use static-safe routing; handle callbacks via relay endpoints |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous proof verification in request path | Timeouts and request queue buildup | Async queue/worker separation | Often at low QPS with heavy proofs |
| Missing DB indexes for session/claim lookups | Increasing latency and spikes | Add targeted indexes and profile queries | Hundreds to thousands of sessions |
| Single relay instance with no backpressure | Memory/CPU spikes and crashes | Rate limiting + queue + autoscaling | Sudden traffic bursts |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Reusing demo keys or verification keys in production | Proofs can be forged or replayed | Regenerate and rotate keys per environment |
| Weak wallet key encryption or no reset policy | Account takeover or permanent lockout | Encrypt keys with user-held secrets; define recovery + rotation |
| Accepting unvalidated claim schemas | Proofs verifying wrong data | Strict schema validation and canonical encoding |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Opaque “invalid proof” errors | Users can’t resolve issues | Provide actionable errors + retry hints |
| Wallet reset wipes identity without warning | Users lose DID and access | Guided reset with explicit consequences + backup path |
| SDK requires too many manual steps | Integrators abandon or misconfigure | Provide a single high-level init path with safe defaults |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Relay hosting:** Often missing env validation and no-localhost checks — verify production build fails on localhost URLs
- [ ] **ZK flows:** Often missing end-to-end compatibility tests — verify proof generation/verification across SDK + relay
- [ ] **Wallet hardening:** Often missing recovery path — verify reset + rebind works without manual DB edits
- [ ] **IO formats:** Often missing schema versioning — verify versioned claim payloads and golden vectors

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| ZK proof mismatch across components | HIGH | Roll back to last compatible circuit version, re-issue verification keys, re-run compatibility tests |
| Broken DID after wallet reset | MEDIUM | Provide guided recovery; rotate DID and rebind proofs; invalidate old sessions |
| Supabase auth/session failures | MEDIUM | Rebuild RLS policies, add indexes, deploy hotfix with session migration |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Relay still assumes localhost | Phase 1 | CI check fails if `localhost` appears in production build |
| ZK proof mismatch | Phase 2 | Cross-component proof test passes in CI |
| IO format drift | Phase 3 | Schema validation + golden vectors in tests |
| Wallet reset lockouts | Phase 3 | Recovery path works in integration test |
| Supabase auth/session issues | Phase 1 | Load test passes with RLS + pooling |
| Relay performance collapse | Phase 4 | Sustained verification load meets SLO |

## Sources

- Personal experience with ZK and relay production migrations (no external sources queried)

---
*Pitfalls research for: ZeroAuth production hardening*
*Researched: 2026-02-21*
