# Architecture

**Analysis Date:** 2026-02-18

## Pattern Overview

**Overall:** Modular polyrepo with a dedicated relay API, a minimal HTTP SDK, and an Expo wallet that drives proof generation through a WebView-based ZK engine.

**Key Characteristics:**
- The relay (`zero-auth-relay/src/index.ts`) stands up an Express app with CORS, rate limiting, Zod schemas, and `SessionService` business logic that persists session state in Redis via `zero-auth-relay/src/lib/redis.ts`.
- The SDK (`zero-auth-sdk/src/index.ts`) exposes `ZeroAuth.verify(...)` to create sessions, emit QR payloads, poll `GET /api/v1/sessions/:id`, and cancel flows, keeping payload types in `zero-auth-sdk/src/types.ts`.
- The wallet entry (`zero-auth-wallet/app/_layout.tsx`) wires `expo-router`, `ZKProvider`, and persisted Zustand stores so screens under `zero-auth-wallet/app/` can drive verification, credential management, and notifications.

## Layers

**Relay API Layer:**
- Purpose: Host session lifecycle endpoints (`/api/v1/sessions`, proof submission, health) for verifiers.
- Location: `zero-auth-relay/src`
- Contains: `zero-auth-relay/src/index.ts` (Express routes), `zero-auth-relay/src/services/session.service.ts`, `zero-auth-relay/src/config.ts`, and helpers under `zero-auth-relay/src/lib/`.
- Depends on: `zero-auth-relay/src/lib/network.ts` for callback URL resolution, `zero-auth-relay/src/lib/verifier.ts` for ZK proof validation, and `zero-auth-relay/src/lib/redis.ts` for storage.
- Used by: Clients built with `zero-auth-sdk/src/index.ts`, the Expo wallet, and any external verifier that POSTs QR payloads.

**SDK Orchestration Layer:**
- Purpose: Package the relay handshake into a consumable TypeScript class, handle polling, and expose shared type definitions.
- Location: `zero-auth-sdk/src`
- Contains: `ZeroAuth` class and `types.ts` describing `Session`, `QRData`, `VerifyOptions`, and ZK proof structures.
- Depends on: `fetch` and runtime helpers; it sanitizes relay URLs (`relayUrl.replace(/\/$/, '')`) and ensures tunnel headers before each request.
- Used by: Any consumer (e.g., `zero-auth-sdk/examples/basic/src`) that needs to build a verifier-facing UI without re-implementing session polling.

**Wallet UI & State Layer:**
- Purpose: Provide onboarding, dashboard, credential issuance, scanning, and settings flows for the mobile wallet.
- Location: `zero-auth-wallet/app`, with shared assets under `zero-auth-wallet/components`, `zero-auth-wallet/hooks`, and `zero-auth-wallet/store`.
- Contains: Route files such as `zero-auth-wallet/app/(tabs)/index.tsx`, `zero-auth-wallet/app/approve-request.tsx`, `zero-auth-wallet/app/add-credential/*`, and `zero-auth-wallet/app/settings.tsx`, plus stores `zero-auth-wallet/store/auth-store.ts` and `zero-auth-wallet/store/wallet-store.ts`.
- Depends on: `zero-auth-wallet/lib/*` for hashing, proof preparation, QR parsing, wallet keys, and `expo-router` for navigation.
- Used by: The Expo runtime via `app/_layout.tsx`; UI components such as `zero-auth-wallet/components/SessionCard.tsx` and `NotificationModal.tsx` consume these stores to render sessions/notifications.

