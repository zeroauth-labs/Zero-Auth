# Zero Auth

A Zero-Knowledge Proof (ZKP) based authentication system demonstrating private age verification.

## Architecture

- **Wallet (Mobile App)**: React Native (Expo) app that stores credentials and generates ZK proofs on-device using a hidden WebView bridge.
- **Relay (Server)**: Node.js/Express service that facilitates the session handshake and proof verification.
- **SDK (Client)**: TypeScript library for web apps to request and verify proofs from the Wallet.

## Prerequisites

- Node.js (v18+)
- Expo Go app on your physical mobile device (Android/iOS)
- [Ngrok](https://ngrok.com/) (for tunneling to physical device)
- Redis (for session storage)

## Quick Start

### 1. Setup Environment

Create a `.env` file in `zero-auth-relay/`:
```env
PORT=3000
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
RELAY_DID=did:web:demo-relay
# PUBLIC_URL will be set by ngrok
```

### 2. Install Dependencies

```bash
# Root
npm install

# Relay
cd zero-auth-relay
npm install

# SDK
cd ../zero-auth-sdk
npm install
npm run build

# Wallet
cd ../zero-auth-wallet
npm install
```

### 3. Start the System

We use a unified command to start everything, but first you must start the tunnel.

**Step A: Start Ngrok**
```bash
ngrok http 3000
```
Copy the forwarding URL (e.g., `https://<id>.ngrok-free.app`).

**Step B: Configure Tunnel**
Update `zero-auth-relay/.env`:
```env
PUBLIC_URL=https://<id>.ngrok-free.app
```
Update `zero-auth-sdk/examples/basic/src/main.ts`:
```ts
const RELAY_URL = 'https://<id>.ngrok-free.app';
```

**Step C: Run Dev Server**
In the root directory:
```bash
npm run dev:all
```
This will start:
- Redis (if configured in script) or ensure it's running.
- Relay Server (Port 3000)
- SDK Demo (Port 5173)
- Expo Metro Bundler (Port 8081)

### 4. Verification Flow

1.  **Open SDK Demo**: Go to `http://localhost:5173` on your laptop.
2.  **Open Wallet**: Scan the Expo QR code with your phone (using Expo Go).
3.  **Start Verification**: Click "Start Verification" on the laptop. A QR code will appear.
4.  **Scan & Approve**: Scan the verification QR code with the Zero Auth Wallet.
5.  **Success**: The wallet will generate a ZK proof and submit it. The laptop will show "✅ Verified!".

## Troubleshooting

- **Network Request Failed**: Ensure `PUBLIC_URL` matches your current ngrok URL.
- **CORS Errors**: The Relay is configured to allow `ngrok-skip-browser-warning`. Ensure you restarted the relay after changing config.
- **Expo Connection**: Ensure your phone handles the deep link or scan the QR code from the `dev:all` output.
