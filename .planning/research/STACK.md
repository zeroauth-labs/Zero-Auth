# Stack Research

**Domain:** Passwordless credential wallet + relay service + TS/JS SDK
**Researched:** 2026-02-19
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | 54.0.0 | Wallet app runtime + APK builds | Expo SDK 54 targets React Native 0.81 and provides a managed-to-bare path (prebuild + dev client) that keeps Expo Go parity while enabling native modules needed for Keystore and crypto. |
| React Native | 0.81 (via Expo SDK 54) | Mobile UI/runtime | Standard RN baseline for Expo 54; stable in 2025/2026 releases and aligns with Expo-managed upgrade cadence. |
| Node.js (LTS) | 24.13.1 | Relay service runtime + tooling | Current LTS with security fixes and modern runtime features; aligns with Fastify 5 and modern TypeScript tooling. |
| Fastify | 5.7.4 | Relay HTTP API | High-performance Node server with strong schema validation and TypeScript support; common for low-latency relay services. |
| PostgreSQL | 18 (current docs) | Relay persistence | Default choice for transactional relay metadata, audit trails, and credential indexes; stable and well-supported. |
| TypeScript | 5.9.3 | Wallet, relay, SDK typing | Latest stable compiler as of research date; keeps SDK type surface accurate and backward-compatible builds consistent. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-keychain | 10.0.0 | Android Keystore-backed secure storage | Store encrypted private material, device-bound secrets, and biometric-protected items. |
| react-native-quick-crypto | 1.0.13 | Node-compatible crypto in RN | Use for hashing, signing, and ZK-related crypto where WebCrypto is incomplete in RN. |
| react-native-mmkv | 4.1.2 | High-performance non-secret storage | Cache non-sensitive state, proof metadata, and sync flags; keep secrets in Keystore. |
| tsup | 8.5.1 | TS/JS SDK bundling | Produces dual CJS/ESM builds with types; good for backward-compatible SDK distribution. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| EAS Build / EAS CLI | APK builds, native module integration | Required to move from Expo Go to real APKs and include Keystore-native modules. |
| Android Studio + SDK | Native builds and debugging | Needed for Keystore testing and CI builds for APK parity. |

## Installation

```bash
# Core
npm install expo@54 react-native@0.81 fastify@5.7.4

# Supporting
npm install react-native-keychain@10.0.0 react-native-quick-crypto@1.0.13 react-native-mmkv@4.1.2

# Dev dependencies
npm install -D typescript@5.9.3 tsup@8.5.1
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Expo SDK 54 (managed + dev client) | Bare React Native 0.84 | Use bare RN if you need immediate access to the newest RN features outside Expo’s release cadence. |
| Fastify 5 | NestJS 10+ | Use NestJS if you need opinionated DI and modularity across many services. |
| react-native-keychain | expo-secure-store | SecureStore is fine for basic secrets but is less flexible for custom Keystore policies and is limited outside Expo. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Expo Go for production-like testing | Expo Go cannot load custom native modules, so Keystore and crypto integrations won’t work. | EAS dev client + APK builds. |
| AsyncStorage for secrets | Not encrypted, not hardware-backed; easy to exfiltrate on rooted devices. | react-native-keychain with Keystore-backed storage. |
| react-native-crypto (deprecated) | Outdated and incomplete Node crypto compatibility. | react-native-quick-crypto. |

## Stack Patterns by Variant

**If staying Expo-managed with native modules:**
- Use Expo SDK 54 + EAS dev client + config plugins
- Because it keeps Expo Go parity while enabling Keystore-native code in APKs

**If dropping Expo to bare RN:**
- Use React Native 0.84 + native Android Keystore module + Gradle control
- Because it removes Expo release cadence constraints and maximizes native control

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| expo@54.0.0 | react-native@0.81 | Expo 54 targets RN 0.81 per Expo version matrix. |
| expo@54.0.0 | node >=20.19 | Expo 54 minimum Node version per Expo docs; Node 24 LTS satisfies this. |

## Sources

- https://docs.expo.dev/versions/latest/ — Expo SDK 54 matrix (RN 0.81, Node minimums)
- https://github.com/facebook/react-native/releases — React Native 0.84.0 release info
- https://nodejs.org/en/download — Node.js LTS 24.13.1
- https://github.com/fastify/fastify/releases — Fastify 5.7.4
- https://www.postgresql.org/docs/ — PostgreSQL 18 current docs
- https://github.com/microsoft/TypeScript/releases — TypeScript 5.9.3
- https://github.com/oblador/react-native-keychain/releases — react-native-keychain 10.0.0
- https://github.com/margelo/react-native-quick-crypto/releases — react-native-quick-crypto 1.0.13
- https://github.com/mrousavy/react-native-mmkv/releases — react-native-mmkv 4.1.2
- https://github.com/egoist/tsup/releases — tsup 8.5.1

---
*Stack research for: passwordless credential wallet + relay service + TS/JS SDK*
*Researched: 2026-02-19*