**ZK Bridge & Storage Layer:**
- Purpose: Load SnarkJS/Poseidon bundles inside an invisible WebView, expose `execute()` and resolve promises, and prepare circuit inputs.
- Location: `zero-auth-wallet/components/ZKEngine.tsx` and helper modules under `zero-auth-wallet/lib` (`proof.ts`, `zk-bridge-types.ts`, `hashing.ts`).
- Contains: A `ZKProvider` context that injects polyfills and assets, an in-memory cache for circuit binaries, and the `generateProof()` workflow that talks to the bridge.
- Depends on: Bundled assets `zero-auth-wallet/assets/snarkjs.bundle`, `zero-auth-wallet/assets/poseidon.bundle`, and compiled circuits under `zero-auth-wallet/circuits/`.
- Used by: `zero-auth-wallet/app/approve-request.tsx` and `zero-auth-wallet/app/add-credential/verify.tsx` when building and submitting proofs to the relay.

## Data Flow

**Session verification flow:**
1. The wallet scanner (`zero-auth-wallet/app/(tabs)/scanner.tsx`) parses the QR payload via `zero-auth-wallet/lib/qr-protocol.ts` and navigates to `zero-auth-wallet/app/approve-request.tsx`.
2. `approve-request.tsx` authenticates the user, selects a credential from `zero-auth-wallet/store/auth-store.ts`, retrieves its salt from `expo-secure-store`, and calls `generateProof()` from `zero-auth-wallet/lib/proof.ts`.
3. `generateProof()` uses `useZKEngine()` (context from `zero-auth-wallet/components/ZKEngine.tsx`) to inject SnarkJS/Poseidon, read the cached `.wasm`/`.zkey` from `zero-auth-wallet/circuits/`, and produce a `ZKProofPayload`.
4. The proof is POSTed to `request.verifier.callback` (built by `zero-auth-relay/src/lib/network.ts` when the relay created the session) at `/api/v1/sessions/:id/proof`, where `zero-auth-relay/src/index.ts` delegates to `SessionService.verifySessionProof()`.
5. `SessionService` loads the session via `SessionStore` (`zero-auth-relay/src/lib/redis.ts`), runs `verifyProof()` (`zero-auth-relay/src/lib/verifier.ts`), updates the status, and the SDK/wallet polls `GET /api/v1/sessions/:id` until it observes `COMPLETED`.
6. Upon success, `approve-request.tsx` adds the session to `useAuthStore` history (`zero-auth-wallet/store/auth-store.ts`), which persists through `zero-auth-wallet/lib/storage.ts`.

**Wallet initialization & state hydration:**
1. `app/_layout.tsx` calls `useWalletStore.checkInitialization()` (`zero-auth-wallet/store/wallet-store.ts`), which checks `expo-secure-store` for the private key via `zero-auth-wallet/lib/wallet.ts`.
2. The Zustand `auth-store` persists sessions, credentials, and notifications in AsyncStorage through the adapter in `zero-auth-wallet/lib/storage.ts`, setting `_hasHydrated` after rehydration.
3. Once both stores are ready, the router either shows the onboarding stack (`zero-auth-wallet/app/onboarding.tsx`) or replaces it with the `(tabs)` group that drives dashboards, credentials, and scanner flows.

**State Management:**
- `useWalletStore` guards private key generation, toggles `isInitialized`, and surfaces the wallet DID/hash (`zero-auth-wallet/store/wallet-store.ts`).
- `useAuthStore` reshuffles sessions/notifications, seeds demo credentials, and supports revocation/sharing; its actions mutate `sessions`, `history`, `credentials`, and `notifications` arrays while keeping UI in sync (`zero-auth-wallet/store/auth-store.ts`).

## Key Abstractions

**`SessionService`** (`zero-auth-relay/src/services/session.service.ts`)
- Purpose: Central class that creates sessions with UUIDs, stores them via `SessionStore`, assembles QR payloads, verifies proofs using `verifyProof()`, and updates session status.
- Pattern: Static singleton with helper methods consumed by Express routes to enforce shared logic.

