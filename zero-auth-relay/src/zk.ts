// ZeroAuth Relay - ZK Proof Verification

import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Using any for verification key - snarkjs types don't match actual exports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let verificationKey: any = null;
let verificationKeyLoaded = false;

/**
 * Load verification key from environment or file
 */
export function loadVerificationKey(): void {
  if (verificationKeyLoaded) return;

  const keySource = process.env.ZK_VERIFICATION_KEY;
  
  if (!keySource) {
    console.log('[ZK] No ZK_VERIFICATION_KEY set - proof verification disabled');
    verificationKeyLoaded = true;
    return;
  }

  try {
    if (keySource.startsWith('file://')) {
      // Load from file
      const filePath = keySource.replace('file://', '');
      const keyData = fs.readFileSync(filePath, 'utf-8');
      verificationKey = JSON.parse(keyData);
    } else {
      // Assume base64 encoded JSON
      const decoded = Buffer.from(keySource, 'base64').toString('utf-8');
      verificationKey = JSON.parse(decoded);
    }
    
    console.log('[ZK] Verification key loaded successfully');
    verificationKeyLoaded = true;
  } catch (error) {
    console.error('[ZK] Failed to load verification key:', error);
    throw new Error('Invalid ZK_VERIFICATION_KEY - could not parse as JSON');
  }
}

/**
 * Check if verification is enabled
 */
export function isVerificationEnabled(): boolean {
  if (!verificationKeyLoaded) {
    loadVerificationKey();
  }
  return verificationKey !== null;
}

/**
 * Verify a ZK proof cryptographically
 * @param proof - The ZK proof object with pi_a, pi_b, pi_c
 * @param publicSignals - Public signals from the proof
 * @returns Promise<boolean> - true if proof is valid
 */
export async function verifyProof(
  proof: Record<string, unknown>,
  publicSignals: string[] = []
): Promise<boolean> {
  if (!verificationKeyLoaded) {
    loadVerificationKey();
  }

  if (!verificationKey) {
    // Verification disabled - accept all proofs (dev mode)
    console.log('[ZK] Verification disabled - accepting proof without cryptographic check');
    return true;
  }

  try {
    // Use snarkjs groth16 full verify
    // The actual API is snarkjs.groth16.fullVerify(...)
    const vKey = verificationKey;
    
    // For groth16, we need to format the proof properly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedProof: any = {
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      protocol: (proof.protocol as string) || 'groth16',
      curve: (proof.curve as string) || 'bn128',
    };

    // Use the snarkjs groth16 verifier
    const result = await snarkjs.groth16.verify(
      vKey,
      publicSignals,
      formattedProof
    );

    return result;
  } catch (error) {
    console.error('[ZK] Proof verification error:', error);
    return false;
  }
}

/**
 * Get verification key for testing purposes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getVerificationKey(): any {
  if (!verificationKeyLoaded) {
    loadVerificationKey();
  }
  return verificationKey;
}

/**
 * Reset verification key (for testing)
 */
export function resetVerificationKey(): void {
  verificationKey = null;
  verificationKeyLoaded = false;
}

/**
 * Compute a SHA-256 hash of a proof for replay protection
 * @param proof - The proof object to hash
 * @returns Hex string of the proof hash
 */
export function computeProofHash(proof: Record<string, unknown>): string {
  // Create deterministic string representation by sorting keys
  const proofStr = JSON.stringify(proof, Object.keys(proof).sort());
  // Use SHA-256 hash
  return crypto.createHash('sha256').update(proofStr).digest('hex');
}
