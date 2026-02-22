# Architecture Research

**Domain:** ZK credential wallet + relay + SDK verification platform (production hardening)
**Researched:** 2026-02-21
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Verifier / Demo Layer                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐     ┌──────────────────────┐                         │
│  │ Demo Site (GH Pages│<───>│ zero-auth-sdk (TS)   │                         │
│  │ + Verifier UI)     │     └──────────┬───────────┘                         │
│  └────────────────────┘                │                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                         Relay / Verification Layer                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐     ┌──────────────────────┐                         │
│  │ Relay API (Render) │<───>│ Session/Policy Svc   │                         │
│  └────────────────────┘     └──────────┬───────────┘                         │
│                                        │                                     │
│   ┌────────────────────┐     ┌─────────▼──────────┐                           │
│   │ Proof Verifier     │<───>│ Supabase Postgres  │                           │
│   │ (SnarkJS/Verifier) │     │ (sessions, audit)  │                           │
│   └────────────────────┘     └────────────────────┘                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                      Wallet / Proof Generation Layer                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐     ┌──────────────────────┐                         │
│  │ Wallet App (Expo)  │<───>│ ZK Engine (WebView)  │                         │
│  └──────────┬─────────┘     └──────────┬───────────┘                         │
│             │                            │                                    │
│  ┌──────────▼─────────┐     ┌───────────▼───────────┐                         │
│  │ Key Mgmt Adapter   │     │ Circuit Assets        │                         │
│  │ (Keystore/SStore)  │     │ (.wasm/.zkey/.vk.json)│                         │
│  └────────────────────┘     └───────────────────────┘                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Demo Site / Verifier UI | Create verification sessions, render QR, display results | Static site on GitHub Pages + SDK |
| SDK | Standardized verifier handshake, polling, session validation | TS client with fetch and typed config |
| Relay API | Create sessions, accept proofs, enforce policy, return status | Express/Node service on Render |
| Session/Policy Service | Session lifecycle, claim policy matching, multi-claim handling | Service layer + validators |
| Proof Verifier | Verify proofs using real ZK keys and public signals | SnarkJS verifier helpers |
| Supabase Postgres | Persistent sessions, audit logs, rate limits | Postgres + RPC or service role |
| Wallet App | Scan QR, present claims, orchestrate proof creation, submit proof | Expo Router + React Native |
| ZK Engine Bridge | Execute prover in WebView, return proof bundle | WebView bridge + bundled prover |
| Key Mgmt Adapter | Manage DID/keypair encryption, reset flows | Android Keystore + SecureStore fallback |

## Recommended Project Structure

```
zero-auth-wallet/
├── lib/
│   ├── keys/                    # Key management interfaces + platform adapters
│   │   ├── index.ts
│   │   ├── keystore.android.ts
│   │   ├── securestore.ts
│   │   └── reset.ts             # Reset + rekey workflows
│   ├── proof/
│   │   ├── index.ts
│   │   ├── registry.ts          # Claim modules + circuit registry
│   │   ├── inputs.ts            # Input normalization per claim
│   │   └── bundle.ts            # Proof bundle shaping (multi-claim)
│   └── transport/
│       └── relay.ts
├── components/
│   └── ZKEngine.tsx
├── circuits/
│   ├── prover/                  # .wasm/.zkey for wallet
│   └── verifier/                # .vk.json for proof bundle
└── assets/

zero-auth-sdk/
├── src/
│   ├── index.ts                 # SDK entry with configurable policy
│   ├── config.ts                # Environment + endpoint config
│   ├── transport.ts
│   └── types.ts                 # Shared schema + claim types
└── examples/

zero-auth-relay/
├── src/
│   ├── index.ts                 # Express routes + body limits
│   ├── services/
│   │   ├── session.service.ts
│   │   ├── policy.service.ts    # Claim policy evaluation
│   │   └── verifier.service.ts  # Proof verification helpers
│   ├── storage/
│   │   └── supabase.ts          # Supabase DB + RPC wrappers
│   └── lib/
│       └── circuits.ts          # Verification key loader
└── circuits/
    └── verifier/                # Verification keys for relay
```

### Structure Rationale

- **`zero-auth-wallet/lib/keys/`:** isolates key encryption/reset semantics so wallet hardening does not change UI flows.
- **`zero-auth-wallet/lib/proof/`:** creates a single place to manage multi-claim proof bundles and circuit selection.
- **`zero-auth-relay/storage/`:** keeps Supabase-specific code out of session logic to allow local/mock storage when needed.

## Architectural Patterns

### Pattern 1: Adapter Boundary for Key Management

**What:** Define a single wallet key API used by screens, implemented by Android Keystore with a secure-store fallback.
**When to use:** When migrating from Expo SecureStore to native Keystore without breaking callers.
**Trade-offs:** Adds an abstraction layer, but keeps UI and proof logic unchanged.

**Example:**
```typescript
export interface KeyStore {
  getDid(): Promise<string>
  sign(payload: Uint8Array): Promise<Uint8Array>
  ensureKeypair(): Promise<void>
}
```

### Pattern 2: Claim Module + Circuit Registry

**What:** Register claim modules that define inputs, circuit IDs, and verification key versions.
**When to use:** When moving from single-claim proofs to modular multi-claim bundles.
**Trade-offs:** More bookkeeping and versioning, but enables composition and upgrade control.

