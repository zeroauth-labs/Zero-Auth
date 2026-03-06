# Coding Conventions

**Analysis Date:** 2026-03-06

## Naming Patterns

**Files:**
- TypeScript: `camelCase.ts` / `camelCase.tsx` (e.g., `authStore.ts`, `ZKEngine.tsx`)
- Components: `PascalCase.tsx` (e.g., `CredentialCard.tsx`)
- Config: `camelCase.config.js` (e.g., `babel.config.js`)

**Functions:**
- camelCase for functions and methods
- Verb-noun pattern: `getCredential()`, `generateProof()`, `validateInput()`

**Variables:**
- camelCase: `sessionId`, `credentialType`, `proofInput`
- Constants: SCREAMING_SNAKE_CASE for true constants
- Types/Interfaces: PascalCase: `CredentialRequest`, `ProofResponse`

## Code Style

**Formatting:**
- **Prettier** - Code formatting
- **ESLint** - Linting
- Config: `eslint.config.js`, `tailwind.config.js`

**Linting:**
- **eslint-config-expo** - Expo/React Native rules
- Custom rules in `.eslintrc` or `eslint.config.js`

## Import Organization

**Order:**
1. React/Expo imports: `react`, `expo-*`
2. Third-party: `@supabase/*`, `snarkjs`, etc.
3. Internal modules: Components, stores, lib
4. Relative: `./`, `../`

**Path Aliases:**
- None detected - using relative imports

**Example:**
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../store/auth-store';
import { generateProof } from '../lib/proof';
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations
- Custom error classes in `zero-auth-relay/src/errors.ts`
- Error toast notifications in UI
- Propagate Supabase errors to user

**Example:**
```typescript
try {
  const { data, error } = await supabase.from('credentials').select('*');
  if (error) throw error;
  return data;
} catch (err) {
  console.error('Failed to fetch credentials:', err);
  throw err;
}
```

## Logging

**Framework:** Console + Supabase function logs

**Patterns:**
- `console.log` for general info
- `console.error` for errors
- Edge Functions: Return error responses

## Comments

**When to Comment:**
- Complex ZK circuit logic
- Non-obvious cryptographic operations
- API contracts

**JSDoc/TSDoc:**
- Detected but not consistently used
- Type annotations preferred over JSDoc

## Function Design

**Size:** Keep under 50 lines when possible

**Parameters:** 
- Use interfaces/types for complex parameters
- Limit to 4-5 parameters max

**Return Values:**
- Always type return values
- Use `Promise<T>` for async functions

## Module Design

**Exports:**
- Named exports preferred
- Barrel files (index.ts) for re-exports

**Example:**
```typescript
// lib/proof.ts
export async function generateProof(...) { }
export async function verifyProof(...) { }
```

---

*Convention analysis: 2026-03-06*
