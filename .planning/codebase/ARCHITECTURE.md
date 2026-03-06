# Architecture

**Analysis Date:** 2026-03-06

## Pattern Overview

**Overall:** Event-driven credential verification with ZK proofs

**Key Characteristics:**
- Mobile-first design (Expo/React Native wallet)
- Zero-knowledge proofs for privacy-preserving verification
- Decentralized credential issuance and verification
- QR code-based credential exchange

## Layers

**Mobile App (zero-auth-wallet):**
- Purpose: User-facing wallet for managing credentials
- Location: `zero-auth-wallet/`
- Contains: React Native screens, ZK circuit integration, credential storage
- Depends on: Supabase, expo-local-authentication, snarkjs

**SDK (zero-auth-sdk):**
- Purpose: Embeddable verification for relying parties
- Location: `zero-auth-sdk/src/`
- Contains: QR code generation, proof request handling
- Depends on: React (optional), qrcode

**Relay Server (zero-auth-relay):**
- Purpose: Session management, proof verification coordinator
- Location: `zero-auth-relay/src/`
- Contains: Express API, proof worker, ZK verification
- Depends on: Supabase, Express, snarkjs

**Backend (Supabase):**
- Purpose: Database, authentication, edge functions
- Location: `supabase/`
- Contains: PostgreSQL schema, Edge Functions, RLS policies

## Data Flow

**Credential Issuance Flow:**
1. User scans issuer's QR code
2. Wallet generates keypair and creates credential request
3. Issuer verifies user identity (Aadhaar/student verification)
4. Issuer creates credential signed with issuer's key
5. Credential stored in wallet

**Credential Verification Flow:**
1. Relying party generates verification request (QR code)
2. User scans QR with wallet
3. Wallet generates ZK proof from credential
4. Proof sent to relay for verification
5. Relay verifies ZK proof via snarkjs
6. Session created in database
7. Verification result returned to relying party

**State Management:**
- **Zustand** - Global app state in wallet
- **AsyncStorage** - Persistent credential storage
- **Supabase** - Server state (sessions, credentials)

## Key Abstractions

**ZKEngine:**
- Purpose: Zero-knowledge proof generation/verification
- Examples: `zero-auth-wallet/components/ZKEngine.tsx`
- Pattern: Circuit compilation and proof generation

**Credential Store:**
- Purpose: Secure credential management
- Examples: `zero-auth-wallet/store/auth-store.ts`
- Pattern: Encrypted local storage

**Proof Worker:**
- Purpose: Async proof verification
- Examples: `zero-auth-relay/src/proof-worker.ts`
- Pattern: Worker thread for CPU-intensive ZK ops

## Entry Points

**Mobile App:**
- Location: `zero-auth-wallet/app/_layout.tsx`
- Triggers: App launch
- Responsibilities: Navigation, auth state, global providers

**SDK:**
- Location: `zero-auth-sdk/src/index.ts`
- Triggers: Import and initialization
- Responsibilities: QR generation, request parsing

**Relay:**
- Location: `zero-auth-relay/src/index.ts`
- Triggers: Server start
- Responsibilities: API routes, proof verification, session management

**Edge Functions:**
- Location: `supabase/functions/*/index.ts`
- Triggers: HTTP requests
- Responsibilities: Credential verification, Aadhaar checks

## Error Handling

**Strategy:** Try-catch with user-facing error messages

**Patterns:**
- `try-catch` blocks in async functions
- Error toast notifications in UI
- Supabase error responses propagated to clients

## Cross-Cutting Concerns

**Logging:** Console logging, Supabase function logs
**Validation:** Input validation in Edge Functions, ZK circuit constraints
**Authentication:** Supabase Auth + biometric confirmation

---

*Architecture analysis: 2026-03-06*
