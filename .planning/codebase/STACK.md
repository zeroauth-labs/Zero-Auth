# Technology Stack

This document outlines the technology stack used across the Zero-Auth ecosystem.

## Overview

Zero-Auth is a monorepo with three main packages:
- **zero-auth-wallet** - Mobile wallet app (React Native/Expo)
- **zero-auth-sdk** - JavaScript/TypeScript SDK for credential verification
- **zero-auth-relay** - Backend relay service (Express/Node.js)

---

## 1. zero-auth-wallet (Mobile App)

**Framework:** Expo SDK 54 with React Native 0.81.5

**Language:** TypeScript (~5.9.2)

### Key Dependencies

| Category | Dependencies |
|----------|--------------|
| Core Framework | `expo: ~54.0.33`, `react-native: 0.81.5`, `react: 19.1.0` |
| Navigation | `@react-navigation/native`, `@react-navigation/bottom-tabs` |
| Routing | `expo-router: ~6.0.23` |
| UI/Styling | `nativewind: ^4.2.1`, `tailwindcss: ^3.4.19`, `@expo/vector-icons` |
| State Management | `zustand: ^5.0.10` |
| Crypto/ZK | `snarkjs: ^0.7.6`, `circomlib: ^2.0.5`, `circomlibjs: ^0.1.7`, `@noble/curves`, `@noble/ed25519`, `@noble/hashes` |
| Storage | `@react-native-async-storage/async-storage`, `expo-secure-store` |
| Hardware | `expo-local-authentication`, `expo-camera`, `expo-crypto` |
| Animations | `react-native-reanimated: ~4.1.1`, `react-native-gesture-handler` |
| QR Codes | `react-native-qrcode-svg` |

### Build Tools
- `esbuild: ^0.27.3`
- `typescript: ~5.9.2`
- `eslint: ^9.25.0` with `eslint-config-expo`

### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

---

## 2. zero-auth-sdk (JavaScript/TypeScript Library)

**Purpose:** Passwordless ZK credential verification SDK

**Language:** TypeScript (^5.0.0)

**Type:** ESM module with UMD build option

### Build Configuration

| Build Step | Tool |
|------------|------|
| ESM Build | `tsc` |
| UMD Build | `rollup` |
| Dev Watch | `tsc --watch` |

### Key Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `qrcode` | ^1.5.3 | QR code generation |
| `react` | >=16.8.0 | Peer dependency (optional) |
| `react-dom` | >=16.8.0 | Peer dependency (optional) |

### DevDependencies

| Tool | Version | Purpose |
|------|---------|---------|
| `rollup` | ^4.0.0 | Bundle for UMD |
| `@rollup/plugin-node-resolve` | ^15.0.0 | Node resolution |
| `@rollup/plugin-typescript` | ^11.0.0 | TypeScript integration |
| `rollup-plugin-peer-deps-external` | ^2.2.4 | External peer deps |

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "jsx": "react-jsx",
    "declaration": true,
    "strict": true,
    "moduleResolution": "node"
  }
}
```

---

## 3. zero-auth-relay (Backend Service)

**Framework:** Express.js (^4.18.2)

**Runtime:** Node.js (>=18.0.0)

**Language:** TypeScript (^5.3.3)

### Key Dependencies

| Category | Dependencies |
|----------|--------------|
| Server | `express: ^4.18.2`, `cors: ^2.8.5` |
| Database | `@supabase/supabase-js: ^2.39.0` |
| Security | `express-rate-limit: ^8.2.1` |
| Crypto | `snarkjs: ^0.7.6` |
| Utils | `uuid: ^9.0.0`, `dotenv: ^17.3.1` |

### DevDependencies

| Tool | Version |
|------|---------|
| `tsx` | ^4.7.0 |
| `typescript` | ^5.3.3 |
| `@types/node` | ^20.10.0 |
| `@types/express` | ^4.17.21 |
| `@types/cors` | ^2.8.17 |
| `@types/uuid` | ^9.0.7 |
| `@types/snarkjs` | ^0.7.9 |

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Scripts
```json
{
  "dev": "tsx watch src/index.ts",
  "start": "tsx src/index.ts",
  "build": "tsc --noEmit"
}
```

---

## 4. Root Package (Monorepo Orchestration)

**Language:** JavaScript

**Tools:** 
- `concurrently: ^8.2.2` - Run multiple services
- `wait-on: ^7.2.0` - Wait for services to be ready

### Available Scripts

| Script | Command |
|--------|---------|
| `dev:relay` | `cd zero-auth-relay && npm run dev` |
| `dev:sdk` | `cd zero-auth-sdk/examples/basic && npm run dev` |
| `dev:wallet` | `cd zero-auth-wallet && npx expo start --tunnel` |
| `dev:all` | Run all services concurrently |
| `install:all` | Install all dependencies |

---

## Summary Table

| Package | Language | Framework | Key Technologies |
|---------|----------|-----------|------------------|
| zero-auth-wallet | TypeScript | Expo/React Native 0.81 | NativeWind, snarkjs, zustand, expo-router |
| zero-auth-sdk | TypeScript | Library (ESM/UMD) | qrcode, React (peer) |
| zero-auth-relay | TypeScript | Express.js | Supabase, snarkjs, Node.js |
| Root | JavaScript | Monorepo | concurrently |

---

## File Paths (Examples)

- Root package.json: `/home/harsh/Documents/Zero-Auth/package.json`
- Wallet package.json: `/home/harsh/Documents/Zero-Auth/zero-auth-wallet/package.json`
- SDK package.json: `/home/harsh/Documents/Zero-Auth/zero-auth-sdk/package.json`
- Relay package.json: `/home/harsh/Documents/Zero-Auth/zero-auth-relay/package.json`
- Wallet tsconfig: `/home/harsh/Documents/Zero-Auth/zero-auth-wallet/tsconfig.json`
- SDK tsconfig: `/home/harsh/Documents/Zero-Auth/zero-auth-sdk/tsconfig.json`
- Relay tsconfig: `/home/harsh/Documents/Zero-Auth/zero-auth-relay/tsconfig.json`
