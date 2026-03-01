# Zero Auth Codebase Structure

This document provides a comprehensive overview of the Zero Auth project directory layout, organized by major component and describing the purpose of each directory and key file naming patterns.

## Project Overview

The Zero Auth project is organized into three main components:

```
zero-auth-wallet/     # React Native/Expo mobile wallet application
zero-auth-sdk/        # JavaScript SDK for web-based verifiers
zero-auth-relay/      # Node.js/Express relay server for session management
```

Additional top-level directories contain documentation, configuration, and tooling:

```
docs/                 # Project documentation
scripts/              # Shared build and utility scripts
.adapters/           # AI agent adapter configurations
.gsd/                # GSD (GitHub Style Driven) workflow templates
.planning/           # Project planning and architecture documents
```

---

## zero-auth-wallet/

The wallet is a React Native application built with Expo, featuring zero-knowledge proof-based credential verification.

### Directory Structure

```
zero-auth-wallet/
├── app/                    # Expo Router screens and navigation
├── assets/                 # Static assets (images, bundled ZK libraries)
├── circuits/               # Zero-knowledge circuit files (Circom)
├── components/              # Reusable React components
├── constants/              # Application constants and theme
├── hooks/                  # Custom React hooks
├── lib/                    # Core business logic
├── mocks/                  # Test mocks and placeholders
├── scripts/                # Build and utility scripts
├── store/                  # Zustand state management
├── android/                # Android native project files
├── dist/                   # Built application bundles
├── node_modules/           # NPM dependencies
└── [config files]          # Package.json, tsconfig, etc.
```

### Detailed Directory Breakdown

#### app/

The main application screens organized using Expo Router file-based routing.

```
app/
├── _layout.tsx              # Root layout with ZKProvider setup
├── onboarding.tsx           # First-time wallet creation flow
├── approve-request.tsx      # Verification request approval screen
├── my-qr.tsx                # User's DID QR code display
├── add-credential/          # Credential issuance flow
│   ├── index.tsx            # Entry point - choose add method
│   ├── issuer-select.tsx    # Select credential issuer
│   ├── form.tsx             # Input credential attributes
│   ├── verify.tsx           # ZK proof generation and storage
│   └── import.tsx           # Import existing credentials
└── (tabs)/                  # Tab-based navigation screens
    ├── _layout.tsx          # Tab navigation configuration
    ├── index.tsx            # Dashboard - active sessions
    ├── credentials.tsx      # List of stored credentials
    ├── history.tsx          # Past verification sessions
    ├── scanner.tsx          # QR code scanner
    └── settings.tsx         # Device identity, backup, reset
```

**File Naming Pattern:** `*.tsx` for React components, directory names use kebab-case.

#### assets/

Static resources including images and bundled ZK libraries.

```
assets/
├── images/                  # App icons, splash screen, logos
├── circuits/                # Compiled circuit files
│   ├── verification_key_student.json
│   ├── student_check_final.zkey
│   └── student_check.wasm
├── snarkjs.bundle           # Bundled snarkjs for WebView
├── poseidon.bundle          # Bundled poseidon for WebView
├── snarkjs.bin              # Binary snarkjs library
└── poseidon.bin             # Binary poseidon library
```

#### circuits/

Zero-knowledge circuit source code and compilation artifacts written in Circom.

```
circuits/
├── age_check.circom         # Age verification circuit source
├── student_check.circom     # Student verification circuit source
├── age_check_final.zkey     # Age check proving key
├── student_check_final.zkey # Student check proving key
├── age_check_js/            # Compiled age check circuit
│   ├── age_check.wasm
│   ├── generate_witness.js
│   └── witness_calculator.js
├── student_check_js/        # Compiled student check circuit
│   ├── student_check.wasm
│   ├── generate_witness.js
│   └── witness_calculator.js
├── verification_key.json    # Age check verification key
├── verification_key_student.json
├── pot12_final.ptau         # Trusted setup phase 2
├── student_check.r1cs       # Rank-1 constraint system
└── student_check.sym        # Symbol table for debugging
```

**File Naming Pattern:** Circuit sources use snake_case (`*.circom`), compiled outputs use the same base name with appropriate extensions.

#### components/

Reusable React components.

```
components/
├── ZKEngine.tsx             # React Context + hidden WebView for ZK proofs
├── CustomAlert.tsx          # Themed modal alert
├── NotificationModal.tsx    # App notifications display
├── SessionCard.tsx          # Visual card for sessions
└── ui/                      # UI component library (currently empty)
```

**File Naming Pattern:** PascalCase (`*.tsx`) for component files.

#### constants/

Application configuration constants.

