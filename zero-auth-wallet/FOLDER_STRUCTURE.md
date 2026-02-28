# Zero Auth Wallet - Folder Structure Guide

This document provides a detailed explanation of each folder and its contents in the Zero Auth Wallet application.

---

## Overview

```
zero-auth-wallet/
├── app/                    # Expo Router screens & navigation
├── assets/                 # Static assets (images, bundled JS)
├── circuits/               # Zero-Knowledge circuit files
├── components/             # Reusable React components
├── constants/              # Theme & configuration constants
├── hooks/                  # Custom React hooks
├── lib/                    # Core business logic
├── mocks/                  # Test mocks
├── scripts/                # Build & utility scripts
├── store/                  # Zustand state management
├── package.json
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## app/ - Application Screens

The main application screens organized by functionality.

### Root Screens

| File | Purpose |
|------|---------|
| `_layout.tsx` | Root layout, polyfills, ZKProvider setup |
| `onboarding.tsx` | First-time wallet creation flow |
| `approve-request.tsx` | Verification request approval screen |
| `my-qr.tsx` | User's DID QR code display |

### Tab Screens (`app/(tabs)/`)

| File | Purpose |
|------|---------|
| `index.tsx` | Dashboard - active sessions, quick actions |
| `credentials.tsx` | List of stored credentials |
| `history.tsx` | Past verification sessions |
| `scanner.tsx` | QR code scanner for verification requests |
| `settings.tsx` | Device identity, backup, reset |
| `_layout.tsx` | Tab navigation configuration |

### Credential Issuance (`app/add-credential/`)

| File | Purpose |
|------|---------|
| `index.tsx` | Entry point - choose add method |
| `issuer-select.tsx` | Select credential issuer |
| `form.tsx` | Input credential attributes |
| `verify.tsx` | ZK proof generation and credential storage |

---

## assets/ - Static Assets

| Folder/File | Purpose |
|-------------|---------|
| `images/` | App icons, splash screen, logos |
| `circuits/` | Compiled circuit files (.zkey, .wasm) |
| `snarkjs.bundle` | Bundled snarkjs library for WebView |
| `poseidon.bundle` | Bundled poseidon library for WebView |
| `snarkjs.bin` | Binary snarkjs library |
| `poseidon.bin` | Binary poseidon library |

---

## circuits/ - Zero-Knowledge Circuits

Contains Circom circuit source code and compiled artifacts.

| File | Purpose |
|------|---------|
| `*.circom` | Circom circuit source code |
| `*.wasm` | Compiled circuit for witness generation |
| `*.zkey` | Proving key for Groth16 |
| `*.r1cs` | Rank-1 constraint system |
| `*.sym` | Symbol table for debugging |
| `pot12_final.ptau` | Trusted setup phase 2 |

### Current Circuits

1. **age_check** - Proves user is 18+ without revealing birth year
2. **student_check** - Proves student status without revealing details

---

## components/ - Reusable UI Components

| Component | Purpose |
|-----------|---------|
| `ZKEngine.tsx` | React Context + hidden WebView that runs SnarkJS and Poseidon for ZK proofs |
| `CustomAlert.tsx` | Themed modal alert replacing native Alert (error/success/warning/info) |
| `NotificationModal.tsx` | Displays list of app notifications |
| `SessionCard.tsx` | Visual card for active/past sessions |

---

## constants/ - Configuration

| File | Purpose |
|------|---------|
| `theme.ts` | Theme colors, spacing, border radius values |

---

## hooks/ - Custom React Hooks

| Hook | Purpose |
|------|---------|
| `use-theme-color.ts` | Theme color utilities based on color scheme |
| `use-color-scheme.ts` | Detect system light/dark mode |
| `use-color-scheme.web.ts` | Web-specific color scheme detection |

---

## lib/ - Core Business Logic

### Cryptography & Identity

| File | Functions | Purpose |
|------|-----------|---------|
| `wallet.ts` | `generateAndStoreIdentity()`, `isWalletInitialized()`, `getWalletIdentity()`, `signMessage()`, `purgeWallet()`, `deriveDID()` | Ed25519 keypair management, DID derivation |
| `hashing.ts` | `poseidonHash()`, `commitAttribute()` | Poseidon hashing via ZK Bridge |
| `utils.ts` | `generateSecureId()`, `generateSecureSalt()`, `hashPin()`, `verifyPin()`, `cn()` | Utility functions for secure ID/salt generation, PIN hashing |

### Proof Generation

| File | Functions | Purpose |
|------|-----------|---------|
| `proof.ts` | `generateProof()`, `prepareInputs()`, `performProof()` | ZK proof generation, circuit caching, expiry validation |
| `zk-bridge-types.ts` | Types for `ZKProofPayload`, `BridgeRequest`, `BridgeResponse` | TypeScript types for ZK Bridge communication |

### Protocol & Validation

| File | Functions | Purpose |
|------|-----------|---------|
| `qr-protocol.ts` | `parseVerificationQR()` | QR code parsing/validation |
| `revocation.ts` | `checkRevocationStatus()`, `getCachedRevocationStatus()`, `cacheRevocationStatus()` | Credential revocation checking with 1-hour caching |

### Storage & Offline

| File | Functions | Purpose |
|------|-----------|---------|
| `storage.ts` | `getStorageUsage()`, `exportWalletData()`, `importWalletData()` | Zustand adapter, quota enforcement, backup/restore |
| `offline.ts` | `getNetworkStatus()`, `queueAction()`, `processQueuedActions()`, `useNetworkStatus()` | Offline queue management, network monitoring |

### Display

| File | Functions | Purpose |
|------|-----------|---------|
| `qr-display.ts` | `getQrPayload()` | Generate QR payload for user's DID |

---

## mocks/ - Test Files

| File | Purpose |
|------|---------|
| `empty.js` | Placeholder for future tests |

---

## scripts/ - Build & Utility Scripts

| File | Purpose |
|------|---------|
| `generate-qr.ts` | Standalone QR generation for testing |
| `verify-proof.ts` | Server-side proof verification (for relay) |
| `bundle-zk.js` | Bundles snarkjs/poseidon for WebView injection |
| `compile-circuit.sh` | Bash script for Circom circuit compilation |

---

## store/ - State Management

### Zustand Stores

| File | State | Purpose |
|------|-------|---------|
| `auth-store.ts` | Credentials, sessions, notifications, biometrics, PIN | Main application state |
| `wallet-store.ts` | DID, public key, initialization status | Wallet identity lifecycle |

### Key State Properties

**auth-store.ts:**
- `credentials[]` - Stored credentials
- `sessions[]` - Active verification sessions
- `history[]` - Past sessions
- `notifications[]` - App notifications
- `biometricsEnabled` - Biometric toggle
- `pinHash` - PIN fallback hash

**wallet-store.ts:**
- `isInitialized` - Wallet created?
- `did` - Decentralized Identifier
- `publicKeyHex` - Public key

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, version |
| `app.json` | Expo config (name, scheme, plugins, version) |
| `tsconfig.json` | TypeScript configuration |
| `babel.config.js` | Babel transpilation |
| `metro.config.js` | React Native bundler |
| `tailwind.config.js` | Tailwind CSS v4 config |
| `eas.json` | EAS Build configuration |

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` | Framework |
| `expo-router` | File-based routing |
| `expo-secure-store` | Hardware-backed keychain |
| `expo-crypto` | Cryptographic random values |
| `expo-camera` | QR scanning |
| `expo-local-authentication` | Biometrics |
| `@noble/curves/ed25519` | Elliptic curve cryptography |
| `snarkjs` | ZK proof generation |
| `zustand` | State management |
| `nativewind` | Tailwind CSS for RN |

---

## Data Flow

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
Proof Generated
    ↓
Post to Relay Server
```

---

## Security Model

1. **Identity**: Ed25519 keypair, hardware-backed
2. **Credentials**: Salted hashes, never exported
3. **Proofs**: Zero-knowledge, no raw data revealed
4. **Authentication**: Biometric + PIN fallback
5. **Storage**: Encrypted via device secure storage
