# TESTING.md - Test Structure and Practices

## Test Framework Status

**Finding: This codebase does NOT have a formal test framework set up.**

- No Jest, Mocha, or Vitest configuration found
- No `*.test.ts` or `*.spec.ts` files
- Testing is done through **manual integration tests**

## Manual Test Pattern

The relay package includes a simple test script for manual verification:

```typescript
// zero-auth-relay/scripts/test-relay.ts
async function testSessionCreation() {
  console.log('\n--- Test: Session Creation ---');
  try {
    const res = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* ... */ })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    return data;
  } catch (e) {
    console.error('Error:', e);
  }
}
```

### Test Execution
- Tests are run manually against running server
- Use `node-fetch` for HTTP requests
- Simple console-based assertions

## Recommended Test Setup

For future test infrastructure, consider:

### Framework Options

1. **Vitest** (Recommended)
   - Faster than Jest
   - Compatible with Vite ecosystem
   - Works well with TypeScript

2. **Jest**
   - More mature, larger ecosystem
   - Built-in mocking support

### Test Structure

```
zero-auth-relay/
├── src/
│   └── __tests__/
│       ├── sessions.test.ts
│       ├── validation.test.ts
│       └── zk.test.ts
├── vitest.config.ts
└── package.json
```

### Example Test

```typescript
import { describe, it, expect, beforeAll } from 'vitest';

describe('Session API', () => {
  it('should create a new session', async () => {
    const res = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verifier_name: 'Test Verifier',
        credential_type: 'Age Verification'
      })
    });
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.session_id).toBeDefined();
  });
});
```

## Mocking Strategies

Currently no mocking framework is used. For future implementation:

### MSW (Mock Service Worker)
- Recommended for API mocking
- Works in browser and Node.js
- Can intercept requests at network level

### Example Mock Setup

```typescript
import { http, HttpResponse } from 'msw';

const handlers = [
  http.post('/api/v1/sessions', () => {
    return HttpResponse.json({
      session_id: 'test-123',
      nonce: 'abc123',
      status: 'PENDING'
    });
  })
];
```

## Coverage Goals

Recommended coverage targets:
- **Unit tests**: 80% for business logic (validation, error handling)
- **Integration tests**: Critical paths (session creation, proof submission)
- **E2E tests**: Full verification flow (SDK → Relay → Wallet)

## Linting

- `zero-auth-wallet` has `eslint.config.js`
- Other packages should adopt similar configuration
- Consider adding `eslint-plugin-test-library` when tests are added
