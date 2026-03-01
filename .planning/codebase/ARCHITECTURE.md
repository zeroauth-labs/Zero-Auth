# Zero-Auth Architecture

This document describes the architectural patterns, key components, and data flow across the Zero-Auth ecosystem.

---

## 1. Overall Architecture Pattern

Zero-Auth follows a **three-tier distributed architecture** with a clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         VERIFIER (Website/App)                          │
│                   Uses zero-auth-sdk to request proof                  │
│                         (zero-auth-sdk/)                               │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ QR Code / Session API
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         RELAY SERVER                                    │
│              Session management & ZK proof verification               │
│                         (zero-auth-relay/)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Express API  │  │  Supabase    │  │   snarkjs    │                 │
│  │              │──│   Database   │  │  Verification│                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ Proof Submission
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         WALLET APP                                      │
│           Mobile app for credential management & proof generation     │
│                         (zero-auth-wallet/)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Expo Router  │  │    ZKEngine  │  │   zustand    │                 │
│  │   (UI)       │  │  (WebView)   │  │   (State)    │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architectural Principles

1. **Trust Minimization**: Zero-knowledge proofs allow credential verification without revealing underlying data
2. **Decentralized Identity**: Users control their own credentials using did:key (Ed25519)
3. **Session-Based**: All verifications use ephemeral sessions with timeouts
4. **Mobile-First**: Wallet is designed as a React Native mobile app

---

## 2. Key Components and Responsibilities

### 2.1 zero-auth-wallet (Mobile Wallet)

**Location:** `/home/harsh/Documents/Zero-Auth/zero-auth-wallet/`

#### Entry Points

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout with ZKProvider, navigation stack |
| `app/(tabs)/index.tsx` | Home screen with active sessions |
| `app/(tabs)/credentials.tsx` | Credential management UI |
| `app/(tabs)/scanner.tsx` | QR code scanner for verification requests |
| `app/add-credential/index.tsx` | Credential import/creation flow |

#### Core Components

| Component | File Path | Responsibility |
|-----------|-----------|----------------|
| `ZKProvider` | `components/ZKEngine.tsx` | WebView-based ZK proof generation engine |
| `SessionCard` | `components/SessionCard.tsx` | Display active/revoked sessions |
| `NotificationModal` | `components/NotificationModal.tsx` | Push notification display |
| `CustomAlert` | `components/CustomAlert.tsx` | Reusable alert dialogs |

#### State Management (Zustand)

| Store | File Path | Purpose |
|-------|-----------|---------|
| `useWalletStore` | `store/wallet-store.ts` | Wallet identity (DID, public key), initialization state |
| `useAuthStore` | `store/auth-store.ts` | Credentials, sessions, notifications, PIN/biometrics |

#### Key Libraries

| Library | Purpose |
|---------|---------|
| `@noble/ed25519` | Ed25519 key generation for did:key identity |
| `snarkjs` | ZK proof generation (via WebView bridge) |
| `expo-secure-store` | Secure storage for private keys |
| `expo-camera` | QR code scanning |
| `nativewind` | TailwindCSS for React Native |

#### Credential Types Supported

- **Age Verification**: Proves user is over 18 without revealing birth year
- **Student ID**: Proves student status without revealing specific details
- **Trial**: Simple credential for trial license verification

---

### 2.2 zero-auth-sdk (JavaScript SDK)

**Location:** `/home/harsh/Documents/Zero-Auth/zero-auth-sdk/`

#### Entry Points

| File | Purpose |
|------|---------|
| `src/index.ts` | Pure JavaScript SDK (ZeroAuth class) |
| `src/index.tsx` | React components and hooks |

#### Core Classes

**`ZeroAuth` (src/index.ts)**
```typescript
// Main SDK class - handles verification flow
class ZeroAuth {
  constructor(config: ZeroAuthConfig)
  verify(request?, options?): Promise<VerificationResult>
  createSession(request?): Promise<SessionInfo>
  generateQRBase64(payload, options?): Promise<string>
  cancelSession(sessionId): Promise<void>
}
```