```
constants/
└── theme.ts                 # Theme colors, spacing, border radius
```

#### hooks/

Custom React hooks for shared functionality.

```
hooks/
├── use-theme-color.ts       # Theme color utilities
├── use-color-scheme.ts       # System light/dark mode detection
└── use-color-scheme.web.ts   # Web-specific color scheme
```

**File Naming Pattern:** camelCase with `use-` prefix (`*.ts`).

#### lib/

Core business logic modules organized by functionality.

```
lib/
├── wallet.ts                # Ed25519 keypair, DID derivation
├── hashing.ts               # Poseidon hashing functions
├── proof.ts                 # ZK proof generation orchestration
├── zk-bridge-types.ts       # TypeScript types for ZK Bridge
├── qr-protocol.ts           # QR code parsing and validation
├── revocation.ts            # Credential revocation checking
├── storage.ts               # Zustand adapter, backup/restore
├── offline.ts               # Offline queue management
├── qr-display.ts           # QR payload generation
└── utils.ts                 # Secure ID/salt generation, PIN hashing
```

**File Naming Pattern:** camelCase (`*.ts`) for utility and logic modules.

#### mocks/

Test mocks and placeholders.

```
mocks/
└── empty.js                 # Placeholder for future tests
```

#### scripts/

Build and utility scripts.

```
scripts/
├── generate-qr.ts           # Standalone QR generation
├── verify-proof.ts          # Server-side proof verification
├── bundle-zk.js             # Bundles snarkjs/poseidon for WebView
└── compile-circuit.sh       # Circom circuit compilation
```

**File Naming Pattern:** Mixed - TypeScript (`*.ts`), JavaScript (`*.js`), Shell (`*.sh`).

#### store/

Zustand state management stores.

```
store/
├── auth-store.ts            # Credentials, sessions, notifications, auth state
└── wallet-store.ts          # DID, public key, initialization status
```

**File Naming Pattern:** PascalCase with `-store` suffix (`*.ts`).

---

## zero-auth-sdk/

A pure JavaScript SDK that enables web applications to request zero-knowledge credential verifications.

### Directory Structure

```
zero-auth-sdk/
├── src/                     # TypeScript source files
├── dist/                    # Compiled output (ESM, UMD, types)
├── node_modules/            # NPM dependencies
├── demo-cdn.html            # CDN integration demo
├── demo-dropin.html        # Drop-in component demo
├── demo-sandbox.html       # Sandbox integration demo
├── package.json
├── rollup.config.js        # Build configuration
└── tsconfig.json
```

### Detailed Directory Breakdown

#### src/

TypeScript source code for the SDK.

```
src/
├── index.ts                 # Pure JavaScript implementation
├── index.tsx                # React component implementation
└── zero-auth-umd.js        # UMD build output
```

**File Naming Pattern:** `index.ts` / `index.tsx` following standard library conventions.

#### dist/

Compiled output ready for distribution.

```
dist/
├── index.js                 # CommonJS build
├── index.esm.js             # ES Module build
├── index.d.ts               # TypeScript declarations
├── zero-auth-sdk.umd.js    # UMD build for browsers
└── zero-auth-umd.js       # Alternative UMD variant
```

---

## zero-auth-relay/

A Node.js/Express relay server that manages verification sessions and proof verification.

### Directory Structure

```
zero-auth-relay/
├── src/                     # Server source code
├── migrations/              # Database migration files
├── scripts/                 # Utility scripts
├── dist/                    # Compiled output
├── node_modules/            # NPM dependencies
├── package.json
├── tsconfig.json
├── test-relay.ts           # Integration tests
├── .env                     # Environment variables
└── .env.example            # Environment template
```

### Detailed Directory Breakdown

#### src/

Server-side TypeScript modules.

```
src/
├── index.ts                 # Express server, API routes
├── db.ts                    # Supabase database operations
├── validation.ts            # Request validation middleware
├── zk.ts                    # ZK proof verification
├── errors.ts                # Error codes and helpers
└── proof-worker.ts         # Background proof processing
```

**File Naming Pattern:** camelCase (`*.ts`) for all source files.

#### migrations/

SQL database migrations for session and verification key management.

```
migrations/
├── 02_add_use_case.sql      # Adds use_case column to sessions
├── rls_sessions.sql         # Row Level Security policies
└── verification_keys.sql   # Verification key storage
```

**File Naming Pattern:** Numeric prefix for ordering (`###_*.sql`).

#### scripts/

Server utility scripts.

```
scripts/
└── cleanup-worker.ts       # Expired session cleanup worker
```

---

## File Naming Patterns Summary

