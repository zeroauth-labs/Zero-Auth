# Technology Stack

**Analysis Date:** 2026-02-18

## Languages

**Primary:**
- TypeScript 5.x – the relay, SDK, and wallet sources (`zero-auth-relay/src`, `zero-auth-sdk/src`, `zero-auth-wallet/app`, `store`, `lib`) and their `package.json` files (`zero-auth-relay/package.json`, `zero-auth-sdk/package.json`, `zero-auth-wallet/package.json`, `zero-auth-sdk/examples/basic/package.json`) all declare TypeScript `^5.x` dependencies.

**Secondary:**
- JavaScript (ESNext) – lightweight scripts such as `zero-auth-wallet/scripts/bundle-zk.js`, `zero-auth-wallet/mocks/empty.js`, and the SDK demo `zero-auth-sdk/examples/basic/src/main.ts` run plain JavaScript for bundling or DOM glue code.

## Runtime

**Environment:**
- Node.js 18+ (see `README.md`) powers `zero-auth-relay` (Express + ts-node) and the SDK demo (Vite) while compiling all TypeScript via `tsc`.
- Expo SDK 54 / React Native 0.81.5 (per `zero-auth-wallet/package.json` and `app.json`) runs the mobile wallet inside `expo-router/entry` with Metro bundler patched by `zero-auth-wallet/metro.config.js`.

**Package Manager:**
- npm – each package keeps a lockfile (`zero-auth-relay/package-lock.json`, `zero-auth-wallet/package-lock.json`, `zero-auth-sdk/examples/basic/package-lock.json`).
- Lockfile: present for every subproject.

## Frameworks

**Core:**
- Express 4.18.2 handles the relay API surface, CORS, rate limiting, and schema validation in `zero-auth-relay/src/index.ts`.
- Expo + React Native provide the wallet experience, configured via `zero-auth-wallet/app.json`, `zero-auth-wallet/_layout.tsx`, and the `(tabs)` routes (`scanner.tsx`, `approve-request.tsx`, etc.).
- Expo Router / React Navigation typifies navigation in `zero-auth-wallet/app/_layout.tsx` and the `(tabs)` layout with typed routes and linking.
- ZeroAuth SDK is a framework-agnostic TypeScript class (`zero-auth-sdk/src/index.ts`) whose consumer uses the provided `verify()` flow.

**Testing:**
- Not detected (no automated test tooling is configured in the repository).

**Build/Dev:**
- `ts-node` `tsc` for relay development/build (`zero-auth-relay/package.json` and `zero-auth-relay/tsconfig.json`).
- `tsc` plus `vite` for the SDK demo (`zero-auth-sdk/package.json` and `zero-auth-sdk/examples/basic/package.json`).
- Expo CLI (`zero-auth-wallet/package.json` scripts such as `start`, `android`, `ios`, `bundle:zk`) and EAS (`zero-auth-wallet/eas.json`).
- `concurrently` orchestrates `npm run dev:all` at the repo root (`package.json`) to start the relay, SDK demo, and Expo wallet together, matching the README workflow.
- `zero-auth-wallet/scripts/bundle-zk.js` plus `metro.config.js` package `snarkjs`/`poseidon-lite` into `assets/snarkjs.bundle` and `assets/poseidon.bundle` for the WebView `ZKEngine`.

## Key Dependencies

**Critical:**
- `snarkjs` ^0.7.6 – server-side verification uses `groth16.verify` in `zero-auth-relay/src/lib/verifier.ts` with keys from `zero-auth-relay/circuits`, while `zero-auth-wallet/components/ZKEngine.tsx` executes Groth16 proofs loaded via the `scripts/bundle-zk.js` assets (`assets/snarkjs.bundle`).
- `redis` ^4.6.10 – `zero-auth-relay/src/lib/redis.ts` persists ephemeral sessions with a 5-minute TTL consumed by `zero-auth-relay/src/services/session.service.ts`.
- Expo / React Native (SDK 54, RN 0.81.5) – `zero-auth-wallet/package.json` plus `app.json` describe the managed mobile runtime with sensors, WebView, and secure storage.
- `expo-router` – `zero-auth-wallet/app/_layout.tsx` wires a Stack navigator with typed routes and splash-screen bootstrapping inside the `ZKProvider` context.
- `@noble/curves`, `@stablelib/base64`, `bs58` – `zero-auth-wallet/lib/wallet.ts` derives an Ed25519 keypair and resolves the DID (`did:key`) before persisting the private key inside `expo-secure-store`.

