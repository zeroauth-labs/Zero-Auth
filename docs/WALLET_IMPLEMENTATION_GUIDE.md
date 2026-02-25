# Zero-Auth Wallet Implementation Guide

This document analyzes the current state of the Zero-Auth Wallet (built with Expo / React Native) and provides a detailed step-by-step implementation guide to transform it into a highly polished, robust, and extensible identity app.

## 1. Analysis of Current Wallet

### 1.1 Identified Flaws & Lacking Features
1. **Intrusive Native UX (Alerts)**: The wallet heavily relies on native `Alert.alert` for success, error, and revocation messages in critical flows (like `approve-request.tsx`). This breaks immersion and feels unpolished compared to modern bottom-sheets or custom modals.
2. **Basic Credential Matching**: When a request comes in, the wallet simply picks the first credential that has all the `required_claims`. If a user has multiple valid credentials (e.g., two different KYC providers), they have no ability to choose which one to present.
3. **Lack of Deep Linking / Universal Links Integration**: While a QR scanner exists, identity wallets must seamlessly support deep linking (e.g., `zeroauth://verify?request=...`) so users don't have to scan a screen on the same mobile device.
4. **Hardcoded Circuit Logic**: The wallet generates proofs assuming a very specific circuit structure. Adapting to different use cases (Trial Licensing, Login vs. Age Verification) requires dynamic circuit fetching or downloading.
5. **No Advanced Recovery/Export**: Users cannot securely backup or export their credentials and salts to another device easily.

---

## 2. Implementation Guideline

### Phase 1: UX & UI Modernization
**Goal**: Remove all instances of `Alert.alert` and replace them with a unified, fluid design system.

1. **Implement Bottom Sheets**:
   - Integrate `@gorhom/bottom-sheet`.
   - Create a `TransactionBottomSheet.tsx` for approving requests. It should slide up when a QR is scanned or deep link is tapped, overriding the full-screen `approve-request.tsx` page.
2. **Feedback Components**:
   - Build custom `Toast` notifications for minor errors (e.g., "Network error, retrying...").
   - Build dedicated "Success" and "Failure" screens with Lottie animations (e.g., a morphing checkmark) that automatically navigate back to the home screen after 2 seconds.

### Phase 2: Core Flow Enhancements
**Goal**: Improve how the wallet handles requests and credentials.

1. **Credential Selection Engine**:
   - Rewrite the matching logic in `approve-request.tsx`.
   - Instead of `const matchingCredential = credentials.find(...)`, use `const matchingCredentials = credentials.filter(...)`.
   - If `matchingCredentials.length > 1`, display a horizontal carousel or list allowing the user to select which identity to use (e.g., "State ID" vs "Passport").
2. **Deep Linking (Universal Links)**:
   - Configure Expo's `app.json` for deep linking schemes:`scheme: "zeroauth"`.
   - In `_layout.tsx`, use `expo-linking` to intercept `zeroauth://request={json}`.
   - Automatically route the user to the `TransactionBottomSheet` with the parsed JSON, bypassing the camera scanner entirely when authenticating on the same device.

### Phase 3: Supporting Multiple Use Cases
**Goal**: Make the Wallet support Login, Credential Verification, and Trial Software easily.

1. **Dynamic UI Mapping**:
   - Based on the `request.credential_type` and a new `request.use_case` field, alter the UI text dynamically.
     - **LOGIN**: "Login to [Service Name]"
     - **VERIFICATION**: "Prove your identity to [Service Name]"
     - **TRIAL_LICENSE**: "Activate your trial for [Service Name]"
2. **Circuit Management**:
   - Implement an Over-The-Air (OTA) or demand-driven circuit download manager. Instead of bundling all `.zkey` and `.wasm` files (which bloats the app), the wallet should download the required circuit from a trusted CDN based on `request.credential_type` and cache it securely.

### Phase 4: Biometrics & Security Refinements
1. **Granular Biometrics**:
   - Currently, if biometrics fail, the user can never proceed. Implement a secure PIN fallback stored via `expo-secure-store`.
2. **Revocation Warnings**:
   - If a credential status is `unknown` (network failure), do not just show an Alert. Show a distinct yellow warning state in the UI that the user must explicitly slide-to-confirm, ensuring they understand the verifier might reject it anyway.

---

## 3. Summary of Refactoring Impact
By migrating to bottom sheets for the primary UX, adding deep link support, and supporting multiple credentials for a single request, the `zero-auth-wallet` will match the expectations of a modern Web3/Zero-Knowledge consumer application.
