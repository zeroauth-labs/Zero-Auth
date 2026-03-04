# ARCHITECTURE.md - System Design and Patterns

## Overview

Zero-Auth follows a **three-component distributed architecture** with clear separation of concerns:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Wallet    │────▶│   Relay     │◀────│    SDK     │
│  (Mobile)   │     │  (Server)   │     │   (Web)    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Components

1. **zero-auth-wallet** (Mobile App)
   - React Native/Expo mobile application
   - Acts as the "holder" of credentials
   - Generates Zero-Knowledge Proofs locally

2. **zero-auth-relay** (Server)
   - Node.js/Express server
   - Acts as the "verifier" infrastructure
   - Manages verification sessions
   - Performs ZK proof verification
   - Uses Supabase for persistence

3. **zero-auth-sdk** (Web Integration Library)
   - JavaScript/TypeScript library
   - Embeddable in any web application
   - Provides UI components for verification flow

## Architecture Patterns

### 1. Layered Architecture (Clean Architecture)

Each component follows layers:
- **Wallet**: UI (screens/components) → Business Logic (lib/) → Data (store/)
- **Relay**: Routes → Services (validation/zk) → Database (db.ts)
- **SDK**: UI Components → Core (ZeroAuth class) → External (fetch)

### 2. Event-Driven Communication

- SDK polls Relay for status changes
- Wallet uses WebView message passing for ZK operations
- Deep links for wallet invocation (`zeroauth://verify?session=xxx`)

### 3. Repository Pattern

- Database operations abstracted in `db.ts`
- Supabase client singleton pattern

### 4. State Management

- **Zustand** for wallet state (lightweight, persist middleware)
- React Context for ZKEngine

### 5. Security Patterns

- **Proof Replay Protection**: Hash-based deduplication
- **PIN/Biometric Authentication**: Wallet app security
- **Secure Storage**: expo-secure-store for keys/salts
- **Proof of Knowledge**: ZK circuits (Groth16)

## Data Flow - Complete Verification Flow

```
1. SDK (Web)                          2. Relay (Server)                   3. Wallet (Mobile)
   ─────────                             ──────────────                      ───────────────

   User clicks                         ┌──────────────┐
   "Verify" button                     │ POST /sessions│──── Create Session
   ─────────────                       └──────┬───────┘
                                              │
   SDK polls                             ┌────▼────────┐
   /sessions/{id}     ◀───────────────   │ Return      │
   until COMPLETED                       │ session_id  │
                                         │ nonce       │
                                         │ qr_payload  │
                                         └─────────────┘
                                              │
                                              │ QR Payload includes:
                                              │ - session_id, nonce
                                              │ - verifier info (DID, callback)
                                              │ - required_claims
                                              │ - credential_type
                                              │ - expires_at
                                              ▼
                                        
                                         QR Code Display
                                              │
   ┌───────────────────────────────────────────┴─────────────────────────────────┐
   │                                                                              │
   │  QR Scanned by Wallet                                                        │
   │                                                                              │
   ▼                                                                              ▼
   
4. Wallet Parses QR
   ─────────────────
   - parseVerificationQR() validates structure
   - Checks expiry
   - Extracts verifier callback URL
   
5. Wallet Generates Proof
   ───────────────────────
   - User selects matching credential
   - ZKEngine (WebView) loads snarkjs + poseidon
   - generateProof() creates Groth16 proof
   - Proof proves credential attributes without revealing them
   
6. Wallet Submits Proof
   ────────────────────
   POST to callback URL
   { pi_a, pi_b, pi_c, publicSignals }
   
   ┌───────────────────────────────────────────┐
   │  3. Relay Verifies Proof                  │
   │  ─────────────────────────────────────    │
   │  - validateProofStructure()               │
   │  - verifyProof() using snarkjs.groth16    │
   │  - computeProofHash() for replay protection│
   │  - Update session status to COMPLETED     │
   └───────────────────────────────────────────┘
   
7. SDK Polling Detects COMPLETED
   ──────────────────────────────
   Returns success with claimed attributes
```

## Key Interfaces

### SDK (`zero-auth-sdk/src/index.ts`)

```typescript
// Main Class
export class ZeroAuth {
  constructor(config: ZeroAuthConfig)
  async verify(request?, options?): Promise<VerificationResult>
  async createSession(request?): Promise<SessionInfo>
  async getSessionStatus(sessionId): Promise<SessionInfo>
  async cancelSession(sessionId): Promise<void>
  generateQRBase64(payload, options?): Promise<string>
  generateDeeplink(sessionId): string
}

// Key Interfaces
interface ZeroAuthConfig {
  relayUrl: string;
  apiKey?: string;
  verifierName?: string;
  credentialType?: string;
  claims?: string[];
  timeout?: number;
}

interface VerificationRequest {
  credentialType: string;
  claims: string[];
  useCase?: 'LOGIN' | 'VERIFICATION' | 'TRIAL_LICENSE';
}

interface VerificationResult {
  success: boolean;
  sessionId?: string;
  claims?: Record<string, unknown>;
  error?: string;
  errorCode?: string;
}
```

### Relay Server API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/sessions` | Create verification session |
| GET | `/api/v1/sessions/:id` | Get session status |
| POST | `/api/v1/sessions/:id/proof` | Submit ZK proof |
| GET | `/health` | Health check |

### Wallet State (`zero-auth-wallet/store/auth-store.ts`)

```typescript
interface AuthState {
  sessions: Session[];
  history: Session[];
  credentials: Credential[];
  notifications: Notification[];
  
  // Actions
  addSession(session)
  terminateSession(id)
  addCredential(credential)
  removeCredential(id)
  clearAllData()
}

interface Credential {
  id: string;
  issuer: string;
  type: string;
  issuedAt: number;
  expiresAt?: number;
  attributes: Record<string, string | boolean | number>;
  commitments?: Record<string, string>;
  verified: boolean;
}
```

### ZK Bridge (`zero-auth-wallet/components/ZKEngine.tsx`)

```typescript
interface ZKContextType {
  execute(type: BridgeRequest['type'], payload: any): Promise<any>;
  status: 'offline' | 'initializing' | 'ready' | 'proving' | 'error';
}

type BridgeRequest = 
  | { type: 'POSEIDON_HASH', payload: number[] }
  | { type: 'GENERATE_PROOF', payload: { inputs, wasmB64, zkeyB64 } };
```

## Supported Credential Types

```typescript
const SUPPORTED_CREDENTIAL_TYPES = [
  'Age Verification',  // Proves user is 18+ without revealing birth year
  'Student ID',        // Proves student status without revealing details  
  'Trial'              // Simple non-ZK credential validation
];
```
