import { Credential } from '@/store/auth-store';
import { VerificationRequest } from './qr-protocol';
import { Asset } from 'expo-asset';
import { commitAttribute } from './hashing';
import * as FileSystem from 'expo-file-system/legacy';
import { ZKProofPayload } from './zk-bridge-types';

// Simple in-memory cache for circuit assets with max size limit
const MAX_CACHE_SIZE = 5; // Maximum number of circuits to cache
const assetCache: Record<string, { wasmB64: string, zkeyB64: string, lastUsed: number }> = {};

/**
 * Validates that a credential is not expired before generating proof
 * @throws Error if credential is expired
 */
function validateCredentialExpiry(credential: Credential): void {
    if (credential.expiresAt) {
        const now = Date.now();
        if (credential.expiresAt < now) {
            throw new Error(`Credential has expired. Please obtain a new credential. Expired at: ${new Date(credential.expiresAt).toISOString()}`);
        }
        
        // Warn if expiring soon (within 7 days)
        const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
        if (credential.expiresAt < sevenDaysFromNow) {
            console.warn(`[Proof] Credential expiring soon: ${new Date(credential.expiresAt).toISOString()}`);
        }
    }
}

/**
 * Evicts oldest cache entries when cache is full
 */
function evictOldestCacheEntry(): void {
    const entries = Object.entries(assetCache);
    if (entries.length >= MAX_CACHE_SIZE) {
        // Find and remove oldest entry
        let oldestKey = entries[0][0];
        let oldestTime = entries[0][1].lastUsed;
        
        for (const [key, value] of entries) {
            if (value.lastUsed < oldestTime) {
                oldestTime = value.lastUsed;
                oldestKey = key;
            }
        }
        
        delete assetCache[oldestKey];
        console.log(`[Cache] Evicted oldest entry: ${oldestKey}`);
    }
}

/**
 * Generates a Zero-Knowledge Proof for specified circuits via the ZK Bridge.
 */
export async function generateProof(
    engine: any,
    request: VerificationRequest,
    credential: Credential,
    salt: string
): Promise<ZKProofPayload> {

    // Validate credential expiry before generating proof
    validateCredentialExpiry(credential);

    console.log(`Preparing ZK Bridge Proof Generation for: ${request.credential_type}`);
    const cacheKey = request.credential_type;

    if (assetCache[cacheKey]) {
        console.log(`[Cache] Using pre-loaded assets for: ${cacheKey}`);
        const { wasmB64, zkeyB64 } = assetCache[cacheKey];
        assetCache[cacheKey].lastUsed = Date.now(); // Update last used time
        const inputs = await prepareInputs(request, credential, salt, engine);
        return performProof(engine, inputs, wasmB64, zkeyB64);
    }

    const t0 = Date.now();
    let inputs: any = await prepareInputs(request, credential, salt, engine);
    let wasmAsset: Asset;
    let zkeyAsset: Asset;

    if (request.credential_type === 'Age Verification') {
        wasmAsset = Asset.fromModule(require('../circuits/age_check_js/age_check.wasm'));
        zkeyAsset = Asset.fromModule(require('../circuits/age_check_final.zkey'));
    } else if (request.credential_type === 'Student ID') {
        wasmAsset = Asset.fromModule(require('../circuits/student_check_js/student_check.wasm'));
        zkeyAsset = Asset.fromModule(require('../circuits/student_check_final.zkey'));
    } else if (request.credential_type === 'Trial') {
        // Trial credentials - simple verification without ZK circuit
        // Just return a simple proof that the credential exists and is not expired
        // Note: We don't need to validate expiry here since it's done at the start of generateProof
        return {
            credential_type: 'Trial',
            credential_id: credential.id,
            issuedAt: credential.issuedAt,
            expiresAt: credential.expiresAt,
            attributes: credential.attributes,
            // Empty proof fields for Trial (not used)
            pi_a: [],
            pi_b: [],
            pi_c: [],
            protocol: 'trial',
            curve: 'none',
            publicSignals: []
        } as ZKProofPayload;
    } else {
        throw new Error(`Unsupported credential type: ${request.credential_type}`);
    }

    await Promise.all([wasmAsset.downloadAsync(), zkeyAsset.downloadAsync()]);

    if (!wasmAsset.localUri || !zkeyAsset.localUri) {
        throw new Error(`[ZK] CRITICAL: Failed to load circuit assets. WASM: ${!!wasmAsset.localUri}, ZKEY: ${!!zkeyAsset.localUri}. Please check that circuit files are bundled correctly.`);
    }

    try {
        const wasmB64 = await FileSystem.readAsStringAsync(wasmAsset.localUri, { encoding: 'base64' });
        const zkeyB64 = await FileSystem.readAsStringAsync(zkeyAsset.localUri, { encoding: 'base64' });
    } catch (error: any) {
        throw new Error(`[ZK] CRITICAL: Failed to read circuit files from disk: ${error.message}. Asset URIs: WASM=${wasmAsset.localUri}, ZKEY=${zkeyAsset.localUri}`);
    }

    const wasmB64 = await FileSystem.readAsStringAsync(wasmAsset.localUri, { encoding: 'base64' });
    const zkeyB64 = await FileSystem.readAsStringAsync(zkeyAsset.localUri, { encoding: 'base64' });

    // Evict oldest entry if cache is full
    evictOldestCacheEntry();
    
    // Cache the assets with timestamp
    assetCache[cacheKey] = { wasmB64, zkeyB64, lastUsed: Date.now() };
    console.log(`[Cache] Assets loaded and cached for ${cacheKey} in ${Date.now() - t0}ms`);

    return performProof(engine, inputs, wasmB64, zkeyB64);
}

