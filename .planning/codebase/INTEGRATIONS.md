# External Integrations

**Analysis Date:** 2026-02-21

## APIs & External Services

**Verification Relay API:**
- Zero Auth Relay HTTP endpoints for sessions/proofs - `zero-auth-relay/dist/index.js`
  - SDK/Client: `fetch` in wallet proof submission - `zero-auth-wallet/app/approve-request.tsx`
  - Auth: None (open relay API in `zero-auth-relay/dist/index.js`)

**Verifier Callbacks:**
- Proof callback URLs embedded in QR payloads - `zero-auth-relay/dist/index.js`
  - SDK/Client: `fetch` to `request.verifier.callback` - `zero-auth-wallet/app/approve-request.tsx`
- Demo verifier endpoint `https://demo.zeroauth.app/verify` - `zero-auth-wallet/scripts/generate-qr.ts`

## Data Storage

**Databases:**
- None (relay sessions stored in-memory `Map`) - `zero-auth-relay/dist/index.js`

**File Storage:**
- Local device filesystem for ZK assets (WASM/ZKEY bundles) - `zero-auth-wallet/lib/proof.ts`

**Caching:**
- In-memory cache for circuit assets - `zero-auth-wallet/lib/proof.ts`
- Offline queue persisted in AsyncStorage - `zero-auth-wallet/lib/offline.ts`

## Authentication & Identity

**Auth Provider:**
- Device biometrics via Expo LocalAuthentication - `zero-auth-wallet/app/approve-request.tsx`
- Local DID/key generation using Ed25519 + SecureStore - `zero-auth-wallet/lib/wallet.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected (console logging only) - `zero-auth-relay/dist/index.js`

**Logs:**
- Console logs in relay and wallet flows - `zero-auth-relay/dist/index.js`

## CI/CD & Deployment

**Hosting:**
- Not specified for relay (no deploy config in `.`)

**CI Pipeline:**
- None detected (no CI config in `.`)

## Environment Configuration

**Required env vars:**
- PUBLIC_URL, NODE_ENV, PORT - `zero-auth-relay/.env`

**Secrets location:**
- Device secure key storage (Expo SecureStore) - `zero-auth-wallet/lib/wallet.ts`

## Webhooks & Callbacks

**Incoming:**
- Relay proof submission endpoint `/api/v1/sessions/:id/proof` - `zero-auth-relay/dist/index.js`

**Outgoing:**
- Wallet posts proof payload to verifier callback URL - `zero-auth-wallet/app/approve-request.tsx`

---

*Integration audit: 2026-02-21*
