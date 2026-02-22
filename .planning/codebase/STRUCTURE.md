# Codebase Structure

**Analysis Date:** 2026-02-21

## Directory Layout

```
[project-root]/
├── zero-auth-wallet/          # Expo/React Native mobile wallet app
├── zero-auth-relay/           # Node/Express relay server (compiled JS only)
├── scripts/                   # Root orchestration utilities (empty)
├── package.json               # Monorepo scripts
├── README.md                  # System overview and setup
└── node_modules/              # Root dependencies
```

## Directory Purposes

**zero-auth-wallet/**
- Purpose: Mobile wallet application that scans QR codes and generates ZK proofs.
- Contains: Expo Router routes, UI components, state stores, ZK circuits and assets.
- Key files: `zero-auth-wallet/app/_layout.tsx`, `zero-auth-wallet/package.json`, `zero-auth-wallet/components/ZKEngine.tsx`.

**zero-auth-relay/**
- Purpose: Relay API for session creation and proof submission.
- Contains: Compiled server output and node dependencies.
- Key files: `zero-auth-relay/dist/index.js`, `zero-auth-relay/.env`.

**scripts/**
- Purpose: Root-level utilities (no tracked files).
- Contains: Not applicable.
- Key files: Not applicable.

## Key File Locations

**Entry Points:**
- `zero-auth-wallet/app/_layout.tsx`: Wallet app bootstrap and routing guard.
- `zero-auth-relay/dist/index.js`: Express server entry.

**Configuration:**
- `package.json`: Root scripts for running the system.
- `zero-auth-wallet/app.json`: Expo app configuration.
- `zero-auth-wallet/babel.config.js`: Babel config for Expo.
- `zero-auth-wallet/metro.config.js`: Metro bundler configuration.
- `zero-auth-wallet/tsconfig.json`: TypeScript configuration.

**Core Logic:**
- `zero-auth-wallet/lib/proof.ts`: Proof generation pipeline.
- `zero-auth-wallet/lib/qr-protocol.ts`: QR protocol parsing/validation.
- `zero-auth-wallet/lib/wallet.ts`: Identity key generation and DID derivation.
- `zero-auth-wallet/components/ZKEngine.tsx`: ZK bridge execution engine.
- `zero-auth-wallet/store/auth-store.ts`: Sessions/credentials state.
- `zero-auth-wallet/store/wallet-store.ts`: Wallet init state.

**Testing:**
- `TESTING.md`: Top-level test documentation (no test directories detected).

## Naming Conventions

**Files:**
- Expo Router screens follow route-based naming under `zero-auth-wallet/app/`, e.g. `zero-auth-wallet/app/approve-request.tsx`.
- Co-located route groups use parentheses, e.g. `zero-auth-wallet/app/(tabs)/_layout.tsx`.
- Libraries use lowercase names under `zero-auth-wallet/lib/`, e.g. `zero-auth-wallet/lib/qr-protocol.ts`.

**Directories:**
- Feature areas grouped by type: `app/` (routes), `components/`, `lib/`, `store/`, `hooks/`, `assets/`, `circuits/`.

## Where to Add New Code

**New Feature:**
- Primary code: `zero-auth-wallet/app/` (new route) and `zero-auth-wallet/lib/` (supporting logic).
- Tests: Not applicable (no test harness detected).

**New Component/Module:**
- Implementation: `zero-auth-wallet/components/` for UI, `zero-auth-wallet/lib/` for domain logic.

**Utilities:**
- Shared helpers: `zero-auth-wallet/lib/`.

## Special Directories

**zero-auth-wallet/circuits/**
- Purpose: ZK circuit artifacts (wasm, zkey, verification keys).
- Generated: Yes.
- Committed: Yes.

**zero-auth-wallet/assets/**
- Purpose: App assets and bundled ZK libraries.
- Generated: No.
- Committed: Yes.

**zero-auth-wallet/dist/**
- Purpose: Build output (presence indicates built artifacts).
- Generated: Yes.
- Committed: Yes.

---

*Structure analysis: 2026-02-21*
