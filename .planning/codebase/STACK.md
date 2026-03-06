# Technology Stack

**Analysis Date:** 2026-03-06

## Languages

**Primary:**
- **TypeScript** 5.9.x - All packages use TypeScript
- **Circom** - ZK circuit compilation (zero-auth-wallet)
- **JavaScript** - SDK UMD builds

**Secondary:**
- **SQL** - Supabase migrations and seeds
- **Bash** - Scripts and deployment

## Runtime

**Environment:**
- **Node.js** >=18.x - Development and production
- **React Native** 0.81.x - Mobile runtime (zero-auth-wallet)
- **Expo SDK** 54.x - Mobile framework

**Package Manager:**
- **npm** - Primary package manager
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- **Expo** ~54.0 - Mobile app framework
- **expo-router** ~6.0 - File-based routing
- **React** 19.x - UI library
- **Express** 4.18.x - Backend API
- **Zustand** 5.x - State management

**ZK/Cryptography:**
- **snarkjs** 0.7.x - ZK proof generation/verification
- **circomlib** 2.0.x - Cryptographic primitives
- **@noble/curves** 2.0.x - Elliptic curve operations
- **@noble/ed25519** 3.0.x - Ed25519 signatures

**UI:**
- **NativeWind** 4.x - Tailwind CSS for RN
- **TailwindCSS** 3.4.x - Styling
- **expo-camera** - QR scanning
- **react-native-qrcode-svg** - QR code generation

**Testing:**
- **Vitest** - Used in some packages
- **tsx** - TypeScript execution for dev

**Build/Dev:**
- **esbuild** - Fast bundling
- **Rollup** - SDK module bundling
- **tsc** - TypeScript compilation

## Key Dependencies

**Critical:**
- **@supabase/supabase-js** 2.39.x - Database client
- **expo-secure-store** - Secure credential storage
- **expo-local-authentication** - Biometric auth

**Infrastructure:**
- **Supabase** - Backend-as-a-Service (DB, Auth, Edge Functions)
- **EAS** - Expo Application Services (builds)

## Configuration

**Environment:**
- `.env.example` files present in packages
- Supabase URL and anon key required
- Auth credentials for Aadhaar verification

**Build:**
- `tsconfig.json` - TypeScript config
- `babel.config.js` - Babel transpilation
- `metro.config.js` - React Native bundler
- `tailwind.config.js` - Tailwind styling
- `eslint.config.js` - Linting rules
- `rollup.config.js` - SDK bundling

## Platform Requirements

**Development:**
- Node.js >=18
- npm
- Android Studio / Xcode (for native builds)
- EAS CLI (for builds)

**Production:**
- Android APK via EAS Build
- Supabase Cloud (hosted)
- Node.js server for relay (or serverless)

---

*Stack analysis: 2026-03-06*
