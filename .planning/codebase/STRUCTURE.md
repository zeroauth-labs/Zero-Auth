# STRUCTURE.md - Directory Layout and Organization

## Monorepo Structure

```
Zero-Auth/
├── zero-auth-wallet/           # React Native/Expo Mobile App
├── zero-auth-relay/            # Node.js/Express Server
├── zero-auth-sdk/              # Web SDK Library
├── docs/                       # Documentation
├── scripts/                    # Build & validation scripts
└── package.json               # Monorepo orchestration
```

## zero-auth-wallet (Mobile App)

```
zero-auth-wallet/
├── app/                        # Expo Router screens & navigation
│   ├── (tabs)/                 # Tab-based navigation
│   │   ├── index.tsx          # Dashboard
│   │   ├── credentials.tsx    # Credential management
│   │   ├── history.tsx        # Session history
│   │   ├── scanner.tsx        # QR scanner
│   │   └── settings.tsx      # Settings
│   ├── add-credential/         # Credential issuance flow
│   ├── _layout.tsx           # Root layout with polyfills
│   ├── approve-request.tsx    # Verification approval modal
│   ├── onboarding.tsx         # First-time setup
│   ├── my-qr.tsx              # User's DID QR display
│   └── _layout.tsx
├── assets/                     # Static assets & circuits
├── circuits/                   # Circom ZK circuits
├── components/                 # UI Components
│   └── ZKEngine.tsx           # ZK proof generation WebView
├── constants/                  # Theme & config
├── hooks/                      # Custom React hooks
├── lib/                        # Core business logic
│   ├── proof.ts               # ZK proof generation
│   ├── qr-protocol.ts         # QR parsing/validation
│   ├── wallet.ts              # Identity management
│   ├── hashing.ts             # Poseidon hashing
│   ├── revocation.ts          # Revocation checking
│   ├── storage.ts             # Zustand persistence
│   └── offline.ts             # Offline queue
├── store/                      # Zustand state management
│   ├── auth-store.ts          # Credentials, sessions, notifications
│   └── wallet-store.ts        # Wallet identity lifecycle
├── package.json
└── metro.config.js            # React Native bundler config
```

## zero-auth-relay (Server)

```
zero-auth-relay/
├── src/
│   ├── index.ts               # Express server entry point
│   ├── db.ts                  # Supabase database operations
│   ├── validation.ts          # Request validation middleware
│   ├── zk.ts                  # ZK proof verification
│   ├── errors.ts              # Error codes & helpers
│   └── proof-worker.ts        # Async proof processing
├── migrations/                 # Database migrations
├── scripts/                   # Utility scripts
├── dist/                      # Compiled output
├── package.json
└── tsconfig.json
```

## zero-auth-sdk (Library)

```
zero-auth-sdk/
├── src/
│   └── index.ts               # Main SDK (ZeroAuth class)
├── dist/                       # Built outputs (UMD/ESM)
├── demo-*.html                # Demo pages
├── vendor/                    # QR code vendor library
├── rollup.config.js
└── package.json
```

## Key File Locations

| File | Purpose |
|------|---------|
| `zero-auth-relay/src/index.ts` | Express server entry, all API routes |
| `zero-auth-relay/src/db.ts` | Supabase client, session CRUD |
| `zero-auth-relay/src/zk.ts` | ZK proof verification logic |
| `zero-auth-relay/src/validation.ts` | Input validation middleware |
| `zero-auth-sdk/src/index.ts` | Main SDK class and exports |
| `zero-auth-wallet/store/auth-store.ts` | Main Zustand store |
| `zero-auth-wallet/lib/proof.ts` | ZK proof generation |
| `zero-auth-wallet/lib/wallet.ts` | Key management, biometric auth |
| `zero-auth-wallet/app/(tabs)/scanner.tsx` | QR code scanner |

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `auth-store.ts`, `qr-protocol.ts` |
| Classes | PascalCase | `ZeroAuth`, `ZeroAuthError` |
| Interfaces | PascalCase | `VerificationRequest`, `SessionInfo` |
| Functions | camelCase | `generateQRBase64`, `validateConfig` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PROOF_SIZE`, `DB_QUERY_TIMEOUT` |
| Enums | PascalCase | `ErrorCode.SESSION_NOT_FOUND` |
