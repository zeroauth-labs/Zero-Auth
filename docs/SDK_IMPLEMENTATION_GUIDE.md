# Zero-Auth SDK Implementation Guide

This document provides a comprehensive analysis of the existing Zero-Auth SDK, identifies its critical flaws and missing features, and lays out a detailed, step-by-step implementation guide for an enterprise-grade, polished SDK.

## 1. Analysis of Current SDK

### 1.1 Identified Flaws & Lacking Features
1. **Redundant & Fragmented Implementations**: The SDK is split into `index.ts` (Vanilla JS) and `index.tsx` (React), duplicating types, the `ZeroAuth` class, and polling logic.
2. **Fake QR Code Generation**: `index.tsx` uses a mock canvas drawing routine that draws a static, fake QR pattern instead of actually encoding the `qrPayload`.
3. **Hardcoded UI & Styling**: The React modal (`ZeroAuthModal`) uses hardcoded inline styles (`#1a1b26`, `#7aa2f7`), limiting the relying party's (RP) ability to match their brand identity.
4. **Inefficient State Management (Polling)**: Both implementations rely on basic `setInterval` polling (every 2 seconds) to check session status via the Relay. This is inefficient and prone to race conditions if not cleared properly.
5. **Lack of Use-Case Flexibility**: The default flow is strictly hardcoded to "Age Verification" and `['birth_year']`. It lacks an extensible API to easily switch between use cases like:
   - Login / Authentication
   - Credential Verification (e.g., KYC, Age)
   - Trial Software / Licensing
6. **No Pre-built Themes or Dark/Light Mode**: Only a single dark-mode aesthetic is provided inline.
7. **"Alerts" and Native Popups**: The SDK needs a strictly DOM-based, smooth modal flow without any browser-native `alert()`, `confirm()`, or unbranded error popups.
8. **Lack of Proper Error Recovery**: If a session expires, times out, or the user rejects the request, the SDK doesn't offer a "Retry" or graceful error state inside the modal.

### 1.2 Integration Refactoring Needed
- **Relay Server upgrade**: To support real-time status updates without polling, the Relay server should be updated to support **Server-Sent Events (SSE)** or WebSockets for the `/sessions/:id/status` endpoint.
- **Wallet Alignment**: The payload the Wallet sends to the Relay must seamlessly pass the structured claims to the SDK upon `COMPLETED`.

---

## 2. Implementation Guideline

### Phase 1: Core Architecture & State Management Consolidation
**Goal**: Unify Vanilla JS and React implementations under a single core engine.

1. **Create a Vanilla Core (`src/core/ZeroAuthClient.ts`)**:
   - Move all API communication, state management, and configuration here.
   - Implement an Event Emitter pattern (`on('success')`, `on('error')`, `on('scanning')`).
   - Switch from `setInterval` HTTP polling to **Server-Sent Events (SSE)** for real-time updates. Fallback to polling ONLY if SSE fails.

2. **Define Extensible Configurations**:
   ```typescript
   export type AuthUseCase = 'LOGIN' | 'VERIFICATION' | 'TRIAL_LICENSE';

   export interface ZeroAuthOptions {
     relayUrl: string;
     verifierName: string;
     useCase: AuthUseCase;
     credentialType?: string;
     claims?: string[];
     theme?: 'light' | 'dark' | 'system';
     customStyles?: Record<string, string>;
   }
   ```

### Phase 2: User Interface & Experience Development
**Goal**: Build a highly polished, robust, and continuous UI without Javascript alerts.

1. **Real QR Code Library**:
   - Replace the fake canvas drawing with a lightweight, robust QR code library like `qrcode` or `qrcode.react`.
2. **Smooth, Alert-Free Modal Transitions**:
   - The modal should smoothly transition between states: `Loading` -> `QR Code Screen` -> `Success (Checkmark Animation)` -> `Error (with Retry Button)`.
   - Ensure the modal is injected into the DOM reliably (using Portals in React, or appending to `document.body` in Vanilla JS).
   - Never use `window.alert`. Use toast notifications or inline modal error messages instead.
3. **Framework Wrappers**:
   - **Vanilla JS (`src/ui/ZeroAuthModal.ts`)**: A class that creates DOM elements elegantly and listens to the `ZeroAuthClient` events.
   - **React (`src/react/ZeroAuthButton.tsx`)**: A wrapper around the Vanilla core, using React state to drive the UI.
4. **Theming Engine**:
   - Extract inline styles to CSS Variables (`--za-bg`, `--za-text`, `--za-accent`), allowing the relying party to override them easily in their global CSS.

### Phase 3: Supporting Multiple Use Cases
**Goal**: Provide out-of-the-box support for the three core workflows.

1. **Login Authorization**:
   - **Config**: `useCase: 'LOGIN'`
   - **Behavior**: Requests standard identity claims (e.g., `['did', 'public_key']`). Upon success, the RP sets a session cookie using the returned DID.
2. **Credential Verifying (e.g., Age, KYC)**:
   - **Config**: `useCase: 'VERIFICATION', credentialType: 'Age Verification', claims: ['age_over_18']`
   - **Behavior**: Returns a boolean verifiable presentation success. Does not necessarily log the user in, just unlocks a feature (like buying restricted items).
3. **Trial Software / Licensing**:
   - **Config**: `useCase: 'TRIAL_LICENSE', credentialType: 'Software License', claims: ['license_valid_until']`
   - **Behavior**: Validates that the wallet holds a valid license credential. The RP then provisions access to the software download or SaaS dashboard.

### Phase 4: Integration & Refactoring the Relay
1. **Relay Server Feature Addition**:
   - In `zero-auth-relay`, expose an endpoint: `GET /api/v1/sessions/:id/stream`.
   - Implement standard SSE (Server-Sent Events) returning chunks like `data: {"status": "COMPLETED", "proof": {...}}`.
2. **Wallet Adjustments**:
   - Ensure the Wallet's QR Scanner recognizes the `useCase` flag to display context-aware prompts to the user ("Login to X" vs "Prove your age to X").

---

## 3. Documentation & Continuity Guide

To ensure continuity and easy adoption by existing websites, the SDK must ship with clear documentation.

### 3.1 Installation
```bash
npm install @zero-auth/sdk
```

### 3.2 HTML/Vanilla JS Integration (CDN)
```html
<script src="https://cdn.zero-auth.com/sdk/v1/zero-auth.min.js"></script>
<script>
  const zAuth = new ZeroAuth.Client({
    relayUrl: 'https://relay.yourdomain.com',
    useCase: 'LOGIN',
    theme: 'dark'
  });

  document.getElementById('login-btn').addEventListener('click', () => {
    zAuth.startFlow()
      .then(result => console.log('Login successful!', result))
      .catch(error => console.error('Flow failed UI updated automatically', error));
  });
</script>
```

### 3.3 React Integration
```tsx
import { ZeroAuthButton } from '@zero-auth/sdk/react';

function App() {
  return (
    <ZeroAuthButton 
      useCase="VERIFICATION"
      credentialType="KYC Clearance"
      claims={['is_cleared']}
      relayUrl="https://relay.yourdomain.com"
      onSuccess={(res) => handleSuccess(res)}
      onError={(err) => handleError(err)}
      theme="light"
    />
  );
}
```

### 3.4 Summary
By implementing the above architecture, the `zero-auth-sdk` will transition from a rudimentary prototype to a robust, framework-agnostic client library. It will offer real-time updates, customizable aesthetics, and broad use-case support, completely abandoning native popups for a secure, embedded, and continuous user experience.
