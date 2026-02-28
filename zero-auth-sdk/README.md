# ZeroAuth SDK

[![Version](https://img.shields.io/badge/Version-1.1.000-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)]()
[![React](https://img.shields.io/badge/React-16.8+-61dafb.svg)]()

**ZeroAuth SDK** is a JavaScript/TypeScript library for passwordless ZK credential verification. Enable users to verify credentials (age, student status, etc.) without revealing personal data using Zero-Knowledge Proofs.

---

## Features

- 🔐 **Zero-Knowledge Proofs** - Verify credentials without exposing data
- 📱 **QR Code Verification** - Scan QR to connect wallet
- 🔗 **Deep Links** - Direct wallet app opening
- 🛡️ **Tamper Detection** - QR payload signing
- ⚡ **TypeScript** - Full type support
- ⚛️ **React Ready** - Components + Hooks
- 🌐 **Vanilla JS** - Framework agnostic
- 🎨 **Customizable** - Themes, colors, sizes

---

## Installation

```bash
npm install @zero-auth/sdk
# or
yarn add @zero-auth/sdk
```

---

## Quick Start

### 1. Configure

```javascript
// Set global config (before using SDK)
window.__ZERO_AUTH_CONFIG__ = {
  relayUrl: 'https://your-relay-server.com',
  apiKey: 'your-api-key',       // Optional
  verifierName: 'Your App Name',
  timeout: 60                    // seconds
};
```

### 2. React Usage

```tsx
import { ZeroAuthButton } from '@zero-auth/sdk';

function LoginPage() {
  return (
    <ZeroAuthButton
      request={{
        credentialType: 'Age Verification',
        claims: ['birth_year'],
        useCase: 'LOGIN'
      }}
      text="Sign in with ZeroAuth"
      onSuccess={(result) => {
        console.log('Verified!', result.claims);
      }}
      onError={(error) => {
        console.error('Error:', error.message);
      }}
    />
  );
}
```

### 3. Vanilla JavaScript

```javascript
import { ZeroAuth } from '@zero-auth/sdk';

const zeroAuth = new ZeroAuth({
  relayUrl: 'https://your-relay-server.com',
  verifierName: 'My App'
});

const result = await zeroAuth.verify({
  credentialType: 'Age Verification',
  claims: ['birth_year']
});

if (result.success) {
  console.log('Verified!', result.claims);
}
```

---

## API Reference

### Configuration

```typescript
interface ZeroAuthConfig {
  relayUrl: string;           // Relay server URL (required)
  apiKey?: string;            // API key for authentication
  verifierName?: string;      // Name shown to users
  credentialType?: string;    // Default credential type
  claims?: string[];          // Default claims to request
  timeout?: number;           // Session timeout in seconds
  headers?: Record<string, string>; // Custom headers
}
```

### Verification Request

```typescript
interface VerificationRequest {
  credentialType: string;      // 'Age Verification' | 'Student ID' | etc.
  claims: string[];           // ['birth_year', 'country']
  useCase?: 'LOGIN' | 'VERIFICATION' | 'TRIAL_LICENSE';
  timeout?: number;
}
```

### Verification Result

```typescript
interface VerificationResult {
  success: boolean;
  sessionId?: string;
  claims?: Record<string, unknown>;
  error?: string;
  errorCode?: string;
}
```

---

## Utility Functions

### validateConfig(config)
Validates the SDK configuration.

```javascript
import { validateConfig } from '@zero-auth/sdk';

const result = validateConfig({ relayUrl: 'https://...' });
if (!result.valid) {
  console.error(result.errors);
}
```

### validateQRPayload(payload)
Validates QR payload to detect tampering.

```javascript
import { validateQRPayload } from '@zero-auth/sdk';

const result = validateQRPayload(qrPayloadString);
if (!result.valid) {
  console.error(result.error);
}
```

---

## Advanced Usage

### Custom QR Code Options

```javascript
const qrDataUrl = await zeroAuth.generateQRBase64(payload, {
  width: 300,
  color: '#1a1b26',      // Dark modules
  backgroundColor: '#ffffff',
  errorCorrectionLevel: 'H'  // High error correction
});
```

### Deep Links

```javascript
// Generate deep link to open wallet app directly
const deepLink = zeroAuth.generateDeeplink(sessionId);
// Result: zeroauth://verify?session=abc123
```

### Session Management

```javascript
// Get session status without polling
const status = await zeroAuth.getSessionStatus(sessionId);

// Cancel ongoing verification
await zeroAuth.cancelSession(sessionId);

// Clean up
zeroAuth.destroy();
```

### React Hook

```tsx
import { useZeroAuthVerification } from '@zero-auth/sdk';

function VerificationComponent() {
  const { 
    verify, 
    cancel, 
    qrDataUrl, 
    status, 
    error 
  } = useZeroAuthVerification();

  return (
    <div>
      {status === 'idle' && (
        <button onClick={() => verify({ credentialType: 'Age Verification' })}>
          Verify
        </button>
      )}
      {status === 'scanning' && (
        <img src={qrDataUrl} alt="QR" />
      )}
      {status === 'completed' && <p>Verified!</p>}
      {status === 'expired' && <p>Please try again</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

---

## Error Types

```typescript
import { ZeroAuthError, ConfigurationError, NetworkError, SessionError, QRGenerationError } from '@zero-auth/sdk';

try {
  await zeroAuth.verify(request);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Invalid config:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof SessionError) {
    console.error('Session error:', error.message);
  } else if (error instanceof QRGenerationError) {
    console.error('QR error:', error.message);
  }
}
```

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- React Native (via Expo)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- [Website](https://zeroauth.dev)
- [GitHub](https://github.com/zeroauth-labs)
- [Relay Server](https://github.com/zeroauth-labs/zero-auth-relay)
- [Wallet App](https://github.com/zeroauth-labs/zero-auth-wallet)
