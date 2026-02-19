# Zero Auth Wallet 🛡️
[![V1 Stable](https://img.shields.io/badge/Status-V1_Stable-success.svg)](https://github.com/zeroauth-labs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Zero Auth** is a privacy-first Decentralized Identity (DID) wallet. It allows users to store credentials and verify attributes (like "Age > 18") using **Zero-Knowledge Proofs (ZKP)**—proving a statement is true without revealing the underlying data.

---

## 🏗️ Technical Architecture

### 1. Device-Bound Identity
Identity in Zero Auth is anchored to the hardware. 
- **Keys**: Every wallet generates a unique **Ed25519** keypair on-device.
- **Security**: The private key is stored in the device's hardware-backed SecureStore (iOS Keychain / Android Keystore) and never leaves the app.
- **DID**: We follow the W3C decentralized identifier standard using the `did:key` method (e.g., `did:key:z6Mkq...`).

### 2. Privacy via Zero-Knowledge
The wallet implements private commitments for user attributes.
- **Poseidon Hashing**: Attributes are hashed using the Poseidon algorithm, which is optimized for ZK circuits.
- **Proof Generation**: Logic for generating Groth16 proofs using `SnarkJS` is integrated, allowing the user to respond to verification requests (challenges) without exposing their raw attributes (PII).

---

## 🚀 Roadmap

### ✅ Phase 1: Foundation (Stable)
- On-device key generation (Ed25519) and persistence.
- Persistent credential storage and session history.
- QR Protocol parsing for verification requests.
- **Local ZK Engine**: Real-time Groth16 proof generation via SnarkJS/Poseidon.
- **Biometric Gating**: FaceID/Fingerprint enforcement for proof generation.

### 🟡 Phase 2: Ecosystem (In Progress)
- **[Relay System](https://github.com/zeroauth-labs/zero-auth-relay)**: A stateless hub for routing proofs between apps and the wallet.
- **[JS SDK](https://github.com/zeroauth-labs/zero-auth-sdk)**: Drop-in library for web developers to integrate Zero Auth.
- **Universal Scanning**: Inter-app deep linking Support.

### 🔴 Phase 3: Production Hardening
- **Native ZK Engine**: Migration to a C++/Rust native engine for ultra-fast proof generation on mobile.
- **Cloud Recovery**: Encrypted backup of credential metadata.

---

## 🛠️ Tech Stack
- **Framework**: [Expo](https://expo.dev/) (Managed Workflow)
- **State**: [Zustand](https://github.com/pmndrs/zustand) + Persistence
- **Crypto**: `@noble/curves`, `expo-crypto`, `expo-secure-store`
- **UI**: Tailwind CSS via [NativeWind v4](https://www.nativewind.dev/)
- **Theme**: Tokyo Night (Custom Design System)

---

## 🧑‍💻 For Developers
If you are building the **Relay** or **SDK**, please refer to the integration specifications in the respective repositories:
- **Relay Developers**: See the [Session lifecycle and Proof Callback spec](https://github.com/zeroauth-labs/zero-auth-relay).
- **Frontend/SDK Developers**: See the [QR Schema and Polling spec](https://github.com/zeroauth-labs/zero-auth-sdk).

---

## ⚡ Quick Start
1. **Install Dependencies**: `npm install`
2. **Start Development**: `npx expo start`
3. **Run on Device**: Use the [Expo Go](https://expo.dev/expo-go) app to scan the terminal QR code.

---
Built with ❤️ by [Zero Auth Labs](https://github.com/zeroauth-labs)

