# Zero Auth Wallet 🛡️

[![Version](https://img.shields.io/badge/Version-1.2.000-blue.svg)]()
[![Status](https://img.shields.io/badge/Status-Stable-success.svg)](https://github.com/zeroauth-labs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Zero Auth** is a privacy-first Decentralized Identity (DID) wallet built with Expo/React Native. It allows users to store credentials and verify attributes (like "Age > 18") using **Zero-Knowledge Proofs (ZKP)**—proving a statement is true without revealing the underlying data.

---

## Core Features

### 🔐 Device-Bound Identity
- **Ed25519 Keypair**: Every wallet generates a unique cryptographic keypair on-device
- **Hardware Security**: Private keys are stored in the device's hardware-backed SecureStore (iOS Keychain / Android Keystore)
- **W3C DID**: Follows the `did:key` standard (e.g., `did:key:z6Mk...`)
- **Key Recovery**: Export/backup secret recovery key with biometric authentication

### 🪪 Credential Management
- **Multiple Credential Types**: Support for Age Verification, Student ID, Trial credentials
- **Secure Storage**: Credentials stored with cryptographic salts in SecureStore
- **Credential Selection**: When multiple credentials match a request, users can choose which to present
- **Expiry Handling**: Automatic validation of credential expiration before proof generation

### 🔒 Zero-Knowledge Proofs
- **Poseidon Hashing**: Privacy-preserving commitments for user attributes
- **Groth16 Proofs**: Full ZK proof generation via SnarkJS
- **ZK Bridge**: WebView-based ZK engine for mobile optimization
- **Circuit Caching**: Efficient in-memory caching of circuit files (max 5 circuits)
- **Proof Timeout**: 90-second timeout protection for proof generation

### 🛡️ Security Features
- **Biometric Authentication**: FaceID/Fingerprint required before proof generation
- **PIN Fallback**: Secure PIN as backup when biometrics unavailable
- **Revocation Checking**: Validates credential status before each proof
- **Session Management**: Active session tracking with remote revocation support

### 📱 User Experience
- **QR Verification**: Scan QR codes to receive verification requests
- **Deep Linking**: Support for `zeroauth://` URL scheme
- **Dynamic UI**: Context-aware messages based on use case (LOGIN, VERIFICATION, TRIAL_LICENSE)
- **Offline Support**: Queue actions when offline, sync when back online
- **Custom Alerts**: Themed modal alerts (success/error/warning/info)

### 💾 Data Management
- **Encrypted Storage**: Zustand persist with AsyncStorage
- **Storage Quota**: 5MB limit with usage tracking
- **Backup/Export**: Export credentials (without salts) for backup
- **History Tracking**: Complete audit trail of verifications

---

## Technical Architecture

### Cryptography
| Component | Algorithm | Purpose |
|-----------|-----------|---------|
| Identity Keys | Ed25519 | Device-bound keypair |
| Attribute Hashing | Poseidon | ZK-friendly commitments |
| Proofs | Groth16 (SnarkJS) | Zero-knowledge verification |
| PIN Hashing | SHA-256 | Secure PIN storage |

### Supported Credential Types
- **Age Verification**: Proves user is 18+ without revealing birth year
- **Student ID**: Proves student status without revealing personal details
- **Trial**: Simple trial license activation

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Expo (Managed Workflow) |
| Language | TypeScript |
| State | Zustand + Persistence |
| Crypto | @noble/curves, expo-crypto, expo-secure-store |
| UI | Tailwind CSS via NativeWind v4 |
| Theme | Tokyo Night (Custom Design System) |

---

## Project Structure

```
zero-auth-wallet/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   └── add-credential/    # Credential issuance flow
├── components/             # Reusable UI components
├── constants/             # Theme and configuration
├── hooks/                 # Custom React hooks
├── lib/                   # Core business logic
│   ├── wallet.ts         # Identity management
│   ├── proof.ts          # ZK proof generation
│   ├── hashing.ts        # Poseidon hashing
│   ├── qr-protocol.ts    # QR parsing/validation
│   ├── revocation.ts     # Credential revocation
│   ├── offline.ts        # Offline queue management
│   └── storage.ts        # Persistence utilities
├── store/                 # Zustand state stores
└── circuits/              # ZK circuit files (Circom)
```

---

## Versioning

This project follows **Semantic Versioning**:
- **Major (1.x.000)**: Breaking changes, major features
- **Minor (x.2.000)**: Medium updates, new features
- **Patch (x.x.001)**: Bug fixes, small improvements

---

## Links

- [Website](https://zeroauth.dev)
- [GitHub](https://github.com/zeroauth-labs)
- [Relay Server](https://github.com/zeroauth-labs/zero-auth-relay)
- [JS SDK](https://github.com/zeroauth-labs/zero-auth-sdk)

---

Built with ❤️ by [Zero Auth Labs](https://github.com/zeroauth-labs)
