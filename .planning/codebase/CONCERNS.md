# CONCERNS.md - Technical Debt and Issues

## Overview

This document outlines technical debt, known issues, security concerns, and fragile areas in the Zero-Auth codebase.

---

## Known Bugs / Incomplete Implementations

### 1. Revocation Registry Not Implemented
- **Location**: `zero-auth-wallet/lib/revocation.ts` (line 59)
- **Issue**: The revocation status check is incomplete:
  ```typescript
  // TODO: In Phase 2/3, integrate with revocation registry
  ```
- **Impact**: Currently, revocation checks always return "valid" - a critical security gap for production use.

### 2. QR Signature Verification is Incomplete
- **Location**: `zero-auth-sdk/src/index.ts` (lines 214-219)
- **Issue**: The SDK only checks if a signature exists but doesn't verify it:
  ```typescript
  if (data.signature) {
    // In production, verify signature using verifier's public key
    // For now, we just check it exists
  }
  ```
- **Impact**: QR payloads are not cryptographically verified.

### 3. Trial Credential Proof is Empty/Mock
- **Location**: `zero-auth-wallet/lib/proof.ts` (lines 92-105)
- **Issue**: Trial credentials don't use ZK proofs:
  ```typescript
  return {
    credential_type: 'Trial',
    pi_a: [], pi_b: [], pi_c: [],
    protocol: 'trial', curve: 'none', publicSignals: []
  }
  ```
- **Impact**: Trial credentials provide no cryptographic verification.

### 4. Duplicate Code in Cache Initialization
- **Location**: `zero-auth-wallet/lib/proof.ts` (lines 116-124)
- **Issue**: Same files are read twice without proper error handling.
- **Impact**: Unnecessary operations and potential unhandled errors.

---

## Security Vulnerabilities

### 1. Weak Cryptographic Signature in SDK (CRITICAL)
- **Location**: `zero-auth-sdk/src/index.ts` (lines 248-260)
- **Issue**: Uses XOR-based hash instead of proper HMAC:
  ```typescript
  let hash = 0;
  for (let i = 0; i < messageData.length; i++) {
    hash = ((hash << 5) - hash) + messageData[i];
    hash = hash & hash;
  }
  ```
- **Impact**: Anyone can forge signatures with this algorithm.
- **Severity**: CRITICAL

### 2. Missing Input Validation in Relay
- **Location**: `zero-auth-relay/src/validation.ts`
- **Issue**: `validateProofStructure` doesn't validate actual content of proof arrays.
- **Impact**: Malformed proofs could cause verification failures or crashes.

### 3. Proof Hash Uses Stringification
- **Location**: `zero-auth-relay/src/zk.ts` (lines 182-187)
- **Issue**: Proof hash computation depends on JSON key ordering.
- **Impact**: Fragile approach that could break with different serialization.

### 4. No Rate Limiting on Proof Submission
- **Location**: `zero-auth-relay/src/index.ts`
- **Issue**: Rate limiting exists on `/api` routes but may not cover all endpoints.
- **Impact**: Potential for DoS attacks.

### 5. Error Logging May Leak Information
- **Location**: `zero-auth-relay/src/index.ts` (lines 82-85)
- **Issue**: Database errors logged but may expose sensitive info.
- **Impact**: Stack traces could leak in development.

---

## Performance Issues

### 1. Storage Usage Calculation is Expensive
- **Location**: `zero-auth-wallet/lib/storage.ts` (lines 35-52)
- **Issue**: Reads ALL keys and calculates size on every write:
  ```typescript
  const keys = await AsyncStorage.getAllKeys();
  for (const key of keys) { ... }
  ```
- **Impact**: O(n) operations on every storage write.

### 2. Cache Size Too Small
- **Location**: `zero-auth-wallet/lib/proof.ts` (line 9)
- **Issue**: `MAX_CACHE_SIZE = 5` - only 5 circuits cached.
- **Impact**: Adding more credential types will cause cache thrashing.

### 3. No Connection Pooling for Supabase
- **Location**: `zero-auth-relay/src/db.ts`
- **Issue**: Single Supabase client with new fetch controller per query.
- **Impact**: Connection overhead under load.

---

## Fragile Areas

### 1. Magic Strings for Credential Types
- **Locations**: `zero-auth-wallet/lib/proof.ts`, `zero-auth-relay/src/errors.ts`
- **Issue**: Hardcoded credential type strings:
  ```typescript
  if (request.credential_type === 'Age Verification') { ... }
  ```
- **Impact**: Adding new credential types requires changes in 5+ places.

### 2. Silent Error Handling in Offline Queue
- **Location**: `zero-auth-wallet/lib/offline.ts` (lines 56-72)
- **Issue**: Failed actions are logged but not retried, then cleared:
  ```typescript
  } catch (e) {
    console.error('Failed to process action:', action.id, e);
  }
  await AsyncStorage.removeItem(QUEUED_ACTIONS_KEY);
  ```
- **Impact**: Failed actions are lost forever.

### 3. Race Condition in Cache Initialization
- **Location**: `zero-auth-relay/src/zk.ts` (lines 14-28)
- **Issue**: Flag check doesn't prevent concurrent calls.
- **Impact**: Multiple simultaneous requests could trigger multiple DB loads.

### 4. Extensive Use of `any` Type
- **Locations**: Multiple files (~31 occurrences)
- **Issue**: TypeScript's type checking is defeated.
- **Impact**: Runtime errors from type mismatches.

---

## Missing Infrastructure

### 1. No Test Suite
- **Finding**: No `.test.ts`, `.spec.ts`, or `__tests__` directories.
- **Impact**: Every change requires manual verification.

### 2. Inconsistent Linting
- **Finding**: Only `zero-auth-wallet` has `eslint.config.js`.
- **Impact**: Code quality may degrade.

### 3. No Type Checking Enforcement in Build
- **Location**: `zero-auth-relay/package.json`
- **Issue**: Build script may not enforce type checking.
- **Impact**: Type errors may slip through.

---

## Additional Concerns

### 1. Debug Logging Left in Production
- **Locations**: Throughout all packages (`console.log`, `console.warn`)
- **Impact**: Performance degradation, information leakage.

### 2. Missing Input Sanitization
- **Location**: `zero-auth-relay/src/index.ts` (lines 43-44)
- **Issue**: `verifier_name` used directly without sanitization.
- **Impact**: XSS or injection attacks possible.

### 3. Hardcoded Expiry Times
- **Location**: Multiple places (Relay: 5 minutes)
- **Impact**: No flexibility for different use cases.

---

## Summary Table

| Category | Count | Severity |
|----------|-------|----------|
| Incomplete Implementations | 4 | High |
| Security Vulnerabilities | 5 | Critical (1), High (4) |
| Performance Issues | 3 | Medium |
| Fragile Areas | 4 | High |
| Missing Tests/Infrastructure | 3 | Critical |
| Additional Concerns | 4 | Medium |
