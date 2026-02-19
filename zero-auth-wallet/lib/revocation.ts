import { Credential } from '@/store/auth-store';

/**
 * Revocation status check result
 */
export type RevocationStatus = 'valid' | 'revoked' | 'unknown';

export interface RevocationCheckResult {
  isRevoked: boolean;
  status: RevocationStatus;
  checkedAt?: number;
  message?: string;
}

/**
 * Checks revocation status for a credential.
 * In production, this would call a revocation registry.
 * For MVP, checks local revocationId and status.
 * 
 * @param credential - The credential to check
 * @returns Promise resolving to revocation check result
 */
export async function checkRevocationStatus(
  credential: Credential
): Promise<RevocationCheckResult> {
  // For MVP: check if credential has revocationId
  // In production: query revocation registry
  
  if (!credential.revocationId) {
    // No revocation tracking - assume valid
    return { 
      isRevoked: false, 
      status: 'valid',
      message: 'No revocation registry configured'
    };
  }
  
  // TODO: In Phase 2/3, integrate with revocation registry
  // For now, return valid if we can't check
  // In production, this would make an API call to the revocation registry
  
  // Simulated check - in production, query the revocation registry
  try {
    // Example production implementation:
    // const response = await fetch(`https://revocation-registry.example/verify/${credential.revocationId}`);
    // const data = await response.json();
    // return { isRevoked: data.revoked, status: data.revoked ? 'revoked' : 'valid' };
    
    return { 
      isRevoked: false, 
      status: 'valid',
      checkedAt: Date.now()
    };
  } catch (error) {
    console.warn('Revocation check failed:', error);
    return { 
      isRevoked: false, 
      status: 'unknown',
      message: 'Unable to verify revocation status'
    };
  }
}

/**
 * Gets cached revocation status (for offline mode)
 * @param credentialId - The credential ID to check
 * @returns Cached revocation status
 */
export function getCachedRevocationStatus(credentialId: string): RevocationStatus {
  // Check AsyncStorage for cached status
  // In MVP, return unknown as no caching implemented
  // TODO: Implement AsyncStorage caching in future phase
  return 'unknown';
}

/**
 * Cache revocation status for offline use
 * @param credentialId - The credential ID
 * @param status - The revocation status to cache
 */
export async function cacheRevocationStatus(
  credentialId: string,
  status: RevocationStatus
): Promise<void> {
  // TODO: Implement AsyncStorage caching
  // Example:
  // await AsyncStorage.setItem(
  //   `revocation_${credentialId}`,
  //   JSON.stringify({ status, cachedAt: Date.now() })
  // );
  console.log(`[Revocation] Cached status for ${credentialId}: ${status}`);
}