**Example:**
```typescript
const claims: Record<string, ClaimModule> = {
  age: { circuitId: "age_v2", inputs: buildAgeInputs },
  student: { circuitId: "student_v1", inputs: buildStudentInputs },
}
```

### Pattern 3: Proof Bundle Envelope

**What:** Standardize a proof bundle format that supports multiple claims and versioned public signals.
**When to use:** When relay verifies multiple proofs or mixed claim sets in one session.
**Trade-offs:** Adds schema versioning needs, but avoids per-claim custom parsing.

**Example:**
```typescript
type ProofBundle = {
  version: "1"
  claims: Array<{ claimId: string; circuitId: string; proof: string; publicSignals: string[] }>
}
```

## Data Flow

### Request Flow

```
Verifier UI (GH Pages)
    ↓ (SDK: POST /sessions)
Relay API (Render) → Session/Policy Service → Supabase
    ↓
QR payload → Wallet scanner → Approve screen
    ↓ (Keystore unlock + claim selection)
ZK Engine → Proof bundle → Relay API (POST /sessions/:id/proof)
    ↓
Relay verifies bundle → Session status update → SDK poll sees COMPLETED
```

### State Management

```
Wallet Store
    ↓ (rehydrate)
Screens ←→ Actions → Storage Adapter (AsyncStorage / SecureStore / Keystore)
```

### Key Data Flows

1. **Session creation:** SDK sends policy (required claims, circuit IDs) to relay; relay persists in Supabase.
2. **Proof bundle build:** Wallet maps policy to claim modules, generates proofs per claim, builds bundle.
3. **Verification:** Relay verifies each claim against the policy, aggregates status, persists audit.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single relay on Render; Supabase default pool; circuits bundled. |
| 1k-100k users | Add verification worker queue; cache circuit assets; increase body limits/timeouts. |
| 100k+ users | Separate verifier service; CDN-hosted circuits; regional relay replicas. |

### Scaling Priorities

1. **First bottleneck:** Relay verification CPU and request timeouts; add worker queue + timeouts.
2. **Second bottleneck:** Circuit asset distribution and mobile memory; move assets to CDN + cache.

## Anti-Patterns

### Anti-Pattern 1: Embedding Proof Policy in UI Only

**What people do:** Verifier UI decides required claims but relay does not enforce policy.
**Why it's wrong:** Proof validation becomes client-trust based; weak security.
**Do this instead:** Relay stores policy and verifies against it before session completion.

### Anti-Pattern 2: Mixing Mock and Real ZK Paths

**What people do:** Allow mock proof paths in production endpoints.
**Why it's wrong:** Hard to audit and can leak into production flows.
**Do this instead:** Explicit environment gating and separate mock endpoints or flags.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Render | Relay hosting + environment config | Use fixed base URL for SDK; no localhost dependencies. |
| Supabase | Postgres + service role | Store sessions, audit logs, rate limits; use RPC for verification writes. |
| GitHub Pages | Static demo site | Public verifier UI uses SDK with production relay URL. |
| Object Storage/CDN | Circuit distribution | Optional if circuits outgrow app bundle size. |
| Android Keystore | Native module + JS adapter | Secure key storage + reset flows. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Verifier UI ↔ SDK | Direct import | SDK handles base URL, polling, policy schema. |
| SDK ↔ Relay | HTTP (JSON) | Typed policy and proof bundle schema; size-aware transport. |
| Wallet UI ↔ Claim Registry | Direct module calls | Maps policy to claim modules and circuits. |
| Wallet UI ↔ ZK Engine | WebView bridge | Handles larger proof bundles and retries. |
| Relay ↔ Supabase | DB client | Persist sessions and verification audit. |

## Component Change Matrix

| Component | New | Modified | Notes |
|-----------|-----|----------|-------|
| Claim registry (wallet) | Yes | — | Supports modular multi-claim proof generation. |
| Proof bundle schema | Yes | — | Versioned payload for multi-claim proofs. |
| Policy service (relay) | Yes | — | Stores/enforces claim requirements per session. |
| Supabase storage layer | Yes | — | Replaces local/ephemeral session store. |
| Relay verification path | — | Yes | Real ZK verification using verification keys. |
| SDK config layer | — | Yes | Environment + base URL config (Render). |
| Demo site (GH Pages) | — | Yes | Uses production relay + real ZK. |
| Wallet key management | — | Yes | Hardening encryption/reset behavior. |

## Build Order (Dependency-Aware)

1. **Define proof bundle schema + claim registry** in wallet and SDK types.
2. **Add policy service in relay** with storage layer targeting Supabase.
3. **Wire SDK config** to point to Render relay and emit policy schemas.
4. **Integrate real ZK verifier** in relay with verification keys and circuit IDs.
5. **Update wallet ZK engine** to build multi-claim proof bundles.
6. **Deploy demo site** to GitHub Pages with production endpoints.

## Sources

- Internal codebase architecture notes: `.planning/codebase/ARCHITECTURE.md`
- Integration audit: `.planning/codebase/INTEGRATIONS.md`
- Project context (milestone brief, no external docs consulted)

---
*Architecture research for: ZeroAuth production hardening integration*
*Researched: 2026-02-21*