#### React Components

| Component | Purpose |
|-----------|---------|
| `ZeroAuthProvider` | Context provider for SDK configuration |
| `ZeroAuthButton` | Pre-styled button that triggers verification |
| `ZeroAuthModal` | Modal with QR code display and status |
| `ZeroAuthQR` | Standalone QR code generator |
| `useZeroAuthVerification` | Hook for custom verification flows |

#### Key Functions

| Function | Purpose |
|----------|---------|
| `validateConfig()` | Validates SDK configuration |
| `validateQRPayload()` | Validates QR payload structure and expiry |
| `generateNonce()` | Cryptographically secure nonce generation |

---

### 2.3 zero-auth-relay (Backend Service)

**Location:** `/home/harsh/Documents/Zero-Auth/zero-auth-relay/`

#### Entry Point

**`src/index.ts`** - Express server with routes:
- `POST /api/v1/sessions` - Create verification session
- `GET /api/v1/sessions/:id` - Get session status
- `POST /api/v1/sessions/:id/proof` - Submit ZK proof
- `GET /health` - Health check

#### Core Modules

| Module | File Path | Responsibility |
|--------|-----------|----------------|
| `db.ts` | `src/db.ts` | Supabase database operations |
| `zk.ts` | `src/zk.ts` | ZK proof verification using snarkjs |
| `validation.ts` | `src/validation.ts` | Request validation middleware |
| `errors.ts` | `src/errors.ts` | Error code definitions |

#### Database Schema (Supabase)

**sessions table:**
```sql
- session_id (UUID, PK)
- nonce (UUID)
- verifier_name (text)
- required_claims (JSON)
- credential_type (text)
- status (PENDING | COMPLETED | EXPIRED)
- proof (JSON)
- proof_hash (text)
- expires_at (timestamp)
```

**verification_keys table:**
```sql
- credential_type (text, PK)
- key_data (JSON) - ZK verification key
```

#### Security Features

1. **Rate Limiting**: 500 requests per 15 minutes per IP
2. **Proof Replay Protection**: Hash-based duplicate detection
3. **ZK Verification**: Cryptographic proof verification (fail-closed)
4. **Session Timeouts**: 5-minute expiration on all sessions

---

## 3. Data Flow Between Components

### 3.1 Verification Flow

```
┌─────────────┐     1. createSession()      ┌─────────────┐
│   Verifier  │ ─────────────────────────▶ │    Relay    │
│   (SDK)     │                            │   Server    │
└─────────────┘                            └──────┬──────┘
     │                                             │
     │  2. Return session + QR payload            │
     │◀────────────────────────────────────────────┤
     │
     │  3. Display QR code
     │
     ▼
┌─────────────┐     4. Scan QR code       ┌─────────────┐
│    Wallet   │ ◀───────────────────────── │   Verifier  │
│    App      │                            │   (SDK)     │
└──────┬──────┘                            └─────────────┘
       │
       │ 5. Parse QR payload
       │   - session_id
       │   - verifier info
       │   - required_claims
       │   - credential_type
       │
       │ 6. Select matching credential
       │   (from useAuthStore)
       │
       │ 7. Generate ZK proof
       │   (via ZKEngine WebView)
       │
       │ 8. Submit proof to relay
       │   POST /api/v1/sessions/{id}/proof
       ▼
┌─────────────┐                            ┌─────────────┐
│    Wallet   │ ───────────────────────▶ │    Relay    │
│    App      │     9. Proof submission  │   Server    │
└─────────────┘                            └──────┬──────┘
                                                   │
                                                   │ 10. Verify ZK proof
                                                   │    (snarkjs.groth16.verify)
                                                   │
                                                   │ 11. Update session status
                                                   │    to COMPLETED
                                                   ▼
                                            ┌─────────────┐
                                            │    Relay    │
                                            │   Server    │
                                            └─────────────┘
                                                   │
                                                   │ 12. Polling returns
                                                   │    COMPLETED status
                                                   ▼
                                            ┌─────────────┐
                                            │   Verifier  │
                                            │    (SDK)    │
                                            └─────────────┘
```

