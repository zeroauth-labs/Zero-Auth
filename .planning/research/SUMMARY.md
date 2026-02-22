# Project Research Summary

**Project:** ZeroAuth
**Domain:** ZK credential wallet + relay + SDK production hardening
**Researched:** 2026-02-21
**Confidence:** MEDIUM

## Executive Summary

ZeroAuth is a production hardening effort for a ZK credential wallet, relay, and SDK system where users prove claims via QR flows. Experts build this as a three-tier system: a static verifier UI backed by an SDK, a hosted relay with a managed database for sessions and audits, and a wallet that generates real proofs using versioned circuits and encrypted keys.

The recommended approach is to migrate infrastructure first (Render + Supabase + GitHub Pages), then replace mock proofs with real circom/snarkjs flows, and finally harden schema/versioning and wallet key lifecycle. This sequence aligns with dependency ordering (policy storage and schema stability before multi-claim proofs) and keeps integration surfaces stable for SDK consumers.

Key risks are environment drift (localhost or mixed configs), ZK proof version mismatches, IO schema drift, and wallet reset lockouts. Mitigate these with strict config validation, versioned circuit artifacts with cross-component tests, canonical schemas with golden vectors, and explicit key lifecycle states and recovery paths.

## Key Findings

### Recommended Stack

Stack research emphasizes a stable LTS Node runtime for the relay, managed hosting for production endpoints, Supabase Postgres for durable sessions and audits, and a real circom/snarkjs toolchain for proof correctness. Supporting libraries focus on schema validation, encrypted key storage, and worker pooling for verification workloads. Detailed stack guidance in `.planning/research/STACK.md`.

**Core technologies:**
- Node.js 24 LTS: relay runtime and ZK tooling — stable LTS with production hosting alignment.
- Render Web Service: managed relay hosting — removes localhost dependencies and provides SSL/scale.
- Supabase Postgres 15.x: relay persistence — managed DB with RLS and backups.
- GitHub Pages: demo site hosting — static hosting with minimal ops.
- circom 2.2.3 + snarkjs 0.7.6: real proof generation/verification — standard circom toolchain.

### Expected Features

Feature research prioritizes production-grade hosting, real ZK flows, stable schemas, and wallet key protection for v1. Differentiators include multi-claim proofs and transport abstraction, while offline verification and schema registry are v2+. Details in `.planning/research/FEATURES.md`.

**Must have (table stakes):**
- Hosted relay + managed DB — expected for production traffic stability.
- Real ZK proof generation + verification — no mock/demo flows.
- IO schema validation + versioning — consistent wallet/relay/SDK payloads.
- Wallet key encryption + reset behavior — secure key lifecycle and recovery.
- SDK modular config + error taxonomy — predictable integration surface.
- QR short-token flow — QR size constraints in production.

**Should have (competitive):**
- Multi-claim proofs with selective disclosure — richer proofs and lower data sharing.
- SDK transport abstraction — swap relay/backend without rewrites.
- Performance tuning for proofs — reduce scan latency.

**Defer (v2+):**
- Offline verification mode — high complexity, niche deployments.
- Cross-platform recovery flows — heavy UX and security tradeoffs.
- Schema registry + tooling — only after ecosystem grows.

### Architecture Approach

The architecture centers on a hosted relay with a policy service and Supabase persistence, a wallet that generates proof bundles via a ZK engine bridge, and an SDK used by a static verifier UI. Recommended patterns include a key management adapter, a claim registry for circuit selection, and a proof bundle envelope with schema versioning. See `.planning/research/ARCHITECTURE.md`.

**Major components:**
1. Relay API + policy service — session creation, policy enforcement, proof verification.
2. Supabase Postgres — persistent sessions, audit logs, rate limits.
3. Wallet app + ZK engine bridge — proof generation and key management.
4. SDK + verifier UI — session handshake, polling, and UX integration.

### Critical Pitfalls

Top risks with mitigations from `.planning/research/PITFALLS.md`:

