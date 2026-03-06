# Testing Patterns

**Analysis Date:** 2026-03-06

## Test Framework

**Runner:**
- **Vitest** - Primary test framework (per ecosystem)
- **tsx** - TypeScript execution for development
- Config: Package-specific (not centralized)

**Assertion Library:**
- Vitest built-in expect

**Run Commands:**
```bash
# Not consistently configured
npm test              # Run tests (if configured)
tsx watch src/       # Dev with watch
```

## Test File Organization

**Location:**
- Pattern: Mixed - some in `__tests__/`, some co-located
- `zero-auth-relay/test-relay.ts` - Integration tests

**Naming:**
- Test files: `*.test.ts`, `*.spec.ts`, or `test-*.ts`

**Structure:**
```
zero-auth-relay/
├── src/
│   ├── index.ts
│   └── ...
└── test-relay.ts    # Integration tests
```

## Test Structure

**Suite Organization:**
```typescript
// zero-auth-relay/test-relay.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('Session Creation', () => {
  it('should create a session', async () => {
    // Test implementation
  });
});
```

**Patterns:**
- `beforeAll` for setup
- Async/await for Promises
- Expect for assertions

## Mocking

**Framework:** Vitest mocking or manual mocks

**Patterns:**
```typescript
// Manual mock example
const mockSupabase = {
  from: () => ({
    insert: () => ({ data: {}, error: null }),
    select: () => ({ data: [], error: null }),
  }),
};
```

**What to Mock:**
- Supabase client in unit tests
- ZK proof generation (CPU intensive)
- External APIs

**What NOT to Mock:**
- Business logic that is being tested
- Simple utility functions

## Fixtures and Factories

**Test Data:**
- Inline in test files
- Seed data in `supabase/seed-*.sql`

**Location:**
- Inline with tests
- No centralized fixture files detected

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# Not configured
vitest run --coverage
```

## Test Types

**Unit Tests:**
- Limited detection
- Focus on utility functions

**Integration Tests:**
- `zero-auth-relay/test-relay.ts` - API integration tests
- Tests session creation, rate limiting, proof validation

**E2E Tests:**
- Not detected

## Common Patterns

**Async Testing:**
```typescript
it('should verify proof', async () => {
  const result = await verifyProof(proof, verificationKey);
  expect(result).toBe(true);
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', async () => {
  await expect(validateInput(invalidData)).rejects.toThrow();
});
```

---

*Testing analysis: 2026-03-06*