### 3.2 Credential Import Flow

```
┌─────────────┐
│    Wallet   │
│    App      │
└──────┬──────┘
       │
       │ 1. User selects "Add Credential"
       │    (app/add-credential/index.tsx)
       │
       │ 2. Choose import method
       │    - Form entry
       │    - QR code scan
       │    - Import file
       │
       │ 3. Validate credential data
       │
       │ 4. Generate salt (expo-secure-store)
       │
       │ 5. Calculate Poseidon commitments
       │    (for ZK proof generation)
       │
       │ 6. Store in useAuthStore
       │    (persisted to AsyncStorage)
       ▼
┌─────────────┐
│    Wallet   │
│   Storage   │
└─────────────┘
```

### 3.3 ZK Proof Generation (Wallet)

```
┌────────────────────────────────────────────────────────────────┐
│                     Wallet App (Native)                        │
│                                                                │
│  generateProof()  ───────────────────────────────────────────┐ │
│       │                                                      │ │
│       ▼                                                      │ │
│  ┌─────────────────┐                                         │ │
│  │ Load circuit   │  age_check.zkey, student_check.zkey    │ │
│  │ files (assets) │  (bundled in app)                       │ │
│  └────────┬────────┘                                         │ │
│           │                                                   │ │
│           ▼                                                   │ │
│  ┌─────────────────┐                                         │ │
│  │ Prepare inputs │  birth_year, salt, commitment           │ │
│  │ (credential)   │                                         │ │
│  └────────┬────────┘                                         │ │
│           │                                                   │ │
└───────────┼───────────────────────────────────────────────────┘ │
            │                                                    │
            │  execute('GENERATE_PROOF', {inputs, wasm, zkey}) │
            ▼                                                    │
┌────────────────────────────────────────────────────────────────┐
│                    ZKEngine (WebView)                          │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Inject snarkjs + poseidon libraries                    │  │
│  │ (from assets/snarkjs.bundle, assets/poseidon.bundle)  │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                      │
│                         ▼                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ snarkjs.groth16.fullProve(inputs, wasm, zkey)        │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                      │
│                         ▼                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Return { proof: { pi_a, pi_b, pi_c }, publicSignals } │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Abstractions and Patterns

### 4.1 State Management Pattern (Zustand)

The wallet uses **Zustand** with the following pattern:

```typescript
// Store definition with typed state and actions
export const useWalletStore = create<WalletState>((set) => ({
  isInitialized: false,
  did: null,
  
  checkInitialization: async () => { ... },
  initializeWallet: async () => { ... },
}));

// Usage in components
const isInitialized = useWalletStore((state) => state.isInitialized);
```

**Key patterns:**
- Single store per domain (wallet, auth)
- Async actions for async operations
- Persist middleware for data persistence

### 4.2 Provider Pattern (React Context)

```typescript
// ZKProvider wraps the app
<ZKProvider>
  <App />
</ZKProvider>

// useZKEngine hook provides ZK functionality
const { execute, status } = useZKEngine();
```

### 4.3 WebView Bridge Pattern

The wallet uses a **WebView bridge** to run ZK operations:

1. **Loading**: Bundled JS assets (snarkjs, poseidon) are loaded into WebView
2. **Communication**: React Native ↔ WebView via `injectJavaScript` and `onMessage`
3. **Execution**: Native code calls `execute(type, payload)` which injects JS to run operations

**Example:**
```typescript
// From components/ZKEngine.tsx
const result = await engine.execute('GENERATE_PROOF', {
  inputs: { birthYear: 1995, salt: '...' },
  wasmB64: '...',
  zkeyB64: '...'
});
```

### 4.4 Repository Pattern (Database)

The relay uses a **repository pattern** for database access:

```typescript
// From src/db.ts
export async function createSession(...) { ... }
export async function getSession(sessionId) { ... }
export async function updateSession(sessionId, updates) { ... }
```

### 4.5 Middleware Pattern (Express)

Request validation uses Express middleware:

```typescript
// From src/validation.ts
app.post('/api/v1/sessions', validateSessionCreation, async (req, res) => {
  // Handler only runs if validation passes
});
```

### 4.6 SDK Configuration Pattern

The SDK uses a **configuration object pattern**:

```typescript
// Required configuration
const config = {
  relayUrl: 'https://relay.example.com',
  apiKey: 'optional-api-key',
  verifierName: 'My App',
  credentialType: 'Age Verification',
  claims: ['birth_year'],
  timeout: 60
};

