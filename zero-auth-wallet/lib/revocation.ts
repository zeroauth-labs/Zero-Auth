import { Credential } from '@/store/auth-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache duration: 1 hour
const REVOCATION_CACHE_DURATION = 60 * 60 * 1000;

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

interface CachedRevocationStatus {
  status: RevocationStatus;
  cachedAt: number;
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
  
  // Check cache first
  const cached = await getCachedRevocationStatus(credential.id);
  if (cached) {
    console.log(`[Revocation] Using cached status for ${credential.id}: ${cached.status}`);
    return {
      isRevoked: cached.status === 'revoked',
      status: cached.status,
      checkedAt: cached.cachedAt,
      message: 'Using cached revocation status'
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
    
    const result = { 
      isRevoked: false, 
      status: 'valid' as RevocationStatus,
      checkedAt: Date.now()
    };
    
    // Cache the result
    await cacheRevocationStatus(credential.id, result.status);
    
    return result;
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
 * @returns Cached revocation status or null if expired/not found
 */
export async function getCachedRevocationStatus(credentialId: string): Promise<CachedRevocationStatus | null> {
  try {
    const cached = await AsyncStorage.getItem(`revocation_${credentialId}`);
    if (!cached) return null;
    
    const parsed: CachedRevocationStatus = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - parsed.cachedAt > REVOCATION_CACHE_DURATION) {
      // Cache expired - remove it
      await AsyncStorage.removeItem(`revocation_${credentialId}`);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.warn('[Revocation] Failed to get cached status:', error);
    return null;
  }
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
  try {
    const cacheData: CachedRevocationStatus = {
      status,
      cachedAt: Date.now()
    };
    await AsyncStorage.setItem(
      `revocation_${credentialId}`,
      JSON.stringify(cacheData)
    );
    console.log(`[Revocation] Cached status for ${credentialId}: ${status}`);
  } catch (error) {
    console.warn('[Revocation] Failed to cache status:', error);
  }
}
