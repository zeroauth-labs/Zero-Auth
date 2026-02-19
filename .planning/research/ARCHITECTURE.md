# Architecture Research

**Domain:** ZK credential wallet + relay + SDK verification platform
**Researched:** 2026-02-19
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Client / Verifier Layer                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐     ┌──────────────────────┐                         │
│  │ Verifier UI (web)  │<───>│ zero-auth-sdk (TS)   │                         │
│  └────────────────────┘     └──────────┬───────────┘                         │
│                                        │                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                             Relay / Session Layer                             │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐     ┌──────────────────────┐                         │
│  │ Relay API (HTTP)   │<───>│ Session Service      │                         │
│  └────────────────────┘     └──────────┬───────────┘                         │
│                                        │                                     │
│                                ┌───────▼────────┐                            │
│                                │ Redis Session  │                            │
│                                │ Store          │                            │
│                                └────────────────┘                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                          Wallet / Proof Generation Layer                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐     ┌──────────────────────┐                         │
│  │ Wallet UI (Expo)   │<───>│ ZK Engine (WebView)  │                         │
│  └──────────┬─────────┘     └──────────┬───────────┘                         │
│             │                            │                                    │
│  ┌──────────▼─────────┐     ┌───────────▼───────────┐                         │
│  │ Key Mgmt Adapter   │     │ Circuit Assets        │                         │
│  │ (Keystore/SStore)  │     │ (.wasm/.zkey/.json)   │                         │
│  └────────────────────┘     └───────────────────────┘                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Wallet UI | Scan QR, prompt user, orchestrate proof creation, submit proof | Expo Router + React Native screens/stores |
| ZK Engine Bridge | Execute SnarkJS/Poseidon in isolated WebView, return proofs | WebView bridge + injected bundles |
| Key Mgmt Adapter | Hold DID/Ed25519 keys, sign, and gate access | Android Keystore-backed module with JS fallback |
| Relay API | Create sessions, accept proofs, enforce schemas | Express + Zod |
| Session Service | Session lifecycle and proof verification | Service class + verifier helpers |
| SDK | Standard verifier handshake, polling, cancellation | TS client with fetch |
| Redis Store | Ephemeral session state | Redis TTL keys |

## Recommended Project Structure

```
zero-auth-wallet/
├── lib/
│   ├── keys/                  # Key management interfaces + platform adapters
│   │   ├── index.ts            # Exported key API used by wallet screens
│   │   ├── keystore.android.ts # Android Keystore implementation
│   │   ├── securestore.ts      # Expo SecureStore fallback
│   │   └── types.ts            # Key types + errors
│   ├── proof/                 # Proof orchestration, circuit registry, payload shaping
│   │   ├── index.ts
│   │   ├── circuits.ts         # Circuit registry and asset lookup
│   │   └── payload.ts          # Proof payload normalization
│   └── transport/             # Relay request helpers + size-aware fetch
│       └── relay.ts
├── components/
│   └── ZKEngine.tsx            # WebView bridge (unchanged, may extend for large payloads)
├── circuits/                   # Compiled circuit artifacts
└── assets/                     # Bundled circuit assets

zero-auth-sdk/
├── src/
│   ├── index.ts                # ZeroAuth class (stable API)
│   ├── transport.ts            # Request helpers, size/timeouts
│   └── types.ts                # Shared payload/type definitions
└── examples/

zero-auth-relay/
├── src/
│   ├── index.ts                # Express routes + body limits
│   ├── services/
│   │   └── session.service.ts
│   └── lib/
│       ├── verifier.ts         # SnarkJS verification
│       └── storage.ts          # Redis session store
└── circuits/                   # Verification keys
```

### Structure Rationale

- **`zero-auth-wallet/lib/keys/`:** isolates Keystore integration behind a JS interface so APK parity can be achieved without rewriting screens.
- **`zero-auth-wallet/lib/proof/`:** centralizes circuit selection and payload shaping to support larger circuits while keeping the UI thin.

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

### Pattern 2: Circuit Registry + Asset Cache

**What:** Register circuits by credential type and maintain an asset cache keyed by circuit ID.
**When to use:** When proof sizes grow and multiple circuit variants exist.
**Trade-offs:** More bookkeeping, but enables reuse and size-aware loading.

**Example:**
```typescript
const circuits: Record<string, CircuitDef> = {
  age: { wasm: "age_check.wasm", zkey: "age_check.zkey" },
  student: { wasm: "student_check.wasm", zkey: "student_check.zkey" },
}
```

