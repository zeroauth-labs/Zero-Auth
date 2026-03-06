# External Integrations

**Analysis Date:** 2026-03-06

## APIs & External Services

**Supabase (Primary Backend):**
- **Database**: PostgreSQL via Supabase
  - SDK: `@supabase/supabase-js`
  - Auth: Supabase Auth (GoTrue)
  - Tables: credentials, sessions, users

**Aadhaar Verification API:**
- **Service**: UIDAI (India's Aadhaar system)
- **Implementation**: REST API calls from Edge Functions
- **Purpose**: Verify Aadhaar numbers against UIDAI database
- **Files**: `supabase/functions/verify-aadhaar/index.ts`

**Student Verification:**
- **Service**: College/university verification APIs
- **Implementation**: Custom verification logic
- **Files**: `supabase/functions/verify-student/index.ts`

## Data Storage

**Databases:**
- **Supabase PostgreSQL**
  - Connection: `SUPABASE_URL` env var
  - Client: `@supabase/supabase-js`
  - Migrations: `supabase/migrations/`

**File Storage:**
- **Supabase Storage** (for credentials/assets)

**Caching:**
- **None detected** - Currently no caching layer

## Authentication & Identity

**Primary Auth:**
- **Supabase Auth** (GoTrue)
  - Email/password authentication
  - Anonymous users for credential storage

**Biometric Auth:**
- **expo-local-authentication**
  - Device biometrics (fingerprint, face)
  - Used for approving credential requests

**Zero-Knowledge Proofs:**
- **snarkjs** - ZK proof verification
  - Circuits: Aadhaar credential verification
  - Keys: `zero-auth-wallet/circuits/`

## Monitoring & Observability

**Error Tracking:**
- **Not detected** - No Sentry, Bugsnag, etc.

**Logs:**
- Supabase Edge Functions logs (via Supabase dashboard)
- Express server logs (relay)

## CI/CD & Deployment

**Hosting:**
- **Supabase** - Database and Edge Functions
- **EAS (Expo)** - Mobile builds
- **Self-hosted** - zero-auth-relay can be deployed anywhere

**CI Pipeline:**
- **GitHub Actions** - `.github/workflows/`
  - Deploy demo workflow detected

## Environment Configuration

**Required env vars:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role (backend only)
- `AADHAAR_API_*` - Aadhaar verification credentials (if enabled)

**Secrets location:**
- `.env` files (not committed)
- Supabase dashboard secrets

## Webhooks & Callbacks

**Incoming:**
- None detected - All APIs are callable

**Outgoing:**
- None configured

---

*Integration audit: 2026-03-06*