1. **Relay still assumes localhost** — enforce config validation and CI checks that fail on localhost values.
2. **ZK proof mismatch across components** — version circuit artifacts and run cross-component proof tests.
3. **IO format drift breaks multi-claim proofs** — canonical schemas, strict validation, and golden vectors.
4. **Wallet reset causes lockouts** — explicit key lifecycle, encrypted storage, and recovery flows.
5. **Supabase migration breaks auth/sessions** — model RLS/indexes and load test with pooling limits.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Production Hosting + Data Persistence
**Rationale:** Remove localhost dependencies and establish durable session storage before changing proof logic.
**Delivers:** Render relay deployment, Supabase schema/migrations, GitHub Pages demo URLs, env validation.
**Addresses:** Hosted relay + managed DB, QR short-token flow, demo site hosting.
**Avoids:** Relay still assumes localhost, Supabase auth/session issues, GH Pages routing failures.

### Phase 2: Real ZK Flows + SDK Config Stabilization
**Rationale:** Proof correctness and SDK compatibility are core to production viability; depends on stable hosting.
**Delivers:** circom/snarkjs proof generation and relay verification, versioned circuit artifacts, SDK config schema and error taxonomy.
**Addresses:** Real ZK proof generation + verification, SDK modular config + error taxonomy.
**Avoids:** ZK proof mismatch across components, fragmented SDK configuration.

### Phase 3: Schema + Wallet Hardening + Multi-Claim Readiness
**Rationale:** Schema stability and key lifecycle are prerequisites for multi-claim proofs and external integrations.
**Delivers:** Canonical proof bundle schema with versioning, claim registry, wallet key encryption/reset, golden vectors.
**Addresses:** IO schema validation + versioning, wallet key encryption + reset, multi-claim proofs groundwork.
**Avoids:** IO format drift, wallet reset lockouts, unvalidated claim schemas.

### Phase 4: Performance + Abuse Controls
**Rationale:** Optimize once real proofs and production traffic exist; depends on earlier correctness and schema work.
**Delivers:** Verification worker pools, rate limiting, observability, proof performance tuning.
**Addresses:** Rate limiting + abuse controls, observability dashboards, performance tuning.
**Avoids:** Relay performance collapse, missing indexes/backpressure.

### Phase Ordering Rationale

- Hosting and persistence unlock real end-to-end testing and remove localhost dependencies.
- Real ZK flows require stable config, versioned artifacts, and a hosted relay to verify.
- Schema and wallet hardening must precede multi-claim proofs to prevent drift and lockouts.
- Performance work should follow baseline measurement with real circuits and production endpoints.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Circuit versioning, proof compatibility tests, and verification key distribution.
- **Phase 3:** Schema standards alignment, multi-claim formats, wallet recovery/security tradeoffs.
- **Phase 4:** Verification performance benchmarking and queue/worker sizing.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Render + Supabase + GitHub Pages deployment patterns are well-established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Official sources for versions; validate Supabase Postgres version in project. |
| Features | LOW | No external sources; based on inference and internal context. |
| Architecture | MEDIUM | Grounded in internal architecture notes and common patterns. |
| Pitfalls | MEDIUM | Experience-based; needs validation with production metrics. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Feature validation vs standards/competitors:** confirm requirements against external docs and market expectations during planning.
- **Circuit and proof tooling compatibility:** validate with end-to-end tests across wallet, relay, and SDK.
- **Supabase RLS and pooling constraints:** verify with load tests and explicit policies before production.

## Sources

### Primary (HIGH confidence)
- https://nodejs.org/en/about/releases — Node.js 24 LTS
- https://github.com/iden3/circom/releases — circom 2.2.3
- https://registry.npmjs.org/snarkjs — snarkjs 0.7.6
- https://registry.npmjs.org/circomlib — circomlib 2.0.5
- https://registry.npmjs.org/circomlibjs — circomlibjs 0.1.7
- https://registry.npmjs.org/@supabase/supabase-js — @supabase/supabase-js 2.97.0
- https://registry.npmjs.org/zod — zod 4.3.6
- https://registry.npmjs.org/@noble/ciphers — @noble/ciphers 2.1.1
- https://registry.npmjs.org/piscina — piscina 5.1.4
- https://registry.npmjs.org/tsup — tsup 8.5.1
- https://registry.npmjs.org/supabase — supabase CLI 2.76.12
- https://supabase.com/docs/guides/database/postgres/which-version-of-postgres — Postgres version check

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` — internal architecture patterns and build order

### Tertiary (LOW confidence)
- `.planning/research/FEATURES.md` — feature expectations without external validation
- `.planning/research/PITFALLS.md` — experience-based risk list without external sources

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
