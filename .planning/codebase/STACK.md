# Technology Stack

**Analysis Date:** 2026-02-21

## Languages

**Primary:**
- TypeScript ~5.9.2 - `zero-auth-wallet/package.json`

**Secondary:**
- JavaScript (Node/Express relay build and tooling) - `zero-auth-relay/dist/index.js`

## Runtime

**Environment:**
- Node.js (version not declared) - `package.json`

**Package Manager:**
- npm - `package.json`
- Lockfile: present for wallet (`zero-auth-wallet/package-lock.json`), missing at repo root (`package.json`)

## Frameworks

**Core:**
- Expo SDK ~54 - `zero-auth-wallet/package.json`
- React Native 0.81.5 - `zero-auth-wallet/package.json`
- React 19.1.0 - `zero-auth-wallet/package.json`
- Express (relay API) - `zero-auth-relay/dist/index.js`

**Testing:**
- Not detected (no test runner config in `.`)

**Build/Dev:**
- Expo Router - `zero-auth-wallet/package.json`
- Metro bundler config - `zero-auth-wallet/metro.config.js`
- Babel (Expo preset + Reanimated) - `zero-auth-wallet/babel.config.js`
- NativeWind + TailwindCSS - `zero-auth-wallet/tailwind.config.js`
- EAS Build profiles - `zero-auth-wallet/eas.json`

## Key Dependencies

**Critical:**
- snarkjs - `zero-auth-wallet/package.json`
- circomlib / circomlibjs - `zero-auth-wallet/package.json`
- @noble/curves / @noble/ed25519 / @noble/hashes - `zero-auth-wallet/package.json`
- expo-secure-store (key material storage) - `zero-auth-wallet/lib/wallet.ts`
- react-native-webview (ZK bridge execution) - `zero-auth-wallet/components/ZKEngine.tsx`
- zustand (state store) - `zero-auth-wallet/store/auth-store.ts`
- express / cors / uuid (relay API) - `zero-auth-relay/dist/index.js`

**Infrastructure:**
- @react-native-async-storage/async-storage (local persistence) - `zero-auth-wallet/lib/storage.ts`
- expo-file-system (ZK asset loading) - `zero-auth-wallet/lib/proof.ts`
- node-libs-react-native polyfills - `zero-auth-wallet/metro.config.js`

## Configuration

**Environment:**
- Relay env vars (PUBLIC_URL, NODE_ENV, PORT) - `zero-auth-relay/.env`
- Expo app config and EAS project metadata - `zero-auth-wallet/app.json`

**Build:**
- Metro config - `zero-auth-wallet/metro.config.js`
- Babel config - `zero-auth-wallet/babel.config.js`
- Tailwind/NativeWind config - `zero-auth-wallet/tailwind.config.js`
- TypeScript config - `zero-auth-wallet/tsconfig.json`
- EAS config - `zero-auth-wallet/eas.json`

## Platform Requirements

**Development:**
- Node.js + npm (scripts + dependencies) - `package.json`
- Expo CLI (run/build scripts) - `zero-auth-wallet/package.json`

**Production:**
- EAS build artifacts for mobile distribution - `zero-auth-wallet/eas.json`
- Relay deployment target not specified (no Dockerfile/compose in `.`)

---

*Stack analysis: 2026-02-21*
