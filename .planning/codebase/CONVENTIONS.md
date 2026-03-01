# Code Conventions and Patterns

This document outlines the coding standards, patterns, and conventions used across the Zero Auth codebase.

## Table of Contents

1. [TypeScript Conventions](#typescript-conventions)
2. [React Patterns](#react-patterns)
3. [Error Handling](#error-handling)
4. [Naming Conventions](#naming-conventions)
5. [Code Style](#code-style)
6. [State Management](#state-management)
7. [API Design](#api-design)
8. [Testing Patterns](#testing-patterns)

---

## TypeScript Conventions

### Type Definitions

Use explicit interfaces for structured types:

```typescript
interface WalletState {
    isInitialized: boolean;
    did: string | null;
    publicKeyHex: string | null;
    isLoading: boolean;
}
```

Use type aliases for unions, primitives, and function types:

```typescript
export type ServiceType = 'Age Verification' | 'Student ID' | 'Email Alternative' | 'Trial';

export type UseCaseType = 'LOGIN' | 'VERIFICATION' | 'TRIAL_LICENSE';
```

Use enums for related constants, especially error codes:

```typescript
export enum ErrorCode {
    SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    SESSION_ALREADY_COMPLETED = 'SESSION_ALREADY_COMPLETED',
    INVALID_CREDENTIAL_TYPE = 'INVALID_CREDENTIAL_TYPE',
    // ... more codes
}
```

### Type Exports

Export types explicitly using `export type` for type-only exports:

```typescript
export type { WalletState };
export interface Session { ... }
```

### Generics

Use generics for reusable utility functions and components:

```typescript
export function create<T>(...): T { ... }
```

### Type Annotations

Always include return types for functions, especially for exported APIs:

```typescript
export async function generateAndStoreIdentity(): Promise<{ publicKey: Uint8Array; did: string }> { ... }
```

---

## React Patterns

### Component Structure

Default export for page components:

```tsx
// app/(tabs)/index.tsx
export default function DashboardScreen() { ... }
```

Named exports for reusable components and hooks:

```tsx
// components/ZKEngine.tsx
export const ZKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { ... }
export const useZKEngine = () => { ... }
```

### Functional Components

Use `React.FC` type for components with children:

```tsx
export const ZKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { ... }
```

Define inline props for simple components:

```tsx
export default function SessionCard({ session }: { session: Session }) { ... }
```

### Hooks

Follow the `use` prefix convention:

```typescript
export const useZKEngine = () => { ... }
export function useZeroAuth() { ... }
export function useZeroAuthVerification() { ... }
```

### Context

Create context with explicit types:

```tsx
interface ZKContextType {
    execute: (type: BridgeRequest['type'], payload: any) => Promise<any>;
    status: 'offline' | 'initializing' | 'ready' | 'proving' | 'error';
}

const ZKContext = createContext<ZKContextType | null>(null);
```

Use custom hooks to consume context with error boundaries:

```tsx
export const useZKEngine = () => {
    const context = useContext(ZKContext);
    if (!context) {
        throw new Error('useZKEngine must be used within a ZKProvider');
    }
    return context;
};
```

### Effects and State

Use `useState` for local component state:

```typescript
const [status, setStatus] = useState<ZKContextType['status']>('initializing');
const [refreshing, setRefreshing] = useState(false);
```

Use `useEffect` with proper cleanup:

```typescript
useEffect(() => {
    const interval = setInterval(() => {
        setDuration(Date.now() - session.startTime);
    }, 1000);
    return () => clearInterval(interval);
}, [session.startTime]);
```

Use `useCallback` for memoized callbacks:

```typescript
const startVerification = useCallback(async (request?: Partial<VerificationRequest>): Promise<VerificationResult> => { ... }, []);
```

Use `useRef` for mutable references:

```typescript
const webViewRef = useRef<WebView>(null);
const resolvers = useRef<Record<string, { resolve: (val: any) => void; reject: (err: any) => void }>>({});
```

---

## Error Handling

### Custom Error Classes

Extend the base Error class for domain-specific errors:

```typescript
export class ZeroAuthError extends Error {
    constructor(
        message: string,
        public code?: string,
        public statusCode?: number
    ) {
        super(message);
        this.name = 'ZeroAuthError';
    }
}

export class ConfigurationError extends ZeroAuthError {
    constructor(message: string) {
        super(message, 'CONFIG_ERROR', 400);
        this.name = 'ConfigurationError';
    }
}
```

### Error Factory Functions

Use factory functions for consistent error creation:

```typescript
export function createError(code: ErrorCode, message: string, details?: Record<string, unknown>): ApiError {
    return {
        error: code,
        code,
        message,
        details,
    };
}
```

### Try-Catch Blocks

Always handle async errors with try-catch:

```typescript
try {
    const identity = await generateAndStoreIdentity();
    set({ isInitialized: true, did: identity.did });
} catch (error) {
    console.error("Wallet gen failed:", error);
    set({ isLoading: false });
    throw error; // Rethrow so UI knows
}
```

### Error Logging

Log errors with context:

```typescript
console.error('Error creating session:', error);
console.error('[Proof] ERROR during proof submission:', error);
console.error('[Proof] Error stack:', error.stack);
```

---

## Naming Conventions

### Files

- **Components & Types**: PascalCase (`WalletStore.ts`, `SessionCard.tsx`)
- **Utilities & Hooks**: camelCase (`utils.ts`, `use-color-scheme.ts`)
- **Configuration**: kebab-case or camelCase depending on ecosystem

### Variables and Functions

- **Variables**: camelCase (`isInitialized`, `sessionId`)
- **Functions**: camelCase, verb prefix (`generateAndStoreIdentity`, `validateProofStructure`)
- **Constants**: SCREAMING_SNAKE_CASE or camelCase with meaningful names (`PRIVATE_KEY_ALIAS`, `MAX_PROOF_SIZE`)
- **Boolean variables**: is/has/can prefix (`isLoading`, `isOnline`, `hasHydrated`)

### Types and Interfaces

- **Interfaces**: PascalCase, descriptive (`WalletState`, `Session`, `Credential`)
- **Types**: PascalCase (`ServiceType`, `UseCaseType`)
- **Enums**: PascalCase with PascalCase members (`ErrorCode.SESSION_NOT_FOUND`)

### Components

- **Component names**: PascalCase (`DashboardScreen`, `SessionCard`, `ZKProvider`)
- **Props interfaces**: ComponentName + Props pattern (`ZeroAuthButtonProps`, `ZKProviderProps`)

### Special Prefixes

- **Hooks**: `use` prefix (`useZKEngine`, `useAuthStore`)
- **Event handlers**: `on` prefix (`onRefresh`, `onClose`, `onSuccess`)
- **Getters**: `get` prefix (`getSessionStatus`, `getWalletIdentity`)

---

## Code Style

### Indentation and Formatting

- Use 4 spaces for indentation
- Use single quotes for strings
- Always use semicolons
- Use trailing commas in multi-line objects and arrays

### Comments

Use JSDoc-style comments for public APIs:

```typescript
/**
 * Generates a new Ed25519 keypair and persists the private key.
 */
export async function generateAndStoreIdentity(): Promise<{ publicKey: Uint8Array; did: string }> { ... }

/**
 * Validates ZK proof structure
 * Checks for required fields pi_a, pi_b, pi_c in groth16 format
 */
export function validateProofStructure(proof: unknown): ProofValidationResult { ... }
```

Use inline comments for complex logic:

```typescript
// Polyfill for random values
if (!global.crypto) global.crypto = {};
if (!global.crypto.getRandomValues) global.crypto.getRandomValues = getRandomValues;
```

### Section Headers

Use comment blocks to organize code into sections:

```typescript
// ============================================
// Types & Interfaces
// ============================================

// ============================================
// Error Types
// ============================================

// ============================================
// Utility Functions
// ============================================
```

### Imports

Organize imports logically:

```typescript
// External libraries
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex } from '@noble/hashes/utils';

// Internal modules
import { generateAndStoreIdentity, getWalletIdentity, isWalletInitialized } from '@/lib/wallet';
import { useAuthStore } from '@/store/auth-store';

// UI components
import { View, Text, TouchableOpacity } from 'react-native';
```

---

## State Management

### Zustand Stores

Use Zustand for global state with TypeScript:

```typescript
interface WalletState {
    isInitialized: boolean;
    did: string | null;
    // Actions
    checkInitialization: () => Promise<boolean>;
    initializeWallet: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
    isInitialized: false,
    did: null,
    
    checkInitialization: async () => {
        const exists = await isWalletInitialized();
        set({ isInitialized: exists });
        return exists;
    },
    // ... more actions
}));
```

Use persist middleware for persistent storage:

```typescript
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({ ... }),
        {
            name: 'zero-auth-store',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({ sessions: state.sessions, ... }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
```

### Store Usage

Access state and actions via selectors:

```typescript
const sessions = useAuthStore((state) => state.sessions);
const terminateSession = useAuthStore((state) => state.terminateSession);
```

---

## API Design

### REST Endpoints

Use RESTful conventions with versioned paths:

```typescript
app.post('/api/v1/sessions', validateSessionCreation, async (req, res) => { ... });
app.get('/api/v1/sessions/:id', async (req, res) => { ... });
app.post('/api/v1/sessions/:id/proof', validateProofSubmission, async (req, res) => { ... });
```

### Request Validation

Use middleware for validation:

```typescript
export function validateSessionCreation(req: Request, res: Response, next: NextFunction) {
    const errors: ValidationError[] = [];
    
    if (credential_type !== undefined) {
        if (!isValidCredentialType(credential_type)) {
            errors.push({ field: 'credential_type', message: 'Invalid credential type' });
        }
    }
    
    if (errors.length > 0) {
        return res.status(400).json(createError(ErrorCode.INVALID_REQUEST_BODY, 'Invalid request body', { errors }));
    }
    
    next();
}
```

### Response Format

Use consistent response structures:

```typescript
// Success
res.json({ session_id, nonce, qr_payload });

// Error
res.status(500).json(createError(ErrorCode.DATABASE_ERROR, 'Failed to create session'));

// Health check
res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.1.0' });
```

---

## Testing Patterns

### Development-Only Code

Use `__DEV__` for development-only features:

```tsx
{__DEV__ && useAuthStore.getState().credentials.length === 0 && (
    <TouchableOpacity onPress={() => useAuthStore.getState().seedDemoData()}>
        <Text>Testing Zero Auth?</Text>
    </TouchableOpacity>
)}
```

### Mock Data Generation

Provide seed functions for demo/testing:

```typescript
seedDemoData: async () => {
    const demoCredentials: Credential[] = [
        { id: 'demo-age', type: 'Age Verification', issuer: 'Zero Auth Demo', ... },
        // ... more demo data
    ];
    set({ credentials: demoCredentials });
},
```

---

## Summary

Following these conventions ensures consistency across the codebase and makes it easier for developers to:

- Read and understand existing code
- Navigate between different parts of the application
- Maintain and extend functionality
- Onboard new team members

When contributing to this project, please adhere to these patterns and conventions.