**`ZeroAuth` class** (`zero-auth-sdk/src/index.ts`)
- Purpose: Wraps the relay handshake (`POST /sessions`, `GET /sessions/:id`, timeout cancellation) and exposes `onQR` callbacks for UI updates.
- Pattern: Instance stores a default relay URL, sanitizes trailing slashes, polls every 2s, and exposes a cancel handle appended to the returned promise.

**`ZKProvider` / `useZKEngine`** (`zero-auth-wallet/components/ZKEngine.tsx`)
- Purpose: Bootstraps a hidden `WebView`, injects SnarkJS/Poseidon bundles via `injectJavaScript`, and resolves `BridgeResponse` promises so the React Native layer can `execute('GENERATE_PROOF', ...)`.
- Pattern: Context + resolver map keyed by request IDs, 45s timeouts, and status flags (`initializing`, `ready`, `proving`).

**`generateProof()`** (`zero-auth-wallet/lib/proof.ts`)
- Purpose: Prepares circuit inputs based on credential type (age or student), caches `.wasm`/`.zkey` blobs, logs the job, and forwards them to the ZK bridge for proof construction.
- Pattern: Branching logic per `credential_type`, caching assets, and forwarding `pi_*` + `publicSignals` shaped to the relay’s expectations.

**Zustand stores** (`zero-auth-wallet/store/auth-store.ts` & `zero-auth-wallet/store/wallet-store.ts`)
- Purpose: Persist sessions/credentials/notifications and wallet keys while exposing actions (e.g., `addSession`, `seedDemoData`, `initializeWallet`).
- Pattern: `persist()` + `createJSONStorage(() => zustandStorage)` with partialization to avoid internal flags, plus `SecureStore` touches (salts/private keys).

## Entry Points

**`zero-auth-relay/src/index.ts`**
- Starts the Express app, wires middleware (CORS, JSON, logging with `pino`, rate limiting), and defines `/api/v1/sessions` routes plus `/health`.
- Triggers `SessionService` operations and logs incoming requests.

**`zero-auth-sdk/src/index.ts`**
- Exposes the `ZeroAuth` library entry that consumers import to kick off verification flows and handles timeout/polling.

**`zero-auth-wallet/app/_layout.tsx`**
- Expo router root that polyfills browser APIs, prevents splash screen auto-hide, waits for stores, wraps screens in `ZKProvider`, and routes to onboarding or `(tabs)` stacks.

**`zero-auth-wallet/app/(tabs)/_layout.tsx`**
- Defines the tab bar (Dashboard, History, Scan, Credentials, Settings) with custom styling so wallet features can plug screens under `app/(tabs)`.

## Error Handling

**Strategy:** Use `try/catch` at every boundary, log errors, and surface user-friendly messages while keeping status codes consistent.

**Patterns:**
- Relay routes wrap `CreateSessionSchema` and `ProofPayloadSchema` parsing in `try/catch` blocks and reply with `400` + error message if validation fails (`zero-auth-relay/src/index.ts`).
- `SessionService.verifySessionProof` throws for missing/duplicate sessions and logs `pino` warnings when `verifyProof()` rejects (`zero-auth-relay/src/services/session.service.ts`).
- Wallet screens (`zero-auth-wallet/app/approve-request.tsx`) catch proof or network failures, show alerts, and toggle loading flags.

## Cross-Cutting Concerns

**Logging:** Relay uses `pino` (`zero-auth-relay/src/index.ts` & `services/session.service.ts`), while the wallet relies on `console.log`/`console.warn` and `NotificationModal` updates to surface statuses.

**Validation:** Inputs are guarded by `zod` schemas for each endpoint (`zero-auth-relay/src/index.ts`) and `parseVerificationQR` in `zero-auth-wallet/lib/qr-protocol.ts`.

**Authentication:** Wallet identities derive DIDs via `zero-auth-wallet/lib/wallet.ts` (Ed25519 keypair stored in `expo-secure-store`); proof submissions include the verifier DID/callback that the relay keys maintain.

---

*Architecture analysis: 2026-02-18*
