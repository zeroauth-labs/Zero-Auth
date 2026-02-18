# Testing Patterns

**Analysis Date:** 2026-02-18

## Test Framework

**Runner:**
- Not configured; `zero-auth-relay/package.json`, `zero-auth-sdk/package.json`, and `zero-auth-wallet/package.json` expose scripts for dev/build but none named `test` or pointing to a test runner.

**Assertion Library:**
- Not present—no test dependencies or files reference Jest, Vitest, or similar assertion helpers.

**Run Commands:**
```bash
# Not available—no `npm run test` in any package.json
# Not available
# Not available
```

## Test File Organization

**Location:**
- All TypeScript files under `zero-auth-relay/src/`, `zero-auth-sdk/src/`, and `zero-auth-wallet/app/`/`components/`/`lib/`/`store/` are production code; there are currently no `*.test.*`, `*.spec.*`, or `__tests__` files co-located with those modules.

**Naming:**
- Not applicable (no test files to describe).

**Structure:**
```
// No test directories or suites exist yet.
```

## Test Structure

**Suite Organization:**
```typescript
// No automated suites are defined at this time.
```

**Patterns:**
- Not defined because no automated tests exist.
- Manual flows rely on `zero-auth-sdk/examples/basic/src/main.ts` and `zero-auth-wallet/app/approve-request.tsx` to exercise the verification sequence.

## Mocking

**Framework:**
- None—no mocking libraries or fixtures are checked into the repo for testing purposes (the `zero-auth-wallet/mocks/empty.js` files support bundling, not tests).

**Patterns:**
```
// No automated mocking patterns.
```

**What to Mock / What NOT to Mock:**
- Not defined because no automation currently imports mocks.

## Fixtures and Factories

**Test Data:**
```
// No automated fixtures.
```

**Location:**
- Manual demo data is seeded via `useAuthStore.getState().seedDemoData()` in `zero-auth-wallet/store/auth-store.ts` rather than through automated fixtures.

## Coverage

**Requirements:**
- None—no coverage scripts or enforcement exist in any `package.json`.

**View Coverage:**
```bash
# No coverage command is configured.
```

## Test Types

**Unit Tests:**
- Not present; there are no unit test suites or files.

**Integration Tests:**
- Not present.

**E2E Tests:**
- Not present; the primary validation path is manual through the wallet screens and relay handshake described in `README.md`.

## Common Patterns

**Async Testing:**
```
// No automated async tests to show.
```

**Error Testing:**
```
// No automated error tests to show.
```

**Manual Verification:**
- The README (`README.md`) outlines how to run `npm run dev:relay`, `npm run dev:sdk`, and `npm run dev:wallet` (via `npm run dev:all`) to manually exercise the full flow.
- Wallet UI screens such as `zero-auth-wallet/app/(tabs)/index.tsx`, `zero-auth-wallet/app/approve-request.tsx`, and `zero-auth-wallet/app/onboarding.tsx` are the primary touchpoints for end-to-end checks.
- The SDK demo at `zero-auth-sdk/examples/basic/src/main.ts` provides a curated QR flow used during manual ad-hoc testing.

---
*Testing analysis: 2026-02-18*
