# ZeroAuth

A Zero-Knowledge Proof (ZKP) based authentication system for private credential verification.

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Wallet    │────▶│   Relay     │◀────│    SDK     │
│  (Mobile)  │     │  (Server)   │     │   (Web)    │
└─────────────┘     └─────────────┘     └─────────────┘
     │                     │                     │
 Generates ZK        Session &           Request
   Proofs           Verification         Verification
```

- **Wallet** (Mobile App): React Native/Expo app that stores credentials and generates ZK proofs on-device
- **Relay** (Server): Node.js/Express service that manages sessions and verifies proofs
- **SDK** (Web): TypeScript library for websites to request verifications

## 🚀 Quick Start

### Production URLs (Already Deployed)

- **Relay**: https://zeroauth-relay.onrender.com
- **Demo Site**: https://zeroauth-labs.github.io/Zero-Auth/

### Running Locally

#### 1. Wallet (Mobile App)

```bash
cd zero-auth-wallet
npm install

# Build APK (requires Java 17)
cd android
./gradlew assembleDebug

# Install on phone
adb install app/build/outputs/apk/debug/app-debug.apk
```

#### 2. Relay (Server)

```bash
cd zero-auth-relay
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials

# Run
npm run dev
```

#### 3. SDK

```bash
cd zero-auth-sdk
npm install
npm run build

# Use in your project
import { ZeroAuth } from '@zero-auth/sdk';
```

## 📱 Usage

### Demo Site Flow

1. Open https://zeroauth-labs.github.io/Zero-Auth/
2. Select credential type (Age Verification, Student ID, Trial)
3. Click "Sign in using ZeroAuth"
4. Scan QR with wallet app
5. Approve the request
6. Website shows verification result

### SDK Integration

```javascript
import { ZeroAuth } from '@zero-auth/sdk';

const zeroAuth = new ZeroAuth({
  relayUrl: 'https://zeroauth-relay.onrender.com'
});

// Request verification
const result = await zeroAuth.verify({
  credentialType: 'Age Verification',
  claims: ['birth_year', 'country']
});

console.log(result);
// { success: true, claims: {...} }
```

## 🔧 Environment Variables

### Relay (.env)

```env
# Supabase (get from https://supabase.com)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# Public URL (your deployment URL)
PUBLIC_URL=http://localhost:3000

NODE_ENV=development
PORT=3000
```

## 📁 Project Structure

```
├── zero-auth-wallet/     # Mobile wallet app (React Native/Expo)
├── zero-auth-relay/     # Relay server (Node.js/Express)
├── zero-auth-sdk/       # Web SDK (TypeScript)
└── demo-site/           # Demo website
```

## 🔒 Security Notes

- ZK proofs never reveal raw data - only prove statements
- Credentials stored encrypted on device
- Session timeouts prevent replay attacks
- No API keys stored in frontend code

## 📄 License

MIT
