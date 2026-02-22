# Architecture

**Analysis Date:** 2026-02-21

## Pattern Overview

**Overall:** Monorepo with a mobile client (Expo Router) and a Node/Express relay service.

**Key Characteristics:**
- Route-as-file UI with Expo Router for mobile screens.
- Thin relay API with in-memory session store for proofs.
- ZK proof generation isolated in a hidden WebView bridge.

## Layers

**UI Screens (Wallet):**
- Purpose: User flows, navigation, and UX for scanning, credential management, and approvals.
- Location: `zero-auth-wallet/app/`
- Contains: Expo Router routes, screen components, and layout definitions.
- Depends on: `zero-auth-wallet/lib/`, `zero-auth-wallet/store/`, `zero-auth-wallet/components/`
- Used by: Expo Router entry (`expo-router/entry` via `zero-auth-wallet/package.json`)

**State Management (Wallet):**
- Purpose: Persisted app state for sessions, credentials, notifications, and wallet status.
- Location: `zero-auth-wallet/store/`
- Contains: Zustand stores with persistence middleware and SecureStore helpers.
- Depends on: `zero-auth-wallet/lib/storage.ts`, `zero-auth-wallet/lib/wallet.ts`
- Used by: UI screens and app layout (`zero-auth-wallet/app/_layout.tsx`)

**Domain Logic (Wallet):**
- Purpose: ZK proof creation, QR parsing, identity management, revocation checks, offline queueing.
- Location: `zero-auth-wallet/lib/`
- Contains: Proof generation, hashing/commitment, protocol parsing, storage adapters.
- Depends on: Expo APIs (SecureStore, Asset, FileSystem), ZK bridge in `zero-auth-wallet/components/ZKEngine.tsx`.
- Used by: Screens like `zero-auth-wallet/app/approve-request.tsx`, `zero-auth-wallet/app/(tabs)/scanner.tsx`, `zero-auth-wallet/app/add-credential/verify.tsx`.

**ZK Engine Bridge (Wallet):**
- Purpose: Run SnarkJS/Poseidon in an isolated WebView and expose a Promise-based bridge.
- Location: `zero-auth-wallet/components/ZKEngine.tsx`
- Contains: Hidden WebView, script injection, request/response bridge, timeout handling.
- Depends on: `zero-auth-wallet/assets/`, `zero-auth-wallet/lib/zk-bridge-types.ts`
- Used by: Proof and commitment logic in `zero-auth-wallet/lib/proof.ts` and `zero-auth-wallet/lib/hashing.ts`.

**Relay API (Server):**
- Purpose: Create verification sessions and accept proof submissions.
- Location: `zero-auth-relay/dist/index.js`
- Contains: Express app, in-memory session store, CORS, JSON handling.
- Depends on: Express middleware, UUID.
- Used by: Wallet proof submission (`zero-auth-wallet/app/approve-request.tsx`).

## Data Flow

**Verification (QR -> Proof -> Relay):**

1. QR scanned in `zero-auth-wallet/app/(tabs)/scanner.tsx`.
2. QR payload parsed in `zero-auth-wallet/lib/qr-protocol.ts`.
3. User approves in `zero-auth-wallet/app/approve-request.tsx`.
4. Proof inputs prepared and proof generated via `zero-auth-wallet/lib/proof.ts`.
5. ZK proof executed in WebView bridge `zero-auth-wallet/components/ZKEngine.tsx`.
6. Proof submitted to relay callback in `zero-auth-wallet/app/approve-request.tsx`.
7. Relay stores proof and updates session in `zero-auth-relay/dist/index.js`.

**Credential Issuance (Local Add Flow):**

1. Add flow launched via `zero-auth-wallet/app/add-credential/index.tsx`.
2. Credential verification flow in `zero-auth-wallet/app/add-credential/verify.tsx`.
3. Commitments generated via `zero-auth-wallet/lib/hashing.ts` and ZK bridge.
4. Salt stored in SecureStore, credential stored in Zustand via `zero-auth-wallet/store/auth-store.ts`.

**Wallet Initialization:**

1. App bootstraps in `zero-auth-wallet/app/_layout.tsx`.
2. Wallet identity loaded or generated via `zero-auth-wallet/lib/wallet.ts`.
3. State persisted via `zero-auth-wallet/store/wallet-store.ts` and `zero-auth-wallet/lib/storage.ts`.

**State Management:**
- Global state uses Zustand with AsyncStorage persistence in `zero-auth-wallet/store/auth-store.ts`.
- Secure key material stored via Expo SecureStore in `zero-auth-wallet/lib/wallet.ts`.

## Key Abstractions

**ZK Engine:**
- Purpose: Abstracts proof generation and hashing into a WebView execution environment.
- Examples: `zero-auth-wallet/components/ZKEngine.tsx`, `zero-auth-wallet/lib/hashing.ts`, `zero-auth-wallet/lib/proof.ts`.
- Pattern: Context provider with Promise-based execution bridge.

**Credential Model:**
- Purpose: Represents local credentials, commitments, and verification metadata.
- Examples: `zero-auth-wallet/store/auth-store.ts`.
- Pattern: Plain object model stored in Zustand with persistence.

**Verification Request:**
- Purpose: Protocol payload scanned from QR and used to drive proof creation.
- Examples: `zero-auth-wallet/lib/qr-protocol.ts`.
- Pattern: JSON-encoded protocol object validated at parse time.

## Entry Points

**Wallet App Entry:**
- Location: `zero-auth-wallet/app/_layout.tsx`
- Triggers: Expo Router initialization via `expo-router/entry` in `zero-auth-wallet/package.json`.
- Responsibilities: Polyfills, state hydration checks, initial routing.

**Wallet Tabs Layout:**
- Location: `zero-auth-wallet/app/(tabs)/_layout.tsx`
- Triggers: Expo Router route group.
- Responsibilities: Tab navigation, styling, and icon setup.

**Relay Server Entry:**
- Location: `zero-auth-relay/dist/index.js`
- Triggers: Node process start.
- Responsibilities: Session creation, retrieval, and proof submission endpoints.

## Error Handling

**Strategy:** Console logging with user-facing alerts in UI; HTTP errors returned as JSON.

**Patterns:**
- Express returns JSON errors in `zero-auth-relay/dist/index.js`.
- UI uses alerts and status flags in `zero-auth-wallet/app/approve-request.tsx`.
- WebView bridge logs and rejects requests in `zero-auth-wallet/components/ZKEngine.tsx`.

## Cross-Cutting Concerns

**Logging:** Console logging in UI and WebView bridge via `console.log` in `zero-auth-wallet/components/ZKEngine.tsx` and screens.
**Validation:** QR payload validation in `zero-auth-wallet/lib/qr-protocol.ts`.
**Authentication:** Biometric gate before proof generation in `zero-auth-wallet/app/approve-request.tsx`.

---

*Architecture analysis: 2026-02-21*
