# Codebase Concerns & Technical Debt

This document outlines identified technical debt, known issues, security concerns, and areas requiring attention in the Zero-Auth codebase.

---

## 1. Security Vulnerabilities

### 1.1 Weak Signature Implementation (HIGH PRIORITY)
**Location:** `zero-auth-sdk/src/index.ts` (lines 239-260)

The `createSignature` function uses a simple rolling hash instead of proper HMAC:
```typescript
let hash = 0;
for (let i = 0; i < messageData.length; i++) {
  hash = ((hash << 5) - hash) + messageData[i];
  hash = hash & hash;
}
```

**Issues:**
- Not a cryptographically secure signature
- Easily reversible/collidable
- Comment says "In production, use crypto.subtle" but not implemented

**Recommendation:** Use `crypto.subtle.sign('HMAC', ...)` with SHA-256.

### 1.2 Missing QR Signature Verification
**Location:** `zero-auth-sdk/src/index.ts` (lines 214-219)

```typescript
if (data.signature) {
  // In production, verify signature using verifier's public key
  // For now, we just check it exists
  console.log('[ZeroAuth] QR signature present');
}
```

**Issue:** Signatures are validated for existence only, not verified cryptographically.

### 1.3 API Key Exposure in Logs
**Locations:** Multiple files

API keys are logged in several places:
- `zero-auth-sdk/src/index.ts:218` - Logs signature presence
- `zero-auth-relay/src/index.ts` - Logs full request bodies

**Recommendation:** Sanitize all logging to exclude sensitive data.

### 1.4 Type Safety Issues (MEDIUM)
**Locations:** Multiple files - 85+ instances of `any` type

The codebase uses extensive `any` typing which bypasses TypeScript's type checking:
- `zero-auth-sdk/src/index.ts` - Multiple `any` usages
- `zero-auth-relay/src/zk.ts` - `envVerificationKey: any`
- `zero-auth-wallet/lib/proof.ts` - `engine: any`, `inputs: any`

**Recommendation:** Replace with proper interfaces and generic types.

### 1.5 ts-ignore Comments
**Location:** `zero-auth-wallet/lib/wallet.ts` (lines 11-14)

```typescript
// @ts-ignore
if (!global.crypto) global.crypto = {};
// @ts-ignore
if (!global.crypto.getRandomValues) global.crypto.getRandomValues = getRandomValues;
```

**Recommendation:** Properly type the global extensions or use a different approach.

---

## 2. Error Handling Issues

### 2.1 Empty Catch Blocks (4 instances)
**Locations:**
- `zero-auth-sdk/src/index.ts:159` - Config URL validation
- `zero-auth-sdk/src/index.ts:392` - Error JSON parsing
- `zero-auth-sdk/src/index.ts:487` - Session cancellation
- `zero-auth-relay/src/index.ts:152` - Claims parsing

**Issue:** Errors are silently swallowed without logging or recovery.

**Example:**
```typescript
try {
  new URL(config.relayUrl);
} catch {
  errors.push('relayUrl must be a valid URL');
}
```

While this particular case handles the error, others silently ignore:
```typescript
try {
  await fetch(...);
} catch {
  // Ignore errors - session might already be expired
}
```

### 2.2 Redundant Error Catching
**Location:** `zero-auth-relay/src/db.ts` (lines 122-127, 155-160)

```typescript
} catch (error: any) {
  if (error.message?.includes('abort') || error.message?.includes('Aborted') || error.message?.includes('timed out')) {
    throw error;
  }
  throw error;
}
```

**Issue:** The catch block re-throws all errors unconditionally, making it redundant.

### 2.3 Unhandled Promise Rejections
**Location:** `zero-auth-relay/src/index.ts` (lines 32-38)

```typescript
setInterval(async () => {
  try {
    await cleanupExpiredSessions();
  } catch (error) {
    console.error('Error during session cleanup:', error);
  }
}, 60 * 1000);
```

**Issue:** Unhandled errors from the interval could crash the process. Should have proper error boundaries.

---

## 3. Performance Issues

### 3.1 Excessive Console Logging (110+ instances)
**Locations:** Throughout codebase

**Major Log Contributors:**
- `zero-auth-relay/src/index.ts` - ~25 log statements
- `zero-auth-wallet/lib/proof.ts` - ~15 log statements  
- `zero-auth-relay/src/db.ts` - ~12 log statements
- `zero-auth-relay/src/zk.ts` - ~10 log statements

**Impact:**
- Performance degradation in production
- Potential information leakage
- Makes debugging harder in production

**Recommendation:** Remove all console.* statements or use a proper logging framework with log levels.

### 3.2 Inefficient Storage Usage Calculation
**Location:** `zero-auth-wallet/lib/storage.ts` (lines 35-52)

```typescript
export async function getStorageUsage(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  let totalSize = 0;
  
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      totalSize += new Blob([value]).size;
    }
  }
  return totalSize;
}
```

**Issues:**
- N+1 query pattern (getAllKeys + getItem for each)
- Should use `getAll` with key-value pairs
- `Blob` may not be available in all React Native environments

### 3.3 No Request/Connection Pooling
**Location:** `zero-auth-relay/src/db.ts`

The Supabase client is created once but there's no connection pooling configuration. Under high load, this could cause connection exhaustion.

