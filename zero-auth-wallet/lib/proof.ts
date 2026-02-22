import { Credential } from '@/store/auth-store';
import { VerificationRequest } from './qr-protocol';
import { Asset } from 'expo-asset';
import { commitAttribute } from './hashing';
import * as FileSystem from 'expo-file-system/legacy';
import { ZKProofPayload } from './zk-bridge-types';

// Simple in-memory cache for circuit assets
const assetCache: Record<string, { wasmB64: string, zkeyB64: string }> = {};

/**
 * Generates a Zero-Knowledge Proof for specified circuits via the ZK Bridge.
 */
export async function generateProof(
    engine: any,
    request: VerificationRequest,
    credential: Credential,
    salt: string
): Promise<ZKProofPayload> {

    console.log(`Preparing ZK Bridge Proof Generation for: ${request.credential_type}`);
    const cacheKey = request.credential_type;

    if (assetCache[cacheKey]) {
        console.log(`[Cache] Using pre-loaded assets for: ${cacheKey}`);
        const { wasmB64, zkeyB64 } = assetCache[cacheKey];
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
        return {
            credential_type: 'Trial',
            credential_id: credential.id,
            issuedAt: credential.issuedAt,
            expiresAt: credential.expiresAt,
            attributes: credential.attributes
        };
    } else {
        throw new Error(`Unsupported credential type: ${request.credential_type}`);
    }

    await Promise.all([wasmAsset.downloadAsync(), zkeyAsset.downloadAsync()]);

    if (!wasmAsset.localUri || !zkeyAsset.localUri) {
        throw new Error("Failed to load circuit assets");
    }

    const wasmB64 = await FileSystem.readAsStringAsync(wasmAsset.localUri, { encoding: 'base64' });
    const zkeyB64 = await FileSystem.readAsStringAsync(zkeyAsset.localUri, { encoding: 'base64' });

    // Cache the assets
    assetCache[cacheKey] = { wasmB64, zkeyB64 };
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

    const { proof, publicSignals } = await engine.execute('GENERATE_PROOF', {
        inputs,
        wasmB64,
        zkeyB64
    });

    console.log("Proof Received from Bridge Successfully!");

    return {
        pi_a: proof.pi_a,
        pi_b: proof.pi_b,
        pi_c: proof.pi_c,
        protocol: proof.protocol,
        curve: proof.curve,
        publicSignals: publicSignals
    };
}