async function prepareInputs(request: VerificationRequest, credential: Credential, salt: string, engine: any) {
    const currentYear = new Date().getFullYear();
    if (request.credential_type === 'Age Verification') {
        const birthYearAttribute = credential.attributes['birth_year'] || credential.attributes['year_of_birth'];
        let birthYear = Number(birthYearAttribute);

        if (isNaN(birthYear)) {
            console.warn(`[Proof] Invalid birthYear attribute: ${birthYearAttribute}, defaulting to 2000`);
            birthYear = 2000;
        }

        if (birthYear > currentYear) {
            console.error(`[Proof] Future birth year detected: ${birthYear} (Current: ${currentYear})`);
            throw new Error(`Invalid Birth Year: ${birthYear} is in the future.`);
        }

        console.log(`[Proof] Inputs - Current: ${currentYear}, Birth: ${birthYear}, Salt: ${salt.substring(0, 10)}...`);
        const commitment = await commitAttribute(engine, birthYear, salt);

        return {
            currentYear: currentYear,
            minAge: 18,
            birthYear: birthYear,
            salt: salt,
            commitment: commitment
        };
    } else if (request.credential_type === 'Student ID') {
        const isStudent = 1;
        const expiryYearAttribute = credential.attributes['expiry_year'] || credential.attributes['expires_at_year'];
        const expiryYear = Number(expiryYearAttribute || currentYear + 1);
        const commitment = await commitAttribute(engine, [isStudent, expiryYear], salt);
        return {
            currentYear: currentYear,
            isStudent: isStudent,
            expiryYear: expiryYear,
            salt: salt,
            commitment: commitment
        };
    }
    throw new Error(`Inputs not defined for: ${request.credential_type}`);
}

async function performProof(engine: any, inputs: any, wasmB64: string, zkeyB64: string): Promise<ZKProofPayload> {
    console.log("Sending proof request to ZK WebView bridge...");

    // Usage matches BridgeRequest['type'] = 'GENERATE_PROOF'
    console.log(`[ZKEngine] Execute Input Payload:`, JSON.stringify(inputs, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    // Proof generation timeout (90 seconds)
    const PROOF_GENERATION_TIMEOUT = 90000;

    try {
        const { proof, publicSignals } = await Promise.race([
            engine.execute('GENERATE_PROOF', {
                inputs,
                wasmB64,
                zkeyB64
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('[ZK] Proof generation timed out after 90 seconds. Please try again.')), PROOF_GENERATION_TIMEOUT)
            )
        ]);

        if (!proof) {
            throw new Error('[ZK] CRITICAL: Proof generation returned null/undefined. Check ZK circuit and inputs.');
        }

        // Validate proof structure before returning
        if (!proof.pi_a || !proof.pi_b || !proof.pi_c) {
            throw new Error(`[ZK] CRITICAL: Proof missing required fields. pi_a: ${!!proof.pi_a}, pi_b: ${!!proof.pi_b}, pi_c: ${!!proof.pi_c}`);
        }

        console.log("Proof Received from Bridge Successfully!");
        console.log(`[ZK] Proof stats - pi_a: ${proof.pi_a.length}, pi_b: ${proof.pi_b.length}, pi_c: ${proof.pi_c.length}`);

        return {
            pi_a: proof.pi_a,
            pi_b: proof.pi_b,
            pi_c: proof.pi_c,
            protocol: proof.protocol,
            curve: proof.curve,
            publicSignals: publicSignals
        };
    } catch (error: any) {
        console.error('[ZK] Proof generation failed:', error.message);
        console.error('[ZK] Error details:', error.stack);
        throw new Error(`[ZK] Proof generation failed: ${error.message}. Check that your credential has valid attributes for this credential type.`);
    }
}