### 3.4 Cache Eviction Without Error Handling
**Location:** `zero-auth-wallet/lib/proof.ts` (lines 34-51)

```typescript
function evictOldestCacheEntry(): void {
  // ...
  delete assetCache[oldestKey];
  console.log(`[Cache] Evicted oldest entry: ${oldestKey}`);
}
```

**Issue:** No error handling if cache operations fail.

---

## 4. Fragile Code Areas

### 4.1 Duplicate Proof Reading Logic
**Location:** `zero-auth-wallet/lib/proof.ts` (lines 116-124)

```typescript
try {
  const wasmB64 = await FileSystem.readAsStringAsync(wasmAsset.localUri, { encoding: 'base64' });
  const zkeyB64 = await FileSystem.readAsStringAsync(zkeyAsset.localUri, { encoding: 'base64' });
} catch (error: any) {
  throw new Error(`[ZK] CRITICAL: Failed to read circuit files from disk: ${error.message}...`);
}

const wasmB64 = await FileSystem.readAsStringAsync(wasmAsset.localUri, { encoding: 'base64' });
const zkeyB64 = await FileSystem.readAsStringAsync(zkeyAsset.localUri, { encoding: 'base64' });
```

**Issue:** The file reading code is duplicated - appears to be refactoring gone wrong. The second read will always succeed if the first failed.

### 4.2 Hardcoded Values Throughout
Several hardcoded values that should be configurable:
- Session timeout: 5 minutes (hardcoded in multiple places)
- Rate limits: 500 requests per 15 minutes
- Proof generation timeout: 90 seconds
- Cache size: 5 circuits

### 4.3 Credential Type Handling
**Location:** `zero-auth-wallet/lib/proof.ts` (lines 82-108)

Multiple credential types handled with if-else chains:
```typescript
if (request.credential_type === 'Age Verification') {
  // ...
} else if (request.credential_type === 'Student ID') {
  // ...
} else if (request.credential_type === 'Trial') {
  // ...
}
```

**Issue:** Not extensible. Should use a strategy/registry pattern.

### 4.4 Inconsistent Error Messages
Error messages vary in format and detail level across the codebase. Some include stack traces, others just basic messages.

---

## 5. Missing Functionality

### 5.1 Incomplete Revocation Implementation (TODO)
**Location:** `zero-auth-wallet/lib/revocation.ts:59`

```typescript
// TODO: In Phase 2/3, integrate with revocation registry
```

**Issue:** Revocation is stubbed out - always returns "valid" status.

### 5.2 No Retry Logic
**Locations:** Throughout network operations

Failed network operations (Supabase queries, relay API calls) have no retry logic with exponential backoff.

### 5.3 Missing Input Validation
**Location:** `zero-auth-relay/src/index.ts`

The `verifier_name` field is accepted but not sanitized for XSS or injection attacks.

---

## 6. Code Quality Issues

### 6.1 Large Functions
Several functions exceed reasonable length:
- `ZeroAuth.verify()` in SDK (100+ lines)
- Session creation endpoint (80+ lines)
- Proof submission endpoint (100+ lines)

**Recommendation:** Break into smaller, focused functions.

### 6.2 Missing Unit Tests
The codebase lacks comprehensive unit tests. Only integration-level tests exist in `test-relay.ts`.

### 6.3 Inconsistent Error Handling Patterns
Mix of approaches:
- Custom error classes (`ZeroAuthError`, `NetworkError`)
- Plain `Error` with messages
- Status codes and error codes

---

## 7. Dependency Concerns

### 7.1 Outdated Dependencies
From `zero-auth-relay/package.json`:
- `snarkjs: ^0.7.6` - Should check for newer versions
- `express: ^4.18.2` - Consider express@5 for performance
- `uuid: ^9.0.0` - Consider v10 for faster implementation

### 7.2 No Dependency Locking in SDK
The SDK has `^` version ranges which could lead to inconsistent builds.

---

## 8. Known Bugs

### 8.1 Cache Race Conditions
**Location:** `zero-auth-wallet/lib/proof.ts`

The cache operations are not atomic. Under concurrent access, race conditions could occur.

### 8.2 Session Cleanup Failure Silent
**Location:** `zero-auth-relay/src/db.ts:174-177`

If cleanup fails, it throws but the error is only logged. Under sustained failure, expired sessions accumulate.

### 8.3 Proof Replay Protection Gap
**Location:** `zero-auth-relay/src/index.ts:132-139`

The proof hash check only works within a single session. A proof could be replayed across different sessions with the same credential.

---

## Priority Recommendations

### Immediate (P0)
1. Replace weak signature implementation with proper HMAC
2. Implement actual QR signature verification
3. Remove/sanitize sensitive data from logs
4. Fix empty catch blocks

### Short-term (P1)
5. Add proper TypeScript types (remove `any`)
6. Remove all console.* statements or use logging framework
7. Fix duplicate code in proof.ts
8. Implement proper revocation (Phase 2)

### Medium-term (P2)
9. Add comprehensive unit tests
10. Refactor large functions
11. Add retry logic for network operations
12. Implement strategy pattern for credential types

### Long-term (P3)
13. Consider upgrading dependencies
14. Add APM/monitoring
15. Performance optimization for storage calculations
16. Add integration test coverage

---

*Last Updated: 2026-03-01*
*Generated by: Codebase Analysis Tool*
