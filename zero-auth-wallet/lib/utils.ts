import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getRandomValues, digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Generates a cryptographically secure random ID
 * @returns A random string suitable for session/credential IDs
 */
export function generateSecureId(): string {
    const bytes = new Uint8Array(16);
    getRandomValues(bytes);
    // Convert to hex string
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex;
}

/**
 * Generates a cryptographically secure salt for credential hashing
 * @returns A random 32-byte hex string
 */
export function generateSecureSalt(): string {
    const bytes = new Uint8Array(32);
    getRandomValues(bytes);
    return '0x' + Buffer.from(bytes).toString('hex');
}

/**
 * Hash a PIN with a unique salt using SHA-256
 * @returns A string in format "salt:hash"
 */
export async function hashPin(pin: string): Promise<string> {
    // Generate unique salt
    const saltBytes = new Uint8Array(16);
    getRandomValues(saltBytes);
    const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Hash PIN + salt
    const hash = await digestStringAsync(
        CryptoDigestAlgorithm.SHA256,
        pin + salt
    );
    
    return salt + ':' + hash;
}

/**
 * Verify a PIN against a stored hash
 * Uses timing-safe comparison to prevent timing attacks
 */
export async function verifyPin(pin: string, storedValue: string): Promise<boolean> {
    const [salt, storedHash] = storedValue.split(':');
    if (!salt || !storedHash) return false;
    
    // Hash input with same salt
    const inputHash = await digestStringAsync(
        CryptoDigestAlgorithm.SHA256,
        pin + salt
    );
    
    // Timing-safe comparison
    if (inputHash.length !== storedHash.length) return false;
    let result = 0;
    for (let i = 0; i < inputHash.length; i++) {
        result |= inputHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return result === 0;
}
