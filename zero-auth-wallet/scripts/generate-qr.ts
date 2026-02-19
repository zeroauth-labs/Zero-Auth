import { VerificationRequest } from '../lib/qr-protocol';

const request: VerificationRequest = {
    v: 1,
    action: 'verify',
    session_id: 'test-session-' + Date.now(),
    nonce: 'random-nonce-' + Math.random().toString(36).substring(7),
    verifier: {
        did: 'did:web:demo.zeroauth.app',
        name: 'Zero Auth Demo',
        callback: 'https://demo.zeroauth.app/verify'
    },
    required_claims: ['age_over_18'],
    credential_type: 'Age Verification',
    expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
};

console.log(JSON.stringify(request));
