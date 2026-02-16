# E2E Testing Guide: Zero Auth

This guide outlines the "Golden Path" for testing the Zero Auth ecosystem end-to-end.

## Prerequisite
- Have an Android emulator or physical device running Expo Go.
- Ensure all dependencies are installed (`npm run install:all`).

## Step 1: Start the ecosystem
Run the following command from the root directory:
```bash
npm run dev:all
```
This will start:
- **Relay**: `http://localhost:3000`
- **SDK Demo**: `http://localhost:5173` (Vite default)
- **Wallet**: Expo Metro Bundler

## Step 2: Prepare the Wallet
1. Open the Zero Auth app in Expo Go.
2. In the Dashboard, use the **Seed Demo Data** button (added in Phase 6.2) to quickly populate your vault with test credentials.
3. Verify that you have an "Identity" and "Student ID" in your vault.

## Step 3: Trigger Verification
1. Open the SDK Demo in your browser (`http://localhost:5173`).
2. Click **Verify Age (18+)**.
3. A QR code should appear.

## Step 4: Scan and Prove
1. In the Zero Auth Wallet, tap the **Scanner** icon.
2. Scan the QR code from your browser.
3. Review the request and tap **Approve**.
4. Authenticate via Biometrics/PIN if prompted.

## Step 5: Verify Result
1. The browser should automatically detect the proof submission.
2. The UI should switch to a **"Verified!"** state and display the ZK proof metadata.
