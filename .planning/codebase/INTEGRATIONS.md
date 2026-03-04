# INTEGRATIONS.md - External Services and APIs

## Overview

Zero-Auth integrates with several external services for database persistence, authentication, and cryptographic operations.

## Supabase (Database & Auth)

### Configuration
```typescript
// zero-auth-relay/src/db.ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
```

### Environment Variables Required
- `SUPABASE_URL` - Project URL from Supabase dashboard
- `SUPABASE_ANON_KEY` - Anonymous key (public, for client-side use)

### Database Schema
- **sessions** table - Stores verification sessions
  - session_id (UUID)
  - nonce (string)
  - verifier_name (string)
  - required_claims (jsonb)
  - credential_type (string)
  - status (enum: PENDING, COMPLETED)
  - proof (jsonb)
  - proof_hash (string)
  - expires_at (timestamp)

### Usage in Code
```typescript
// Creating a session
const { data, error } = await supabase
  .from('sessions')
  .insert({ session_id, nonce, verifier_name, status: 'PENDING', expires_at })
  .select()
  .single();
```

## Render (Relay Hosting)

### Deployment
- **URL**: https://zeroauth-relay.onrender.com
- **Service**: Node.js web service
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/index.js`

### Environment Variables (Render)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NODE_ENV=production`

## GitHub Pages (Demo Site)

### Deployment
- **URL**: https://zeroauth-labs.github.io/Zero-Auth/
- **Repository**: zeroauth-labs/Zero-Auth
- **Source**: Build output from zero-auth-sdk demo files

## ZK Proof Verification

### snarkjs
- **Purpose**: Groth16 ZK proof verification
- **Usage**: `snarkjs.groth16.verify(...)`
- **Location**: `zero-auth-relay/src/zk.ts`

### Circuit Files
- **Storage**: Bundled in wallet app (`zero-auth-wallet/assets/circuits/`)
- **Files**:
  - `age_verification.wasm` - Compiled circuit ( WASM)
  - `age_verification.zkey` - Proving key
  - `verification_key.json` - Verification key

## QR Code Generation

### Library: `qrcode`
- **Purpose**: Generate QR codes for session payloads
- **Usage**: `QRCode.toDataURL(payload)`
- **Location**: `zero-auth-sdk/src/index.ts`

## Secure Storage (Mobile)

### Expo Secure Store
- **Purpose**: Encrypted storage for private keys and salts
- **API**: `SecureStore.setItemAsync()`, `SecureStore.getItemAsync()`
- **Location**: `zero-auth-wallet/lib/wallet.ts`

## Camera/QR Scanning (Mobile)

### Expo Camera
- **Purpose**: QR code scanning for verification flow
- **API**: `Camera.useCameraPermissions()`, `Camera.CameraView`
- **Location**: `zero-auth-wallet/app/(tabs)/scanner.tsx`

## Local Authentication (Mobile)

### Expo Local Authentication
- **Purpose**: Biometric authentication (Face ID/Touch ID)
- **API**: `LocalAuth.authenticateAsync()`
- **Location**: `zero-auth-wallet/lib/wallet.ts`

## External APIs Summary

| Service | Purpose | Type |
|---------|---------|------|
| Supabase | Session persistence, database | PostgreSQL + REST |
| Render | Relay server hosting | Platform as a Service |
| GitHub Pages | Demo site hosting | Static hosting |
| snarkjs | ZK proof verification | Client library |
| Local Authentication | Biometric auth | Expo module |
| Secure Store | Encrypted key storage | Expo module |