const zeroAuth = new ZeroAuth(config);
```

### 4.7 QR Protocol Pattern

QR codes contain a structured payload:

```typescript
// From zero-auth-sdk/src/index.ts
const qr_payload = {
  v: 1,                    // Protocol version
  action: 'verify',        // Action type
  session_id: 'uuid',      // Session identifier
  nonce: 'uuid',           // Cryptographic nonce
  verifier: {
    name: 'Verifier Name',
    did: 'did:web:...',   // Verifier DID
    callback: 'https://...'  // Proof submission URL
  },
  required_claims: ['birth_year'],
  credential_type: 'Age Verification',
  expires_at: 1234567890   // Unix timestamp
};
```

---

## 5. Directory Structure Summary

```
/home/harsh/Documents/Zero-Auth/
├── zero-auth-wallet/              # Mobile wallet (React Native/Expo)
│   ├── app/                      # Expo Router screens
│   │   ├── _layout.tsx           # Root layout
│   │   ├── (tabs)/               # Tab-based navigation
│   │   │   ├── index.tsx         # Home
│   │   │   ├── credentials.tsx  # Credentials list
│   │   │   ├── scanner.tsx       # QR scanner
│   │   │   ├── history.tsx      # Session history
│   │   │   └── settings.tsx     # Settings
│   │   ├── add-credential/       # Credential import flow
│   │   ├── onboarding.tsx        # First-time setup
│   │   └── my-qr.tsx            # Display own QR
│   ├── components/               # Reusable components
│   │   ├── ZKEngine.tsx         # ZK proof WebView
│   │   └── ...
│   ├── store/                    # Zustand stores
│   │   ├── wallet-store.ts      # Wallet identity
│   │   └── auth-store.ts        # Auth/sessions/credentials
│   ├── lib/                      # Business logic
│   │   ├── wallet.ts            # Keypair generation (did:key)
│   │   ├── proof.ts             # ZK proof generation
│   │   ├── hashing.ts          # Poseidon hashing
│   │   ├── qr-protocol.ts      # QR parsing/encoding
│   │   └── ...
│   └── circuits/                 # ZK circuits (compiled)
│       ├── age_check.circom     # Age verification circuit
│       └── student_check.circom # Student verification circuit
│
├── zero-auth-sdk/               # JavaScript SDK
│   ├── src/
│   │   ├── index.ts             # Pure JS SDK (ZeroAuth class)
│   │   └── index.tsx           # React components/hooks
│   └── dist/                     # Built output
│
├── zero-auth-relay/             # Backend relay service
│   ├── src/
│   │   ├── index.ts             # Express server
│   │   ├── db.ts               # Supabase operations
│   │   ├── zk.ts               # ZK verification
│   │   ├── validation.ts        # Request validation
│   │   └── errors.ts           # Error definitions
│   ├── migrations/              # Database migrations
│   └── .env                    # Environment config
│
└── .planning/codebase/          # Architecture docs
    ├── ARCHITECTURE.md          # This file
    └── STACK.md                 # Technology stack
```

---

## 6. Security Considerations

1. **Private Key Storage**: Stored in expo-secure-store (Keychain on iOS, Keystore on Android)
2. **ZK Proofs**: Zero-knowledge ensures credentials are never revealed
3. **Proof Replay**: Hash-based duplicate detection prevents replay attacks
4. **Session Timeouts**: All sessions expire after 5 minutes
5. **Rate Limiting**: Prevents DoS attacks on relay
6. **Fail-Closed**: ZK verification failures reject proofs (never accept invalid proofs)
7. **PIN/Biometrics**: Optional additional authentication for wallet access
