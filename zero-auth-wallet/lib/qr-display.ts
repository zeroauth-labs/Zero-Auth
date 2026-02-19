import { getWalletIdentity } from './wallet';

/**
 * Generates QR payload for proof presentation.
 * Returns DID and public key in a format verifiers can scan.
 */
export async function getQrPayload(): Promise<string> {
  const identity = await getWalletIdentity();
  if (!identity) {
    throw new Error('Wallet not initialized');
  }
  
  // Return JSON payload with DID for verifier to use
  return JSON.stringify({
    did: identity.did,
    type: 'ZeroAuthIdentity'
  });
}
