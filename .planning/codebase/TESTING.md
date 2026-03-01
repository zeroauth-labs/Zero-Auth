# Testing Approach

## Current State

### No Formal Test Framework

The Zero-Auth codebase currently **does not have a formal testing framework** implemented. The project lacks:
- Jest, Vitest, or Mocha test runners
- Test scripts in package.json
- Unit test files or test directories
- Code coverage configuration

### Manual Integration Testing

The only testing currently in place is a manual integration test file:

**`zero-auth-relay/test-relay.ts`**
- Location: `/zero-auth-relay/test-relay.ts`
- Type: Manual HTTP integration tests using `node-fetch`
- Run manually against a running relay server at `http://localhost:3000/api/v1`
- Tests the following scenarios:
  1. Session creation with use_case
  2. Session creation rate limiting (10 requests/minute)
  3. Proof submission validation (Zod schema validation)
  4. SSE stream connection
  5. Worker validation

### Example Test Pattern (Current)

```typescript
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/v1';

async function testSessionCreation() {
  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verifier_name: 'Test Setup',
      use_case: 'LOGIN',
      credential_type: 'Test Credential'
    })
  });
  return res.json();
}
```

---

## Recommendations for Testing

### 1. Install a Test Framework

Add a testing framework to each package:

```bash
# For zero-auth-relay (Node.js/Express)
npm install --save-dev jest ts-jest @types/jest

# For zero-auth-sdk (Browser/React)
npm install --save-dev vitest @testing-library/react jsdom

# For zero-auth-wallet (React Native/Expo)
npm install --save-dev vitest @testing-library/react-native
```

### 2. Test Structure Recommendations

Follow standard testing patterns:

```
zero-auth-relay/
├── src/
│   ├── __tests__/           # Unit tests
│   │   ├── validation.test.ts
│   │   ├── db.test.ts
│   │   └── zk.test.ts
│   └── index.ts
├── test-relay.ts            # Manual integration tests (keep for now)
└── jest.config.js
```

```
zero-auth-sdk/
├── src/
│   ├── __tests__/
│   │   ├── ZeroAuthButton.test.tsx
│   │   └── init.test.ts
│   └── index.ts
└── vitest.config.js
```

### 3. Suggested Test Patterns

#### Unit Tests for Relay (Jest)

```typescript
// zero-auth-relay/src/__tests__/validation.test.ts
import { describe, it, expect, beforeEach } from 'jest';
import { validateSessionRequest } from '../validation';

describe('validateSessionRequest', () => {
  it('should reject invalid verifier_name', () => {
    const result = validateSessionRequest({
      verifier_name: '',  // Invalid
      use_case: 'LOGIN'
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid session request', () => {
    const result = validateSessionRequest({
      verifier_name: 'Test App',
      use_case: 'LOGIN',
      credential_type: 'Age Check'
    });
    expect(result.success).toBe(true);
  });
});
```

#### Component Tests for SDK (Vitest + Testing Library)

```typescript
// zero-auth-sdk/src/__tests__/ZeroAuthButton.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ZeroAuthButton } from '../components/ZeroAuthButton';

describe('ZeroAuthButton', () => {
  it('should render with correct text', () => {
    render(<ZeroAuthButton credentialType="Age Verification" />);
    expect(screen.getByText('Verify with ZeroAuth')).toBeInTheDocument();
  });
});
```

### 4. Mocking Patterns

#### Mocking Node Modules (Relay)

```typescript
// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [] }),
      select: jest.fn().mockResolvedValue({ data: [] }),
      update: jest.fn().mockResolvedValue({ data: [] }),
    })),
  })),
}));
```

#### Mocking Web APIs (SDK)

```typescript
// Mock fetch for browser tests
import { vi } from 'vitest';
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ session_id: 'test-123' }),
});
```

### 5. Test Utilities

Create shared test utilities in a common location:

```
/testing/
├── utils/
│   ├── mockZKProof.ts      # Generate mock ZK proofs
│   ├── mockSession.ts      # Create mock session objects
│   └── testHelpers.ts      # Common test utilities
└── fixtures/
    └── sampleProof.json   # Sample proof data for tests
```

---

## Coverage Expectations

### Target Coverage Goals

| Package | Unit Tests | Integration Tests | Target Coverage |
|---------|------------|-------------------|-----------------|
| zero-auth-relay | High priority | Existing (manual) | 70%+ |
| zero-auth-sdk | Medium priority | Recommended | 60%+ |
| zero-auth-wallet | Lower priority | Manual testing | 50%+ |

### Priority Areas for Testing

1. **Relay Validation** (`validation.ts`) - Critical for security
   - Input validation schemas
   - Rate limiting logic
   - Error handling

2. **ZK Proof Processing** (`zk.ts`, `proof-worker.ts`)
   - Proof verification
   - Worker message handling

3. **Database Operations** (`db.ts`)
   - Session CRUD operations
   - Query building

4. **SDK Components** (React)
   - ZeroAuthButton component
   - Initialization flow

---

## Running Tests

### Current (Manual)

```bash
# Start relay server
cd zero-auth-relay && npm run dev

# Run manual integration tests (in another terminal)
cd zero-auth-relay && npx tsx test-relay.ts
```

### Recommended (With Framework)

```bash
# Add to package.json scripts
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}

# Run tests
npm test
npm run test:coverage
```

---

## CI/CD Integration

For automated testing, consider adding a GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Run relay tests
        working-directory: zero-auth-relay
        run: npm test
      
      - name: Run SDK tests
        working-directory: zero-auth-sdk
        run: npm test
```

---

## Summary

The Zero-Auth project currently has minimal testing infrastructure. The primary testing activity is a manual integration test script for the relay server. To improve code quality and maintainability:

1. **Immediate**: Add unit tests for validation and critical paths
2. **Short-term**: Install Jest/Vitest and create component tests
3. **Long-term**: Establish CI/CD pipeline with automated test runs
4. **Ongoing**: Target 60-70% code coverage for critical packages