| Directory | Pattern | Example |
|-----------|---------|---------|
| Components | PascalCase | `CustomAlert.tsx`, `SessionCard.tsx` |
| Hooks | kebab-case with `use-` prefix | `use-theme-color.ts` |
| Lib/Utils | camelCase | `wallet.ts`, `proof.ts`, `hashing.ts` |
| Stores | PascalCase with `-store` suffix | `auth-store.ts`, `wallet-store.ts` |
| Screens (app/) | kebab-case or PascalCase | `onboarding.tsx`, `approve-request.tsx` |
| Circuits | snake_case | `age_check.circom`, `student_check.circom` |
| Scripts | Mixed (ts/js/sh) | `bundle-zk.js`, `compile-circuit.sh` |
| Config | Standard conventions | `tsconfig.json`, `package.json` |

---

## Code Organization Principles

### Layered Architecture (zero-auth-wallet)

The wallet follows a clear data flow hierarchy:

1. **Screens** (`app/`) - User interface and interaction
2. **Stores** (`store/`) - State management and business state
3. **Libraries** (`lib/`) - Core business logic and utilities
4. **Components** (`components/`) - Reusable UI and ZK engine
5. **Infrastructure** - External services (Supabase, ZK circuits)

```
User Action
    ↓
Screen (app/*)
    ↓
Store Action (store/*)
    ↓
Lib Function (lib/*)
    ↓
ZK Engine (components/ZKEngine.tsx)
    ↓
WebView (snarkjs + poseidon)
    ↓
Relay Server (zero-auth-relay)
```

### Modular Design (zero-auth-sdk)

The SDK is designed as a drop-in solution with multiple integration modes:

- Pure JavaScript library for CDN/Browser usage
- React component wrapper for React applications
- Standalone QR generation capability

### Separation of Concerns (zero-auth-relay)

The relay server separates concerns into distinct modules:

- `index.ts` - HTTP server and routing
- `db.ts` - Database operations
- `validation.ts` - Input validation
- `zk.ts` - Cryptographic verification
- `errors.ts` - Error handling

---

## Additional Top-Level Directories

### docs/

Project documentation including implementation guides and runbooks.

```
docs/
├── SDK_IMPLEMENTATION_GUIDE.md
├── RELAY_IMPLEMENTATION_GUIDE.md
├── WALLET_IMPLEMENTATION_GUIDE.md
├── student-verification-guide.md
├── token-optimization-guide.md
├── runbook.md
└── model-selection-playbook.md
```

### scripts/

Shared build and utility scripts used across projects.

### .gsd/

GitHub Style Driven workflow templates and project management.

### .agent/

AI agent skill definitions for automated tasks.

### adapters/

AI adapter configurations for different models (GPT, Gemini, Claude).

---

## Configuration Files

### Root Level

- `package.json` - Root package configuration
- `tsconfig.json` - TypeScript configuration
- `opencode.json` - OpenCode AI tool configuration
- `GSD-STYLE.md` - Project style guidelines
- `PROJECT_RULES.md` - Project rules and conventions

### zero-auth-wallet/

- `package.json` - Dependencies, scripts, Expo SDK version
- `app.json` - Expo configuration
- `tsconfig.json` - TypeScript configuration
- `babel.config.js` - Babel transpilation
- `metro.config.js` - React Native bundler
- `tailwind.config.js` - NativeWind CSS configuration
- `eas.json` - EAS Build configuration
- `eslint.config.js` - ESLint rules

### zero-auth-sdk/

- `package.json` - SDK metadata, build scripts
- `rollup.config.js` - Module bundler configuration
- `tsconfig.json` - TypeScript configuration

### zero-auth-relay/

- `package.json` - Server dependencies and scripts
- `tsconfig.json` - TypeScript configuration

---

## Dependencies Overview

### zero-auth-wallet Key Dependencies

- `expo` / `expo-router` - Framework and routing
- `zustand` - State management
- `snarkjs` - ZK proof generation
- `@noble/curves/ed25519` - Elliptic curve cryptography
- `nativewind` - Tailwind CSS for React Native
- `expo-secure-store` - Hardware-backed keychain
- `expo-camera` - QR code scanning

### zero-auth-sdk Dependencies

- `qrcode` - QR code generation
- Peer dependencies: `react`, `react-dom` (optional)

### zero-auth-relay Dependencies

- `express` - HTTP server
- `@supabase/supabase-js` - Database client
- `snarkjs` - ZK proof verification
- `uuid` - Session ID generation
- `express-rate-limit` - Rate limiting

---

*This structure document reflects the current state of the Zero Auth codebase as of February 2026.*
