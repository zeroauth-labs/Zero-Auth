# External Integrations

This document describes all external services, APIs, and integrations used in the ZeroAuth codebase.

## Overview

ZeroAuth is a zero-knowledge proof authentication system consisting of three main components:
- **Wallet** (Mobile App): React Native/Expo mobile application
- **Relay** (Server): Node.js/Express backend server
- **SDK** (Web): JavaScript/TypeScript SDK for web integration

Each component integrates with external services for database storage, authentication, cryptography, and QR code generation.

---

## 1. Database Services

### Supabase (PostgreSQL)

**Component**: zero-auth-relay

**Purpose**: Session storage, credential management, and verification keys storage

**Environment Variables**:
```
SUPABASE_URL=https://viosipylwvcscavdwguj.supabase.co
SUPABASE_ANON_KEY=<JWT_ANON_KEY>
```

**Usage** (from `zero-auth-relay/src/db.ts`):
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => {
      // Add timeout to all Supabase requests
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DB_QUERY_TIMEOUT);
      return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
    },
  },
});
```

**Database Tables**:
- `sessions`: Stores verification sessions (session_id, nonce, verifier_name, required_claims, credential_type, status, proof, proof_hash, expires_at)
- `verification_keys`: Stores ZK verification keys (credential_type, key_data)

**Key Functions**:
- `createSession()` - Create new verification session
- `getSession()` - Retrieve session by ID
- `updateSession()` - Update session status/proof
- `cleanupExpiredSessions()` - Delete expired sessions
- `getVerificationKey()` - Retrieve ZK verification key
- `listCredentialTypes()` - List available credential types

---

## 2. Cryptography & Security

### snarkjs

**Component**: zero-auth-relay, zero-auth-wallet

**Purpose**: Zero-knowledge proof verification (Groth16 protocol)

**Package**: `snarkjs@^0.7.6`

**Usage** (from `zero-auth-relay/src/zk.ts`):
```typescript
import * as snarkjs from 'snarkjs';

// Verify ZK proof
const result = await snarkjs.groth16.verify(vKey, publicSignals, formattedProof);
```

**Key Functions**:
- `groth16.verify()` - Verify Groth16 ZK proofs
- `loadVerificationKeysFromDb()` - Load verification keys from database

### @noble/curves & @noble/ed25519

**Component**: zero-auth-wallet

**Purpose**: Elliptic curve cryptography for identity management

**Packages**:
- `@noble/curves@^2.0.1` - Curve operations
- `@noble/ed25519@^3.0.0` - Ed25519 signing
- `@noble/hashes@^2.0.1` - Hashing utilities

**Usage** (from `zero-auth-wallet/lib/wallet.ts`):
```typescript
import { ed25519 } from '@noble/curves/ed25519';

// Generate keypair
const privateKey = new Uint8Array(32);
getRandomValues(privateKey);
const publicKey = ed25519.getPublicKey(privateKey);

// Sign messages
const signature = ed25519.sign(msgBytes, privateKey);
```

### expo-secure-store

**Component**: zero-auth-wallet

**Purpose**: Secure storage for private keys on mobile devices

**Package**: `expo-secure-store@~15.0.8`

**Usage**:
```typescript
import * as SecureStore from 'expo-secure-store';

// Store private key
await SecureStore.setItemAsync(PRIVATE_KEY_ALIAS, toBase64(privateKey), {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
});

// Retrieve private key
const storedSk = await SecureStore.getItemAsync(PRIVATE_KEY_ALIAS);
```

### expo-local-authentication

**Component**: zero-auth-wallet

**Purpose**: Biometric authentication (fingerprint, Face ID)

**Package**: `expo-local-authentication@^17.0.8`

**Usage** (from `zero-auth-wallet/app/approve-request.tsx`):
```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const auth = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Authenticate to approve request',
  fallbackLabel: 'Use PIN',
});
```

---

## 3. QR Code Generation

### qrcode

**Component**: zero-auth-sdk

**Purpose**: Generate QR codes for session transfer between web and mobile

**Package**: `qrcode@^1.5.3`

**Usage** (from `zero-auth-sdk/src/index.ts`):
```typescript
import * as QRCode from 'qrcode';

// Generate QR as data URL
const dataUrl = await QRCode.toDataURL(payload, opts);

// Generate QR on canvas
await QRCode.toCanvas(canvas, payload, opts);
```

**Options**:
- `width` - QR code width in pixels
- `color` - Dark module color
- `backgroundColor` - Background color
- `errorCorrectionLevel` - Error correction level (L, M, Q, H)

---

## 4. Web Framework & Middleware

### Express.js

**Component**: zero-auth-relay

**Purpose**: HTTP server for relay API

**Package**: `express@^4.18.2`

**Usage** (from `zero-auth-relay/src/index.ts`):
```typescript
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/v1/sessions', async (req, res) => {
  // Handle session creation
});
```

### CORS

**Component**: zero-auth-relay

**Purpose**: Cross-Origin Resource Sharing

**Package**: `cors@^2.8.5`

### Express Rate Limit

**Component**: zero-auth-relay

**Purpose**: Rate limiting to prevent abuse

**Package**: `express-rate-limit@^8.2.1`

**Configuration**:
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
});
```

---