**Infrastructure:**
- `express-rate-limit`, `cors`, `zod`, `uuid`, `pino` – used in `zero-auth-relay/src/index.ts` and `zero-auth-relay/src/services/session.service.ts` for validation, rate limiting, logging, and session IDs.
- `nativewind` + `tailwindcss` – `tailwind.config.js`, `global.css`, and the `/app` screens rely on NativeWind classes when rendering the Tokyo Night-inspired UI.
- `lucide-react-native` icons appear throughout `app/(tabs)/scanner.tsx`, `app/approve-request.tsx`, and credential screens to keep the UI cohesive.
- `expo-camera`, `expo-local-authentication`, `expo-asset`, `expo-file-system` – `app/(tabs)/scanner.tsx` scans QR codes, `app/approve-request.tsx` gates approvals with biometrics and SecureStore, while `components/ZKEngine.tsx` reads bundled assets with `expo-asset`/`expo-file-system`.
- `zustand` + `zustand/middleware` + `@react-native-async-storage/async-storage` – `store/auth-store.ts` and `lib/storage.ts` persist sessions, credentials, and notifications.
- `qrcode` – the SDK demo (`zero-auth-sdk/examples/basic/src/main.ts`) uses `https://api.qrserver.com/v1/create-qr-code/` to render the verification QR with the SDK-provided payload.

## Configuration

**Environment:**
- `zero-auth-relay/.env.example` lists `PORT`, `NODE_ENV`, `REDIS_URL`, `RELAY_DID`, `LOG_LEVEL`, and optional `PUBLIC_URL`; `zero-auth-relay/src/config.ts` enforces the schema, and `zero-auth-relay/src/lib/network.ts` prefers `PUBLIC_URL` (ngrok/localtunnel) before falling back to the host or LAN IP for callback URLs.
- `zero-auth-wallet/app.json` registers `expo-router`, `expo-splash-screen`, `expo-secure-store`, and `expo-asset`, plus bundles `circuits/*.wasm/.zkey` and defines the `zeroauth` scheme; `zero-auth-wallet/metro.config.js` polyfills Node built-ins, allows `.wasm`, `.zkey`, and `.bundle` assets, and mocks unsupported modules for `snarkjs`.
- `zero-auth-wallet/tsconfig.json` extends `expo/tsconfig.base` and creates the `@/*` path alias used throughout the app.

**Build:**
- `zero-auth-wallet/scripts/bundle-zk.js` produces `assets/snarkjs.bundle` and `assets/poseidon.bundle` (required by `components/ZKEngine.tsx`).
- `zero-auth-sdk/examples/basic/src/main.ts` defines the `RELAY_URL` constant for demos and shows how to overlay the SDK-provided `qr_payload` with `https://api.qrserver.com/v1/create-qr-code/`.
- `tailwind.config.js` (NativeWind preset) defines the custom color palette consumed by `app` components for gradients, cards, and alerts.

## Platform Requirements

**Development:**
- Node.js 18+ with npm (per `README.md`), a running Redis instance referenced by `REDIS_URL`, and Ngrok/localtunnel for public callbacks to `zero-auth-relay`'s `PUBLIC_URL`; `npm run dev:all` (`package.json`) spins up the relay, SDK demo, and Expo wallet, while `npx expo start --tunnel` (per `zero-auth-wallet/package.json`) connects to physical devices via Expo Go.

**Production:**
- Host the relay on any Node.js runtime with access to Redis and set `PUBLIC_URL` to the external domain so `resolveCallbackUrl` emits correct callbacks inside `qr_payload` (`zero-auth-relay/src/lib/network.ts`).
- Build the wallet through Expo/EAS (`zero-auth-wallet/eas.json`) for Android/iOS distribution with bundled circuits (`app.json` `assetBundlePatterns`).
- Publish the SDK (compiled via `tsc`) to npm, or embed the `examples/basic` Vite app which talks to the relay via the `ZeroAuth` constructor (`zero-auth-sdk/src/index.ts`).

---

*Stack analysis: 2026-02-18*
