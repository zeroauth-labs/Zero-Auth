# ZeroAuth

Zero-Knowledge Proof authentication system for private credential verification.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Wallet    │────▶│   Relay     │◀────│    SDK     │
│  (Mobile)  │     │  (Server)   │     │   (Web)    │
└─────────────┘     └─────────────┘     └─────────────┘
```

- **Wallet**: React Native/Expo mobile app
- **Relay**: Node.js/Express server
- **SDK**: Web integration library

## Quick Start

### Production

- Relay: https://zeroauth-relay.onrender.com
- Demo: https://zeroauth-labs.github.io/Zero-Auth/

### Local Development

```bash
# Wallet
cd zero-auth-wallet
npm install
cd android && ./gradlew assembleDebug

# Relay
cd zero-auth-relay
npm install
# Create .env with SUPABASE_URL and SUPABASE_ANON_KEY
npm run dev
```

## SDK Usage

### React

```bash
npm install @zero-auth/sdk
```

```jsx
import { ZeroAuthButton } from '@zero-auth/sdk';

<ZeroAuthButton 
  credentialType="Age Verification"
  claims={['birth_year']}
  onSuccess={(result) => console.log(result)}
/>

```

### CDN / Vanilla JS

```html
<script src="https://unpkg.com/@zero-auth/sdk/dist/zero-auth-sdk.umd.js"></script>
<script>
  window.ZeroAuthConfig = {
    relayUrl: 'https://zeroauth-relay.onrender.com'
  };
</script>
```

## Environment Variables

### Relay (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
PUBLIC_URL=http://localhost:3000
```

## Project Structure

```
├── zero-auth-wallet/   # Mobile app
├── zero-auth-relay/    # Server
├── zero-auth-sdk/      # Web SDK
└── demo-site/          # Demo website
```

## License

MIT
