# Codebase Structure

**Analysis Date:** 2026-03-06

## Directory Layout

```
Zero-Auth/
├── .github/workflows/           # CI/CD pipelines
├── adapters/                     # AI adapter configs (CLAUDE.md, etc.)
├── docs/                         # Documentation and demos
├── scripts/                      # Build and utility scripts
├── supabase/                     # Backend (DB, functions, migrations)
│   ├── functions/                # Edge Functions
│   │   ├── admin-students/
│   │   ├── get-credential/
│   │   ├── revoke-credential/
│   │   ├── validate-credential/
│   │   ├── verify-aadhaar/
│   │   └── verify-student/
│   ├── migrations/               # Database migrations
│   └── seed-*.sql               # Seed data
├── zero-auth-relay/             # Node.js relay server
│   ├── src/
│   │   ├── index.ts             # Server entry
│   │   ├── proof-worker.ts      # ZK proof verification
│   │   ├── zk.ts                # ZK utilities
│   │   ├── validation.ts       # Request validation
│   │   ├── db.ts                # Database helpers
│   │   └── errors.ts            # Error classes
│   └── migrations/              # Relay-specific migrations
├── zero-auth-sdk/               # Embeddable SDK
│   ├── src/
│   │   └── index.ts             # SDK entry
│   ├── dist/                    # Built output
│   ├── vendor/                  # Bundled dependencies
│   └── demo-*.html              # Demo pages
├── zero-auth-wallet/            # Mobile wallet app
│   ├── app/                     # expo-router pages
│   │   ├── (tabs)/              # Tab navigation screens
│   │   ├── add-credential/      # Credential issuance flow
│   │   ├── _layout.tsx          # Root layout
│   │   ├── approve-request.tsx  # Verification approval
│   │   └── *.tsx                # Other screens
│   ├── components/              # React components
│   │   └── ZKEngine.tsx         # ZK proof component
│   ├── lib/                     # Utilities
│   │   ├── supabase.ts          # Supabase client
│   │   └── proof.ts             # Proof generation
│   ├── store/                   # Zustand stores
│   │   └── auth-store.ts        # Auth state
│   ├── circuits/                # ZK circuits (Circom)
│   └── assets/circuits/         # Compiled circuits (.zkey, .wasm)
└── .planning/                   # GSD planning files
    └── codebase/                # This mapping
```

## Directory Purposes

**zero-auth-wallet:**
- Purpose: Mobile credential wallet
- Contains: Expo app, screens, components, ZK circuits
- Key files: `app/_layout.tsx`, `components/ZKEngine.tsx`

**zero-auth-sdk:**
- Purpose: Embeddable verification for web apps
- Contains: TypeScript SDK, demo pages
- Key files: `src/index.ts`, `rollup.config.js`

**zero-auth-relay:**
- Purpose: Backend API for proof verification
- Contains: Express server, proof worker
- Key files: `src/index.ts`, `src/proof-worker.ts`

**supabase:**
- Purpose: Backend infrastructure
- Contains: Database schema, Edge Functions, seeds
- Key files: `migrations/*.sql`, `functions/*/index.ts`

## Key File Locations

**Entry Points:**
- `zero-auth-wallet/app/_layout.tsx` - Mobile app entry
- `zero-auth-sdk/src/index.ts` - SDK entry
- `zero-auth-relay/src/index.ts` - Relay server entry

**Configuration:**
- `zero-auth-wallet/package.json` - Mobile dependencies
- `zero-auth-sdk/package.json` - SDK config
- `zero-auth-relay/package.json` - Relay config

**Core Logic:**
- `zero-auth-wallet/components/ZKEngine.tsx` - ZK proof handling
- `zero-auth-relay/src/zk.ts` - ZK verification
- `supabase/functions/validate-credential/index.ts` - Credential validation

## Naming Conventions

**Files:**
- TypeScript/React: `camelCase.ts` / `camelCase.tsx`
- Config: `camelCase.config.js`
- Edge Functions: `kebab-case/index.ts`

**Directories:**
- General: `kebab-case/`
- Components: `PascalCase/`
- Routes: `kebab-case/` (expo-router)

## Where to Add New Code

**New Feature (Mobile):**
- Primary code: `zero-auth-wallet/app/`
- Components: `zero-auth-wallet/components/`
- State: `zero-auth-wallet/store/`

**New Feature (SDK):**
- Implementation: `zero-auth-sdk/src/`
- Tests: Add to project root or `__tests__/`

**New Feature (Backend):**
- Edge Function: `supabase/functions/new-function/`
- Relay endpoint: `zero-auth-relay/src/`

**New ZK Circuit:**
- Circuit: `zero-auth-wallet/circuits/`
- Compile and bundle using: `zero-auth-wallet/scripts/bundle-zk.js`

**Utilities:**
- Shared helpers: `zero-auth-wallet/lib/`
- Relay utils: `zero-auth-relay/src/`

## Special Directories

**zero-auth-wallet/circuits/:**
- Purpose: Circom ZK circuits
- Generated: Yes (compiled to .zkey, .wasm)
- Committed: No (in .gitignore), but artifacts in `assets/circuits/`

**supabase/.temp/:**
- Purpose: Supabase CLI temp files
- Generated: Yes
- Committed: Yes (for CLI operations)

---

*Structure analysis: 2026-03-06*