## 5. Relay API Endpoints

### Base URL
```
Production: https://zeroauth-relay.onrender.com
Development: http://localhost:3000
```

### Endpoints

#### Create Session
```
POST /api/v1/sessions
Content-Type: application/json
X-API-Key: <optional_api_key>

Request:
{
  "verifier_name": "Example Verifier",
  "credential_type": "Age Verification",
  "required_claims": ["birth_year"]
}

Response:
{
  "session_id": "uuid",
  "nonce": "uuid",
  "qr_payload": "{...}"
}
```

#### Get Session Status
```
GET /api/v1/sessions/:id

Response:
{
  "session_id": "uuid",
  "status": "PENDING|COMPLETED|EXPIRED",
  "proof": {...}
}
```

#### Submit Proof
```
POST /api/v1/sessions/:id/proof
Content-Type: application/json

Request:
{
  "pi_a": [...],
  "pi_b": [...],
  "pi_c": [...],
  "protocol": "groth16",
  "curve": "bn128"
}

Response:
{
  "success": true
}
```

#### Health Check
```
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.1.0",
  "uptime": 1234.56
}
```

---

## 6. Environment Variables

### zero-auth-relay

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SUPABASE_URL` | Yes | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (JWT) | `eyJhbGci...` |
| `PUBLIC_URL` | Yes | Public URL of relay server | `https://zeroauth-relay.onrender.com` |
| `RELAY_DID` | No | Relay DID (auto-derived from PUBLIC_URL) | `did:web:example.com` |
| `NODE_ENV` | No | Environment (development/production) | `production` |
| `PORT` | No | Server port (default: 3000) | `10000` |
| `DB_QUERY_TIMEOUT` | No | Database query timeout in ms (default: 10000) | `10000` |
| `ZK_VERIFICATION_KEY` | No | Base64-encoded ZK verification key (fallback) | `<base64_or_file_path>` |

### zero-auth-sdk

The SDK is configured at runtime:

```typescript
import { ZeroAuth } from '@zero-auth/sdk';

const zk = new ZeroAuth({
  relayUrl: 'https://zeroauth-relay.onrender.com',
  apiKey: 'optional_api_key',  // For verifier authentication
  verifierName: 'My Verifier',
  credentialType: 'Age Verification',
  claims: ['birth_year'],
  timeout: 60,
});
```

---

## 7. Mobile App Integrations (Expo)

### expo-crypto

**Component**: zero-auth-wallet

**Purpose**: Cryptographically secure random number generation

**Package**: `expo-crypto@~15.0.8`

### @react-native-async-storage/async-storage

**Component**: zero-auth-wallet

**Purpose**: Persistent storage for credentials and app state

**Package**: `@react-native-async-storage/async-storage@^2.2.0`

### expo-camera

**Component**: zero-auth-wallet

**Purpose**: QR code scanning

**Package**: `expo-camera@~17.0.10`

### expo-linking

**Component**: zero-auth-wallet

**Purpose**: Deep linking for wallet callbacks

**Package**: `expo-linking@~8.0.11`

### react-native-qrcode-svg

**Component**: zero-auth-wallet

**Purpose**: QR code display in mobile app

**Package**: `react-native-qrcode-svg@^6.3.21`

---

## 8. Supported Credential Types

The system supports the following credential types:

1. **Age Verification** - Proves user is over a certain age without revealing exact birthdate
2. **Student ID** - Proves student status without revealing personal details
3. **Trial** - Limited trial access verification

---

## 9. DID (Decentralized Identifier)

### did:key Method

**Component**: zero-auth-wallet

**Purpose**: Self-sovereign identity based on Ed25519 keys

**Format**: `did:key:z<base58btc_encoded_key>`

**Implementation** (from `zero-auth-wallet/lib/wallet.ts`):
```typescript
export function deriveDID(publicKey: Uint8Array): string {
  const multicodecPrefix = new Uint8Array([0xed, 0x01]); // Ed25519
  const bytes = new Uint8Array(multicodecPrefix.length + publicKey.length);
  bytes.set(multicodecPrefix, 0);
  bytes.set(publicKey, multicodecPrefix.length);
  
  const encoded = bs58.encode(bytes);
  return `did:key:z${encoded}`;
}
```

---

## 10. Deep Links

### zeroauth:// Protocol

**Purpose**: Open wallet app directly from web SDK

**Format**: `zeroauth://verify?session=<session_id>`

**Usage** (from `zero-auth-sdk/src/index.ts`):
```typescript
generateDeeplink(sessionId: string): string {
  return `zeroauth://verify?session=${sessionId}`;
}
```

---

## Summary Table

| Integration | Type | Component | Purpose |
|-------------|------|-----------|---------|
| Supabase | Database | Relay | Session & key storage |
| snarkjs | Cryptography | Relay, Wallet | ZK proof verification |
| @noble/curves | Cryptography | Wallet | Ed25519 key management |
| expo-secure-store | Security | Wallet | Private key storage |
| expo-local-auth | Security | Wallet | Biometric authentication |
| qrcode | Utility | SDK | QR code generation |
| Express.js | Web Framework | Relay | HTTP API server |
| CORS | Middleware | Relay | Cross-origin requests |
| Rate Limit | Security | Relay | DDoS protection |

