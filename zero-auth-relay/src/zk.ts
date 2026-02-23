// ZeroAuth Relay - ZK Proof Verification

import * as snarkjs from 'snarkjs';
import * as crypto from 'crypto';
import { getVerificationKey as dbGetVerificationKey, listCredentialTypes } from './db.js';

// Cache for verification keys: credential_type -> key
const verificationKeyCache: Map<string, Record<string, unknown>> = new Map();
let cacheInitialized = false;

/**
 * Initialize verification key cache from database
 */
export async function loadVerificationKeysFromDb(): Promise<void> {
  if (cacheInitialized) return;

  const credentialTypes = await listCredentialTypes();
  
  for (const credType of credentialTypes) {
    const key = await dbGetVerificationKey(credType);
    if (key) {
      verificationKeyCache.set(credType, key);
      console.log(`[ZK] Loaded verification key for: ${credType}`);
    }
  }

  cacheInitialized = true;
  console.log(`[ZK] Verification key cache initialized with ${verificationKeyCache.size} key(s)`);
}

/**
 * Get verification key for a specific credential type
 * @param credentialType - The credential type (e.g., 'Age Verification', 'Student ID')
 */
export async function getVerificationKey(credentialType: string): Promise<Record<string, unknown> | null> {
  // Check cache first
  if (verificationKeyCache.has(credentialType)) {
    return verificationKeyCache.get(credentialType)!;
  }

  // Try to load from database
  await loadVerificationKeysFromDb();
  
  // Check again after initialization
  if (verificationKeyCache.has(credentialType)) {
    return verificationKeyCache.get(credentialType)!;
  }

  return null;
}

/**
 * Check if verification is enabled for a given credential type
 */
export async function isVerificationEnabled(credentialType?: string): Promise<boolean> {
  if (!cacheInitialized) {
    await loadVerificationKeysFromDb();
  }

  if (!credentialType) {
    // If no specific credential type, check if any keys are loaded
    return verificationKeyCache.size > 0;
  }

  return verificationKeyCache.has(credentialType);
}

/**
 * Fallback: Load verification key from environment (for backwards compatibility)
 * If env var exists, it takes precedence over database
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let envVerificationKey: any = null;
let envKeyLoaded = false;

async function loadEnvVerificationKey(): Promise<void> {
  if (envKeyLoaded) return;

  const keySource = process.env.ZK_VERIFICATION_KEY;
  
  if (!keySource) {
    envKeyLoaded = true;
    return;
  }

  try {
    if (keySource.startsWith('file://')) {
      const filePath = keySource.replace('file://', '');
      const fs = await import('fs');
      const keyData = fs.readFileSync(filePath, 'utf-8');
      envVerificationKey = JSON.parse(keyData);
    } else {
      const decoded = Buffer.from(keySource, 'base64').toString('utf-8');
      envVerificationKey = JSON.parse(decoded);
    }
    
    console.log('[ZK] Fallback verification key loaded from environment');
  } catch (error) {
    console.error('[ZK] Failed to load fallback verification key:', error);
  }
  
  envKeyLoaded = true;
}

/**
 * Verify a ZK proof cryptographically
 * @param proof - The ZK proof object with pi_a, pi_b, pi_c
 * @param publicSignals - Public signals from the proof
 * @param credentialType - The credential type to select the right key
 * @returns Promise<boolean> - true if proof is valid
 */
export async function verifyProof(
  proof: Record<string, unknown>,
  publicSignals: string[] = [],
  credentialType?: string
): Promise<boolean> {
  // Try to get key from database first
  let verificationKey: Record<string, unknown> | null = null;
  
  if (credentialType) {
    verificationKey = await getVerificationKey(credentialType);
  }

  // Fallback to environment variable if no database key found
  if (!verificationKey) {
    await loadEnvVerificationKey();
    verificationKey = envVerificationKey;
  }

  if (!verificationKey) {
    // Verification disabled - accept all proofs (dev mode)
    console.log('[ZK] Verification disabled - accepting proof without cryptographic check');
    return true;
  }

  try {
    const vKey = verificationKey;
    
    // Format the proof for snarkjs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedProof: any = {
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      protocol: (proof.protocol as string) || 'groth16',
      curve: (proof.curve as string) || 'bn128',
    };

    // Verify the proof
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

/**
 * Get list of supported credential types
 */
export async function getSupportedCredentialTypes(): Promise<string[]> {
  if (!cacheInitialized) {
    await loadVerificationKeysFromDb();
  }
  return Array.from(verificationKeyCache.keys());
}
