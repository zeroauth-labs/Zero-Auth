# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- Components use PascalCase filenames (e.g., `zero-auth-wallet/components/CustomAlert.tsx`, `zero-auth-wallet/components/SessionCard.tsx`).
- Hooks use `use-` prefix with kebab-case (e.g., `zero-auth-wallet/hooks/use-theme-color.ts`, `zero-auth-wallet/hooks/use-color-scheme.ts`).
- App routes use kebab-case and `index.tsx` under Expo Router segments (e.g., `zero-auth-wallet/app/(tabs)/index.tsx`, `zero-auth-wallet/app/add-credential/issuer-select.tsx`).
- Stores use kebab-case `*-store.ts` (e.g., `zero-auth-wallet/store/auth-store.ts`, `zero-auth-wallet/store/wallet-store.ts`).
- Utilities in `lib/` use kebab-case (e.g., `zero-auth-wallet/lib/qr-protocol.ts`, `zero-auth-wallet/lib/offline.ts`).

**Functions:**
- React components use `export default function ComponentName()` (e.g., `zero-auth-wallet/components/CustomAlert.tsx`, `zero-auth-wallet/app/(tabs)/index.tsx`).
- Utilities and hooks use named exports (`export function ...`, `export async function ...`) (e.g., `zero-auth-wallet/lib/utils.ts`, `zero-auth-wallet/hooks/use-theme-color.ts`).
- Store actions are arrow functions inside Zustand `create` with inline async usage (e.g., `zero-auth-wallet/store/auth-store.ts`, `zero-auth-wallet/store/wallet-store.ts`).

**Variables:**
- camelCase for locals and state (e.g., `zero-auth-wallet/app/(tabs)/index.tsx`, `zero-auth-wallet/lib/offline.ts`).
- SCREAMING_SNAKE_CASE for constants (e.g., `zero-auth-wallet/lib/offline.ts`).

**Types:**
- PascalCase interfaces/types with union string literals for enums (e.g., `zero-auth-wallet/store/auth-store.ts`, `zero-auth-wallet/lib/offline.ts`).

## Code Style

**Formatting:**
- No dedicated formatter config detected; follow ESLint defaults and local file style in each directory (e.g., 2-space indentation in `zero-auth-wallet/app/_layout.tsx`, 4-space indentation in `zero-auth-wallet/store/auth-store.ts`).
- Single quotes and semicolons are used consistently (e.g., `zero-auth-wallet/lib/proof.ts`, `zero-auth-wallet/components/ZKEngine.tsx`).

**Linting:**
- ESLint with Expo flat config (`zero-auth-wallet/eslint.config.js`).
- Lint script uses `expo lint` (`zero-auth-wallet/package.json`).

## Import Organization

**Order:**
1. Aliased internal modules from `@/` first (e.g., `zero-auth-wallet/app/(tabs)/index.tsx`, `zero-auth-wallet/store/auth-store.ts`).
2. External packages (e.g., `zero-auth-wallet/app/(tabs)/index.tsx`, `zero-auth-wallet/components/ZKEngine.tsx`).
3. Relative imports for same-module files (e.g., `zero-auth-wallet/lib/proof.ts`).

**Path Aliases:**
- `@/*` resolves to repo root of the app (`zero-auth-wallet/tsconfig.json`).

## Error Handling

**Patterns:**
- Throw `Error` for invalid states and missing assets (e.g., `zero-auth-wallet/lib/proof.ts`, `zero-auth-wallet/components/ZKEngine.tsx`).
- Use `try/catch` with `console.error` or `console.warn`, then rethrow when the UI needs to react (e.g., `zero-auth-wallet/store/wallet-store.ts`, `zero-auth-wallet/app/add-credential/verify.tsx`).
- Early returns to skip invalid conditions (e.g., `zero-auth-wallet/store/auth-store.ts`).

## Logging

**Framework:** console (e.g., `zero-auth-wallet/lib/proof.ts`).

**Patterns:**
- Use `console.log` for lifecycle tracing and status updates (e.g., `zero-auth-wallet/lib/proof.ts`, `zero-auth-wallet/components/ZKEngine.tsx`).
- Use `console.warn` for recoverable data issues (e.g., `zero-auth-wallet/lib/proof.ts`, `zero-auth-wallet/app/add-credential/verify.tsx`).
- Use `console.error` in `catch` blocks and failure paths (e.g., `zero-auth-wallet/store/wallet-store.ts`, `zero-auth-wallet/lib/offline.ts`).

## Comments

**When to Comment:**
- Use brief inline comments for steps, polyfills, and non-obvious flow (e.g., `zero-auth-wallet/app/_layout.tsx`, `zero-auth-wallet/app/add-credential/verify.tsx`).
- Use short doc comments for utility modules and public functions (e.g., `zero-auth-wallet/lib/storage.ts`, `zero-auth-wallet/lib/offline.ts`).

**JSDoc/TSDoc:**
- Light usage for exported helpers; avoid heavy docblocks (e.g., `zero-auth-wallet/lib/offline.ts`).

## Function Design

**Size:**
- Keep helpers focused and small in `lib/` (e.g., `zero-auth-wallet/lib/utils.ts`, `zero-auth-wallet/lib/storage.ts`).
- Allow larger UI flows in screen components, organized via step comments and local state (e.g., `zero-auth-wallet/app/add-credential/verify.tsx`).

**Parameters:**
- Prefer explicit typed parameters and inline `Omit`/union types for actions (e.g., `zero-auth-wallet/store/auth-store.ts`, `zero-auth-wallet/lib/offline.ts`).

**Return Values:**
- Async functions return `Promise<...>` and rethrow on failure when needed (e.g., `zero-auth-wallet/store/wallet-store.ts`, `zero-auth-wallet/lib/proof.ts`).

## Module Design

**Exports:**
- Default exports for screens and components (e.g., `zero-auth-wallet/app/(tabs)/index.tsx`, `zero-auth-wallet/components/CustomAlert.tsx`).
- Named exports for hooks, utilities, and stores (e.g., `zero-auth-wallet/hooks/use-theme-color.ts`, `zero-auth-wallet/lib/offline.ts`, `zero-auth-wallet/store/auth-store.ts`).

**Barrel Files:**
- No barrel exports detected; import directly from source files (e.g., `zero-auth-wallet/app/(tabs)/index.tsx`).

---

*Convention analysis: 2026-02-21*
