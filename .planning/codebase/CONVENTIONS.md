# Coding Conventions

**Analysis Date:** 2026-02-18

## Naming Patterns

**Files:**
- Expo Router screens, modals, and shared UI components under `zero-auth-wallet/app/` and `zero-auth-wallet/components/` use PascalCase file names (`onboarding.tsx`, `SessionCard.tsx`, `app/(tabs)/index.tsx`) to match React component exports and route names.
- Utility modules and backend helpers under `zero-auth-wallet/lib/` and `zero-auth-relay/src/lib/` are lowercase (occasionally hyphenated) such as `provider.ts`, `proof.ts`, `wallet.ts`, `network.ts`, highlighting their non-UI roles.

**Functions:**
- Async helpers and services follow camelCase verbs—`generateProof` (`zero-auth-wallet/lib/proof.ts`), `commitAttribute` (`zero-auth-wallet/lib/hashing.ts`), `verifySessionProof` (`zero-auth-relay/src/services/session.service.ts`), `resolveCallbackUrl` (`zero-auth-relay/src/lib/network.ts`).
- UI handlers use camelCase verbs with descriptive prefixes (`handleApprove`, `startGeneration` in `zero-auth-wallet/app/approve-request.tsx` and `zero-auth-wallet/app/onboarding.tsx`).

**Variables:**
- State hooks follow `[value, setValue]` camelCase naming, e.g., `[step, setStep]` (`zero-auth-wallet/app/onboarding.tsx`) and `[refreshing, setRefreshing]` (`zero-auth-wallet/app/(tabs)/index.tsx`).
- Relay session status strings are uppercase (`'PENDING' | 'COMPLETED' | 'EXPIRED'` in `zero-auth-sdk/src/types.ts`), while wallet-local session metadata uses lowercase (`'active' | 'revoked'` in `zero-auth-wallet/store/auth-store.ts`); maintain each casing per domain.

**Types:**
- Interfaces and type aliases use PascalCase with descriptive suffixes (`Session`, `VerificationResult`, `VerifyOptions` in `zero-auth-sdk/src/types.ts`; `AuthState`, `Credential`, `Notification` in `zero-auth-wallet/store/auth-store.ts`).

## Code Style

**Formatting:**
- The wallet project inherits Expo's base formatter (`expo/tsconfig.base`) and strict TypeScript settings defined in `zero-auth-wallet/tsconfig.json`; files consistently prefer `const` for immutable bindings and explicit return types on exports.

**Linting:**
- `zero-auth-wallet/package.json` exposes `npm run lint` (`expo lint`), honoring the flattened Expo ESLint config defined in `zero-auth-wallet/eslint.config.js` (excludes `dist/`).

## Import Organization

**Order:**
1. External dependencies (`cors`, `express`, `zod` in `zero-auth-relay/src/index.ts`; `react`, `expo-router` in wallet screens)
2. Internal modules via aliases/relative paths (`@/store/auth-store`, `@/lib/proof`).

**Path Aliases:**
- `zero-auth-wallet/tsconfig.json` sets `@/*` to point to the project root, so screens like `zero-auth-wallet/app/approve-request.tsx` import helpers via `@/lib/qr-protocol` and `@/components/ZKEngine`.

## Error Handling

**Patterns:**
- Express endpoints wrap schema parsing and service calls in `try/c catch`, log the exception with `pino`, and respond with `res.status(400).json({ error: e.message })` (`zero-auth-relay/src/index.ts`).
- Service helpers throw descriptive `Error`s to propagate failures (`SessionService.verifySessionProof` and `revokeSession` in `zero-auth-relay/src/services/session.service.ts`), while `verifyProof` logs errors and returns `false` to keep caller logic linear.
- Wallet UI functions wrap async flows in `try/c catch`, log via `console`, and surface user feedback with `Alert.alert` or local state (see `zero-auth-wallet/app/approve-request.tsx` and `zero-auth-wallet/app/onboarding.tsx`).

## Logging

- Backend logs use `pino` with structured fields for session IDs and proof types (`zero-auth-relay/src/index.ts`, `zero-auth-relay/src/services/session.service.ts`).
- Frontend/logging-heavy modules (`ZeroAuth.verify` in `zero-auth-sdk/src/index.ts`, `generateProof` in `zero-auth-wallet/lib/proof.ts`, `components/ZKEngine.tsx`) rely on `console.log`/`console.warn` for asset loading, WebView bridge events, and fallback retries.

## Comments

- Longer helpers expose their intent with JSDoc-style headers and numbered steps (`zero-auth-wallet/lib/proof.ts`, `zero-auth-wallet/lib/wallet.ts`).
- Inline comments explain platform shims and edge cases, e.g., global polyfills in `zero-auth-wallet/app/_layout.tsx` and the bridge injection flow inside `components/ZKEngine.tsx`.

## Function Design

**Size:**
- Heavy workflows split into focused helpers (`prepareInputs`, `performProof`, and `generateProof` inside `zero-auth-wallet/lib/proof.ts`; `ZeroAuth.verify` segments session creation, polling, and cancellation) so no single exported function exceeds a screenful without clear substeps.

**Parameters:**
- Service methods accept typed option objects (`VerifyOptions` for `ZeroAuth.verify`, `{ sessionId, proofPayload }`-style args in `SessionService.verifySessionProof`), keeping callers explicit about all required inputs.

**Return Values:**
- Async APIs return structured result objects with `success` flags and supplementary data (the relay returns `{ success: true }` in `SessionService` and `ZeroAuth.verify` resolves to `VerificationResult` along with an injectable `cancel` hook). When the bridging engine cannot complete, `generateProof` throws to allow UI components to catch and show alerts.

## Module Design

**Exports:**
- The SDK exposes a single `ZeroAuth` class plus re-exported types (`zero-auth-sdk/src/index.ts`), while the wallet divides helpers (`lib/*`), state (`store/*`), and screens (`app/*`) into distinct files that default export their React function or named helpers to keep each module focused.

**Barrel Files:**
- Only the SDK surface uses a barrel (`zero-auth-sdk/src/index.ts`) to re-export `types.ts` alongside the `ZeroAuth` class; other packages prefer direct imports without intermediate barrels.
---
*Convention analysis: 2026-02-18*