### Pattern 3: Size-Aware Transport

**What:** Standardize a request helper that sets timeouts and size limits for large proof payloads.
**When to use:** When proof payloads can exceed default JSON/body limits in mobile or relay.
**Trade-offs:** Requires adjustments in both wallet and relay, but prevents silent truncation.

## Data Flow

### Request Flow

```
Verifier UI
    ↓ (SDK: POST /sessions)
Relay API → Session Service → Redis
    ↓
QR payload → Wallet scanner → Approve screen
    ↓ (Keystore unlock)
ZK Engine → Proof payload → Relay API (POST /sessions/:id/proof)
    ↓
Relay verifies → Session status update → SDK poll sees COMPLETED
```

### State Management

```
Wallet Store
    ↓ (rehydrate)
Screens ←→ Actions → Storage Adapter (AsyncStorage / SecureStore / Keystore)
```

### Key Data Flows

1. **Session creation:** Verifier UI uses SDK to create sessions and render QR payloads.
2. **Proof submission:** Wallet signs/derives inputs, generates proof in WebView, submits to relay.
3. **Session completion:** Relay updates status; SDK polls for result.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Relay + Redis monolith; static circuits in repo. |
| 1k-100k users | Increase relay body limits, add streaming/longer timeouts, cache circuit assets in wallet. |
| 100k+ users | Dedicated proof verification worker or queue; circuit assets CDN. |

### Scaling Priorities

1. **First bottleneck:** Proof payload size and WebView memory; fix via circuit registry + caching.
2. **Second bottleneck:** Relay JSON body size/timeouts; fix via size-aware transport + increased limits.

## Anti-Patterns

### Anti-Pattern 1: Hard-coding SecureStore in UI

**What people do:** Screens call SecureStore directly for keys/salts.
**Why it's wrong:** Blocks Keystore migration and APK parity.
**Do this instead:** Route all key access through `lib/keys` adapter.

### Anti-Pattern 2: Duplicating Proof Logic in Screens

**What people do:** Each screen assembles circuit paths/payloads ad hoc.
**Why it's wrong:** Breaks when circuits change or payload sizes grow.
**Do this instead:** Centralize in `lib/proof` with a registry.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Android Keystore | Native module + JS adapter | Must support fallback for parity; secure storage for private keys. |
| Redis | Relay session store | TTL-based session lifecycle. |
| QR renderer (demo) | Client-side API call | Not required for wallet; SDK example only. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Wallet UI ↔ Key Mgmt Adapter | Direct module calls | Keep UI stable; swap implementation by platform. |
| Wallet UI ↔ ZK Engine | WebView bridge | Increase payload limits, avoid blocking UI thread. |
| Wallet ↔ Relay | HTTP (JSON) | Ensure body limits/timeouts for larger proofs. |
| SDK ↔ Relay | HTTP (JSON) | Backward compatible types and polling behavior. |

## Component Change Matrix

| Component | New | Modified | Notes |
|-----------|-----|----------|-------|
| Key Mgmt Adapter (`lib/keys`) | Yes | — | New abstraction for Keystore + fallback. |
| Android Keystore module | Yes | — | Native implementation for APK parity. |
| Wallet screens | — | Yes | Replace direct SecureStore calls with adapter. |
| ZK Engine bridge | — | Yes | Handle larger circuit payloads and timeouts. |
| Proof orchestration (`lib/proof`) | — | Yes | Circuit registry + caching for large circuits. |
| Relay API | — | Yes | Increase body size/timeout and error reporting. |
| SDK transport/types | — | Yes | Ensure large payload handling and backward compatibility. |

## Build Order (Non-Disruptive)

1. **Define key adapter interfaces** in wallet and wire SecureStore as default.
2. **Implement Android Keystore module** and switch adapter selection on Android.
3. **Move proof orchestration into registry** and update screens to call the new API.
4. **Extend ZK bridge** to handle large payloads/timeouts with cache reuse.
5. **Update relay body limits and verification path** for larger proof sizes.
6. **Update SDK transport/types** to remain backward compatible.

## Sources

- Internal codebase architecture notes: `.planning/codebase/ARCHITECTURE.md`
- Integration audit: `.planning/codebase/INTEGRATIONS.md`

---
*Architecture research for: ZeroAuth wallet/relay/SDK integration*
*Researched: 2026-02-19*
