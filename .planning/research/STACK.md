# Stack Research

**Domain:** ZeroAuth v1.1 production hardening (relay + Supabase + GitHub Pages + real ZK + SDK/wallet hardening)
**Researched:** 2026-02-21
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js (LTS) | 24.13.1 | Relay runtime on Render + ZK CLI tooling | Current LTS for security and stability; aligns with production hosting expectations and modern tooling. |
| Render Web Service | Managed (Node 24.x runtime) | Host relay API without localhost dependencies | Simplifies deploy/SSL/scale for a single relay service; aligns with Node LTS runtime. |
| Supabase Postgres | PostgreSQL 15.x (verify in project) | Relay persistence + audit/log data | Managed Postgres with RLS, backups, and direct SQL access; removes local DB dependency. |
| GitHub Pages | Managed (no version) | Host demo site static build | Simple static hosting with built-in HTTPS; minimal ops for demo distribution. |
| circom | 2.2.3 | Circuit compilation for real ZK flows | Current circom compiler release for real circuit build artifacts. |
| snarkjs | 0.7.6 | Proof generation/verification (Groth16/Plonk) | Widely used JS toolchain for circom circuits; supports WASM and Node flows. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | 2.97.0 | Relay DB access + service role operations | Use inside relay to read/write Supabase Postgres and manage API tokens. |
| zod | 4.3.6 | IO schema validation for relay/SDK | Validate proof payloads, credential formats, and multi-claim inputs consistently. |
| @noble/ciphers | 2.1.1 | Wallet key/DID encryption (AEAD) | Encrypt key material before storage; pair with existing @noble/hashes for KDFs. |
| circomlib | 2.0.5 | Standard circuit primitives | Use for Poseidon, Pedersen, and other primitives in production circuits. |
| circomlibjs | 0.1.7 | Witness generation helpers in JS | Use when witness generation happens in JS (wallet or relay). |
| piscina | 5.1.4 | Worker pool for verification | Use in relay to parallelize proof verification and avoid event-loop stalls. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| supabase CLI | 2.76.12 | Migrations, local dev, schema export | Pin CLI version to keep migration formats stable across environments. |
| tsup | 8.5.1 | SDK bundling (CJS/ESM + types) | Ship modular SDK builds with consistent type output. |

## Installation

```bash
# Core
npm install snarkjs@0.7.6 circomlib@2.0.5 circomlibjs@0.1.7

# Supporting
npm install @supabase/supabase-js@2.97.0 zod@4.3.6 @noble/ciphers@2.1.1 piscina@5.1.4

# Dev dependencies
npm install -D supabase@2.76.12 tsup@8.5.1
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Supabase Postgres | Neon / Render Postgres | Use if you need Postgres features outside Supabase or want vendor-neutral DB hosting. |
| circom + snarkjs | Halo2 / Risc0 / gnark | Use if you need recursion, non-circom DSLs, or Rust/Go-native proving. |
| GitHub Pages | Cloudflare Pages / Netlify | Use if you need edge functions, preview deploys, or larger build limits. |
| zod | valibot / superstruct | Use if bundle size or schema DSL preferences differ. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Local SQLite/in-memory relay DB | Not production-safe; no durable audit trail or multi-instance support | Supabase Postgres (managed). |
| Mock/demo ZK proofs in production | Breaks verification trust and format compatibility | Real circom circuits + snarkjs verification keys. |
| Storing raw private keys in AsyncStorage | Not encrypted or hardware-backed | Encrypt with @noble/ciphers and store via existing secure storage. |

## Stack Patterns by Variant

**If proofs are generated on-device (wallet-first):**
- Use snarkjs + WASM in the wallet with local proving keys
- Because it keeps private inputs on-device and relay only verifies

**If proofs are generated on the relay (server-first):**
- Use snarkjs in Node + piscina for parallel verification/proving
- Because it centralizes compute and simplifies wallet resource constraints

**If demo site is purely static:**
- Use GitHub Pages for hosting
- Because it removes server dependencies for the demo site

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| circom@2.2.3 | snarkjs@0.7.6 | Standard circom toolchain pairing; verify in CI with circuit build/prove/verify. |
| circomlib@2.0.5 | circom@2.2.3 | Common pairing for circom 2.x circuits; validate any custom templates. |
| @supabase/supabase-js@2.97.0 | Supabase Postgres 15.x | Client is API-based; Postgres version is managed by Supabase and should be verified per project. |

## Sources

- https://nodejs.org/en/about/releases/ — Node.js 24 LTS version
- https://github.com/iden3/circom/releases — circom 2.2.3 release
- https://registry.npmjs.org/snarkjs — snarkjs 0.7.6
- https://registry.npmjs.org/circomlib — circomlib 2.0.5
- https://registry.npmjs.org/circomlibjs — circomlibjs 0.1.7
- https://registry.npmjs.org/@supabase/supabase-js — @supabase/supabase-js 2.97.0
- https://registry.npmjs.org/zod — zod 4.3.6
- https://registry.npmjs.org/@noble/ciphers — @noble/ciphers 2.1.1
- https://registry.npmjs.org/piscina — piscina 5.1.4
- https://registry.npmjs.org/tsup — tsup 8.5.1
- https://registry.npmjs.org/supabase — supabase CLI 2.76.12
- https://supabase.com/docs/guides/database/postgres/which-version-of-postgres — Postgres version check guidance

---
*Stack research for: ZeroAuth production hardening stack additions*
*Researched: 2026-02-21*
