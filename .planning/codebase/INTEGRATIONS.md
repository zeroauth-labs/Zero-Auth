# External Integrations

**Analysis Date:** 2026-02-18

## APIs & External Services

**Relay API:**
- `Zero Auth Relay` orchestrates every verification session. The SDK (`zero-auth-sdk/src/index.ts`) calls `POST /api/v1/sessions` to create `session_id`/`qr_payload`, polls `GET /api/v1/sessions/:id` for status updates, and logs to console on failure/success. The wallet (`zero-auth-wallet/app/approve-request.tsx`) POSTs the Groth16 payload to `POST /api/v1/sessions/:id/proof`, which `zero-auth-relay/src/index.ts` consumes, validates via `ProofPayloadSchema`, and forwards to `SessionService.verifySessionProof` to run `snarkjs` with `zero-auth-relay/circuits/*`.
  - SDK requests include `ngrok-skip-browser-warning` and `bypass-tunnel-reminder` headers inside `fetchWithHeaders` (`zero-auth-sdk/src/index.ts`) to keep tunnels alive.

**QR Rendering Service:**
- The SDK demo (`zero-auth-sdk/examples/basic/src/main.ts`) turns the Relay-provided JSON QR payload into an image by calling `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=<payload>`. This is purely client-side rendering for the browser example.

**Development Tunnels:**
- Ngrok (and compatible services such as localtunnel) are required to expose the relay’s `PUBLIC_URL`—the README (`README.md`) instructs developers to run `ngrok http 3000` and plumb the forwarding URL into `zero-auth-relay/.env` plus `zero-auth-sdk/examples/basic/src/main.ts`. The relay’s `resolveCallbackUrl` (`zero-auth-relay/src/lib/network.ts`) gives precedence to `PUBLIC_URL`, falling back to LAN IP when running on `localhost`.

## Data Storage

**Databases:**
- Redis (connection string from `REDIS_URL`) backs the ephemeral `SessionStore` implemented in `zero-auth-relay/src/lib/redis.ts`. Every session creation/verification/revocation uses `SessionStore.set/get/delete`, storing JSON with a 5-minute TTL before `setEx` expires it.

**File Storage:**
- ZK artifacts for verification live under `zero-auth-relay/circuits` (`age_check_vKey.json`, `student_check_vKey.json`) and `zero-auth-wallet/circuits` (`*.wasm`, `*.zkey`, `*.sym`). `zero-auth-wallet/app.json` bundles these assets (`assetBundlePatterns`) so the wallet can load them during proof generation.

**Caching:**
- `zero-auth-wallet/lib/proof.ts` caches Base64-encoded `.wasm`/`.zkey` blobs per credential type in `assetCache` to avoid re-reading circuit assets on every verification.

## Authentication & Identity

**Auth Provider:**
- The wallet owns a locally generated Ed25519 keypair derived into a `did:key` (see `zero-auth-wallet/lib/wallet.ts`). The private key and salts for each credential live in `expo-secure-store`, and biometric gating via `expo-local-authentication` occurs inside `zero-auth-wallet/app/approve-request.tsx` before proofs are generated.
- The relay advertises its DID via `RELAY_DID` from `zero-auth-relay/.env.example` (validated in `zero-auth-relay/src/config.ts`), and includes that DID, along with the callback URL, inside every `qr_payload` created by `SessionService.createSession`.
- The SDK passes a `verifierName`, `requiredClaims`, and optional `credentialType` into `POST /api/v1/sessions`, which drives verification flow states (`Session` type in `zero-auth-sdk/src/types.ts`).

## Monitoring & Observability

**Error Tracking:**
- Relay errors/exceptions are surfaced through `pino` logging at `zero-auth-relay/src/index.ts` (incoming request logging) and `zero-auth-relay/src/services/session.service.ts` (`logger.info`/`logger.warn`/`logger.error`). Wallet and SDK errors are primarily surfaced via `console` logs within `zero-auth-wallet/components/ZKEngine.tsx` and `zero-auth-sdk/src/index.ts`.

**Logs:**
- `zero-auth-relay/src/index.ts` logs every HTTP request and rate-limit hits, and `SessionService` logs session creation/verification/revocation events. The `Math.random`-id based logs shown in `components/ZKEngine.tsx` help trace proof requests inside the embedded WebView.

## CI/CD & Deployment

**Hosting:**
- The relay is a Node.js/Express service (`zero-auth-relay/src/index.ts`) that can run wherever Node has access to Redis; the wallet is built/deployed via Expo/EAS (`zero-auth-wallet/eas.json`, `zero-auth-wallet/app.json`), targeting Android/iOS with bundled circuits; the SDK is packaged via `tsc` (`zero-auth-sdk/package.json`) and its demo runs under Vite (`zero-auth-sdk/examples/basic/src/main.ts`).

**CI Pipeline:**
- None defined; developers follow `README.md` steps and use `npm run dev:all` (root `package.json`) plus `npx expo start`/`npm run build` to verify each service manually.

## Environment Configuration

**Required env vars:**
- `PORT`, `NODE_ENV`, `REDIS_URL`, `RELAY_DID`, `LOG_LEVEL`, and optional `PUBLIC_URL` are listed in `zero-auth-relay/.env.example` and validated by `zero-auth-relay/src/config.ts`. `PUBLIC_URL` toggles ngrok/localtunnel callback logic inside `zero-auth-relay/src/lib/network.ts`.

**Secrets location:**
- The wallet keeps its Ed25519 private key plus credential salts in `expo-secure-store` (`zero-auth-wallet/lib/wallet.ts`, `zero-auth-wallet/store/auth-store.ts`). The relay keeps only `REDIS_URL`/Redis credentials in environment variables.

## Webhooks & Callbacks

**Incoming:**
- Wallet submissions land on `POST /api/v1/sessions/:id/proof` (`zero-auth-relay/src/index.ts`), where `ProofPayloadSchema` enforces snark inputs before `SessionService.verifySessionProof` verifies with `snarkjs`. The SDK polls `GET /api/v1/sessions/:id` inside `zero-auth-sdk/src/index.ts` to detect status transitions (PENDING → COMPLETED/EXPIRED/REVOKED).

**Outgoing:**
- Each `qr_payload` includes `verifier.callback` assembled by `resolveCallbackUrl` (`zero-auth-relay/src/lib/network.ts`); the wallet sends the proof to that URL via `fetch` inside `zero-auth-wallet/app/approve-request.tsx` and records the session in `store/auth-store.ts`. When the user taps “End session,” `store/auth-store.ts` triggers `DELETE /api/v1/sessions/:id` on the relay to mark the session `REVOKED`.

---

*Integration audit: 2026-02-18*
