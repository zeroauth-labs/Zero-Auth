# ZeroAuth Wallet - Codebase Guide

## Project Structure

```
zero-auth-wallet/
├── app/                    # Screen components (UI only)
│   ├── (tabs)/            # Tab navigation screens
│   ├── add-credential/     # Add credential flow
│   ├── approve-request.tsx
│   ├── my-qr.tsx
│   └── settings.tsx
├── lib/                    # Business logic (no UI)
│   ├── proof.ts          # ZK proof generation
│   ├── hashing.ts        # Cryptographic hashing
│   ├── qr-protocol.ts    # QR code parsing/validation
│   ├── revocation.ts      # Credential revocation checks
│   └── wallet.ts         # Wallet operations
├── store/                  # State management
│   └── auth-store.ts     # Zustand store
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
└── constants/            # App constants
```

## How to Make Changes

### Adding a New Screen
1. Create file in `app/` (e.g., `app/new-screen.tsx`)
2. Import business logic from `lib/`
3. Use components from `components/`
4. Add navigation in `_layout.tsx`

### Adding Business Logic
1. Add functions to appropriate file in `lib/`
2. Keep it separate from UI (no React imports)
3. Export for use in screens

### Modifying UI/Theme
1. Colors: `tailwind.config.js`
2. Global styles: `global.css`
3. Components: `components/`

## Key Files

| File | Purpose |
|------|---------|
| `lib/proof.ts` | ZK proof generation |
| `lib/qr-protocol.ts` | QR parsing |
| `store/auth-store.ts` | State (credentials, sessions) |
| `app/approve-request.tsx` | Verification request screen |

## Important Notes

- Business logic stays in `lib/` - never in screen components
- Screens only handle UI, call lib functions for logic
- All cryptographic operations in `lib/hashing.ts`
