# CONVENTIONS.md - Code Style and Patterns

## Code Style Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `auth-store.ts`, `qr-protocol.ts` |
| Classes | PascalCase | `ZeroAuth`, `ZeroAuthError` |
| Interfaces/Types | PascalCase | `VerificationRequest`, `SessionInfo` |
| Functions | camelCase | `generateQRBase64`, `validateConfig` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PROOF_SIZE`, `DB_QUERY_TIMEOUT` |
| Enums | PascalCase | `ErrorCode.SESSION_NOT_FOUND` |

### TypeScript Configuration

- **Strict mode enabled** in all packages (`"strict": true`)
- **Target ES2020** for SDK, **ES2022** for relay
- **Module resolution**: `node` for SDK, `bundler` for relay
- **Declaration files** generated for libraries

### Formatting Patterns

- **Section comments**: Use `// ===================` with uppercase headings
- **JSDoc comments**: For public APIs with `@param`, `@returns`, `@throws`
- **Single quotes** for strings in TypeScript
- **Trailing commas** in multi-line objects/arrays

## Common Patterns

### Error Handling

```typescript
// Custom error classes extending Error
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

// Error factory function
export function createError(code: ErrorCode, message: string, details?: Record<string, unknown>): ApiError {
  return {
    error: code,
    code,
    message,
    details,
  };
}
```

### Configuration Objects

```typescript
// Interface for config with defaults
export interface ZeroAuthConfig {
  relayUrl: string;
  apiKey?: string;
  timeout?: number;
}

// Required version with defaults applied
private config: Required<ZeroAuthConfig>;

constructor(config: ZeroAuthConfig) {
  this.config = {
    relayUrl: config.relayUrl.replace(/\/$/, ''),
    apiKey: config.apiKey || '',
    timeout: config.timeout || 60,
  };
}
```

### Validation Pattern

```typescript
export function validateConfig(config: ZeroAuthConfig): ValidationResult {
  const errors: string[] = [];
  
  if (!config.relayUrl) {
    errors.push('relayUrl is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### State Management (Zustand in wallet)

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      sessions: [],
      addSession: (session) => set((state) => ({
        sessions: [...state.sessions, session]
      })),
    }),
    {
      name: 'zero-auth-store',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
```

### Express Middleware Pattern

```typescript
export function validateSessionCreation(req: Request, res: Response, next: NextFunction) {
  const errors: ValidationError[] = [];
  
  // Validation logic
  if (errors.length > 0) {
    return res.status(400).json(createError(
      ErrorCode.INVALID_REQUEST_BODY,
      'Invalid request body',
      { errors }
    ));
  }
  
  next();
}
```

### Logging Pattern

```typescript
// Console logging with context
console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
console.log('[Proof] Submission started - session_id:', req.params.id);
console.error('[ZK] CRITICAL: Proof verification error:', error.message);
```

## Error Handling Approaches

### In SDK (zero-auth-sdk)
- **Custom error hierarchy**: `ZeroAuthError` -> `ConfigurationError`, `NetworkError`, `SessionError`, `QRGenerationError`
- **Error codes**: String codes like `'CONFIG_ERROR'`, `'NETWORK_ERROR'`
- **Status codes**: HTTP status codes for network errors

### In Relay (zero-auth-relay)
- **ErrorCode enum**: Centralized error codes
- **Factory function**: `createError()` returns standardized API error objects
- **Structured errors**: `{ error, code, message, details? }` format

```typescript
// Example error response
{
  "error": "SESSION_NOT_FOUND",
  "code": "SESSION_NOT_FOUND", 
  "message": "Session not found or expired",
  "details": { "sessionId": "abc-123" }
}
```

### In Wallet
- **Exception throwing**: `throw new Error('message')`
- **Console warnings**: For non-critical issues
- **Validation functions**: Return `{ valid: boolean, errors: string[] }`

## Commit Format

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix  
- docs: Documentation
- refactor: Code restructure
- test: Tests
- chore: Maintenance
```

## Documentation

- **JSDoc** for public APIs
- **Section headers** using `// ===` patterns
- **Inline comments** for complex logic
