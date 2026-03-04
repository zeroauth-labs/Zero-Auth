# STACK.md - Technology Stack

## Overview

Zero-Auth is a monorepo containing three main packages: a mobile wallet (React Native/Expo), a relay server (Node.js/Express), and a client SDK (TypeScript/JavaScript).

## Languages

| Package | Language | Version/Notes |
|---------|----------|---------------|
| zero-auth-relay | TypeScript | Target ES2022 |
| zero-auth-sdk | TypeScript | Target ES2020, outputs UMD/ESM |
| zero-auth-wallet | TypeScript | React Native via Expo SDK 54 |

## Runtimes

| Package | Runtime | Version |
|---------|---------|---------|
| zero-auth-relay | Node.js | >=18.0.0 |
| zero-auth-sdk | Browser/Node.js | Universal (UMD bundle) |
| zero-auth-wallet | React Native | Expo SDK 54, React 19 |

## Frameworks

### Backend (zero-auth-relay)
- **Express.js** ^4.18.2 - Web framework
- **tsx** - TypeScript executor for development

### SDK (zero-auth-sdk)
- **Rollup** - Module bundler for UMD/ESM output
- **React** - Optional peer dependency (for React integration)
- **QRCode** - QR code generation

### Mobile Wallet (zero-auth-wallet)
- **Expo SDK 54** - React Native framework
- **Expo Router 6** - File-based routing
- **NativeWind** - Tailwind CSS for React Native
- **React 19** / **React DOM 19**
- **Zustand** - State management
- **React Navigation 7** - Navigation

## Key Dependencies

### Cryptography & ZK Proofs
- `snarkjs` ^0.7.6 - ZK proof verification
- `@noble/curves`, `@noble/ed25519`, `@noble/hashes` - Cryptographic primitives
- `circomlib`, `circomlibjs` - ZK circuit library
- `poseidon-lite` - Hash function

### Backend
- `@supabase/supabase-js` ^2.39.0 - Database/Auth
- `express-rate-limit` - Rate limiting
- `cors`, `uuid`, `dotenv`

### Mobile Expo Modules
- `expo-secure-store`, `expo-camera`, `expo-crypto`
- `expo-local-authentication`, `expo-clipboard`
- `expo-blur`, `expo-image`, `expo-font`

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root + 3 workspace packages |
| `tsconfig.json` (x3) | TypeScript configs for each package |
| `rollup.config.js` | SDK UMD bundle configuration |
| `metro.config.js` | React Native bundler (polyfills for ZK) |
| `babel.config.js` | Expo + NativeWind + Reanimated |
| `tailwind.config.js` | Custom color theme |
| `eslint.config.js` | Expo ESLint config |
| `app.json` | Expo project configuration |
| `.env` / `.env.example` | Environment variables (relay) |

## Build/Dev Commands

```bash
# Root (monorepo orchestration)
npm run dev:relay      # Start backend
npm run dev:sdk        # Start SDK dev (watch mode)
npm run dev:wallet     # Start Expo dev server
npm run dev:all        # Run all three simultaneously
```

## Main Entry Points

- **Relay Server**: `zero-auth-relay/src/index.ts` (runs on port 3000)
- **SDK**: `zero-auth-sdk/src/index.tsx` (exports to `dist/`)
- **Wallet App**: `zero-auth-wallet/app/` (Expo Router file-based routing)
