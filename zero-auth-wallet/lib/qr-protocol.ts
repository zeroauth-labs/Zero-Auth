export interface VerifierInfo {
    did: string;
    name: string;
    callback: string; // URL to post proof to
}

export type UseCaseType = 'LOGIN' | 'VERIFICATION' | 'TRIAL_LICENSE';

export interface VerificationRequest {
    v: number; // Protocol version, e.g., 1
    action: 'verify';
    session_id: string;
    nonce: string; // Random challenge
    verifier: VerifierInfo;
    required_claims: string[];
    credential_type: string;
    expires_at: number; // Unix timestamp
    use_case?: UseCaseType; // Optional: LOGIN, VERIFICATION, TRIAL_LICENSE
}

/**
 * Parses and validates a QR code string.
 * Returns a VerificationRequest if valid, or null if invalid.
 */
export function parseVerificationQR(data: string): VerificationRequest | null {
    console.log("QR Data received:", data);
    try {
        const payload = JSON.parse(data);
        console.log("Parsed payload:", JSON.stringify(payload));

        // Basic structural validation
        if (
            payload.v !== 1 ||
            payload.action !== 'verify' ||
            !payload.session_id ||
            !payload.nonce ||
            !payload.verifier ||
            !payload.verifier.did ||
            !payload.verifier.callback || // Now required inside verifier
            !payload.required_claims ||
            !Array.isArray(payload.required_claims) ||
            (payload.use_case && !['LOGIN', 'VERIFICATION', 'TRIAL_LICENSE'].includes(payload.use_case))
        ) {
            console.warn("Invalid QR structure:", payload);
            return null;
        }

        // Check expiry
        const now = Math.floor(Date.now() / 1000);
        if (payload.expires_at && payload.expires_at < now) {
            console.warn("QR code expired");
            return null;
        }

        return payload as VerificationRequest;
    } catch (e) {
        console.error("Failed to parse QR JSON:", e);
        return null;
    }
}
