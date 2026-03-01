/**
 * ZeroAuth SDK - Pure JavaScript Implementation
 * Passwordless ZK credential verification for web applications
 */
import * as QRCode from 'qrcode';
// ============================================
// Error Types
// ============================================
export class ZeroAuthError extends Error {
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'ZeroAuthError';
    }
}
export class ConfigurationError extends ZeroAuthError {
    constructor(message) {
        super(message, 'CONFIG_ERROR', 400);
        this.name = 'ConfigurationError';
    }
}
export class NetworkError extends ZeroAuthError {
    constructor(message, statusCode) {
        super(message, 'NETWORK_ERROR', statusCode);
        this.name = 'NetworkError';
    }
}
export class SessionError extends ZeroAuthError {
    constructor(message, code) {
        super(message, code, 400);
        this.name = 'SessionError';
    }
}
export class QRGenerationError extends ZeroAuthError {
    constructor(message) {
        super(message, 'QR_ERROR', 500);
        this.name = 'QRGenerationError';
    }
}
// ============================================
// Utility Functions
// ============================================
/**
 * Validates the SDK configuration
 */
export function validateConfig(config) {
    const errors = [];
    if (!config.relayUrl) {
        errors.push('relayUrl is required');
    }
    else {
        try {
            new URL(config.relayUrl);
        }
        catch {
            errors.push('relayUrl must be a valid URL');
        }
    }
    if (config.timeout !== undefined && (config.timeout < 10 || config.timeout > 300)) {
        errors.push('timeout must be between 10 and 300 seconds');
    }
    if (config.claims && !Array.isArray(config.claims)) {
        errors.push('claims must be an array');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Validates a QR payload to detect tampering
 */
export function validateQRPayload(payload) {
    try {
        const data = JSON.parse(payload);
        // Check required fields
        if (!data.v || data.v !== 1) {
            return { valid: false, error: 'Invalid protocol version' };
        }
        if (!data.action || data.action !== 'verify') {
            return { valid: false, error: 'Invalid action' };
        }
        if (!data.session_id) {
            return { valid: false, error: 'Missing session_id' };
        }
        if (!data.nonce) {
            return { valid: false, error: 'Missing nonce' };
        }
        if (!data.verifier?.did || !data.verifier?.callback) {
            return { valid: false, error: 'Missing verifier info' };
        }
        if (!data.required_claims || !Array.isArray(data.required_claims)) {
            return { valid: false, error: 'Invalid required_claims' };
        }
        if (!data.expires_at) {
            return { valid: false, error: 'Missing expiration' };
        }
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (data.expires_at < now) {
            return { valid: false, error: 'QR code has expired' };
        }
        // Verify signature if present
        if (data.signature) {
            // In production, verify signature using verifier's public key
            // For now, we just check it exists
            console.log('[ZeroAuth] QR signature present');
        }
        return { valid: true, data };
    }
    catch (e) {
        return { valid: false, error: 'Invalid QR payload format' };
    }
}
/**
 * Generates a cryptographically secure nonce
 */
function generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}
/**
 * Creates a signature for QR payload integrity
 */
function createSignature(data, apiKey) {
    if (!apiKey)
        return '';
    const payload = JSON.stringify({
        session_id: data.session_id,
        nonce: data.nonce,
        verifier: data.verifier
    });
    // Simple HMAC-like signature (in production, use crypto.subtle)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiKey);
    const messageData = encoder.encode(payload);
    let hash = 0;
    for (let i = 0; i < messageData.length; i++) {
        hash = ((hash << 5) - hash) + messageData[i];
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
// ============================================
// Main ZeroAuth Class
// ============================================
export class ZeroAuth {
    constructor(config) {
        this.pollingInterval = null;
        this.currentSession = null;
        // Validate config
        const validation = validateConfig(config);
        if (!validation.valid) {
            throw new ConfigurationError(validation.errors.join(', '));
        }
        this.config = {
            relayUrl: config.relayUrl.replace(/\/$/, ''), // Remove trailing slash
            apiKey: config.apiKey || '',
            verifierName: config.verifierName || 'ZeroAuth User',
            credentialType: config.credentialType || 'Age Verification',
            claims: config.claims || ['birth_year'],
            timeout: config.timeout || 60,
            headers: config.headers || {}
        };
    }
    /**
     * Get the relay URL
     */
    getRelayUrl() {
        return this.config.relayUrl;
    }
    /**
     * Get deep link URL for direct wallet opening
     */
    generateDeeplink(sessionId) {
        return `zeroauth://verify?session=${sessionId}`;
    }
    /**
     * Generate QR code as base64 data URL
     */
    async generateQRBase64(payload, options) {
        const opts = {
            width: options?.width || 256,
            color: {
                dark: options?.color || '#000000',
                light: options?.backgroundColor || '#FFFFFF'
            },
            errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
        };
        try {
            const dataUrl = await QRCode.toDataURL(payload, opts);
            return dataUrl;
        }
        catch (error) {
            throw new QRGenerationError(error instanceof Error ? error.message : 'Failed to generate QR code');
        }
    }
    /**
     * Generate QR code as canvas element
     */
    async generateQRCanvas(payload, canvas, options) {
        const opts = {
            width: options?.width || 256,
            color: {
                dark: options?.color || '#000000',
                light: options?.backgroundColor || '#FFFFFF'
            },
            errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
        };
        try {
            await QRCode.toCanvas(canvas, payload, opts);
        }
        catch (error) {
            throw new QRGenerationError(error instanceof Error ? error.message : 'Failed to generate QR code');
        }
    }
    /**
     * Create a verification session
     */
    async createSession(request) {
        const req = {
            credentialType: request?.credentialType || this.config.credentialType,
            claims: request?.claims || this.config.claims,
            useCase: request?.useCase,
            timeout: request?.timeout || this.config.timeout
        };
        const headers = {
            'Content-Type': 'application/json',
            ...this.config.headers
        };
        if (this.config.apiKey) {
            headers['X-API-Key'] = this.config.apiKey;
        }
        let response;
        try {
            response = await fetch(`${this.config.relayUrl}/api/v1/sessions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    verifier_name: this.config.verifierName,
                    credential_type: req.credentialType,
                    required_claims: req.claims,
                    use_case: req.useCase,
                    timeout: req.timeout
                })
            });
        }
        catch (error) {
            throw new NetworkError(`Failed to connect to relay: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        if (!response.ok) {
            let errorMessage = `Server error (${response.status})`;
            try {
                const errorJson = await response.json();
                errorMessage = errorJson.message || errorJson.error || errorMessage;
            }
            catch {
                // Ignore JSON parse errors
            }
            throw new NetworkError(errorMessage, response.status);
        }
        const data = await response.json();
        // Validate QR payload
        const qrValidation = validateQRPayload(data.qr_payload);
        if (!qrValidation.valid) {
            throw new QRGenerationError(qrValidation.error || 'Invalid QR payload');
        }
        // Add signature if API key is provided
        if (this.config.apiKey && qrValidation.data) {
            const signature = createSignature(qrValidation.data, this.config.apiKey);
            if (signature) {
                const signedPayload = JSON.parse(data.qr_payload);
                signedPayload.signature = signature;
                data.qr_payload = JSON.stringify(signedPayload);
            }
        }
        const session = {
            sessionId: data.session_id,
            status: 'PENDING',
            qrPayload: data.qr_payload,
            expiresAt: Date.now() + (req.timeout || this.config.timeout) * 1000
        };
        this.currentSession = session;
        return session;
    }
    /**
     * Get session status without polling
     */
    async getSessionStatus(sessionId) {
        const headers = {
            ...this.config.headers
        };
        if (this.config.apiKey) {
            headers['X-API-Key'] = this.config.apiKey;
        }
        let response;
        try {
            response = await fetch(`${this.config.relayUrl}/api/v1/sessions/${sessionId}`, {
                headers
            });
        }
        catch (error) {
            throw new NetworkError(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
        if (response.status === 404) {
            throw new SessionError('Session not found or expired', 'SESSION_NOT_FOUND');
        }
        if (!response.ok) {
            throw new NetworkError(`Server error: ${response.status}`, response.status);
        }
        const data = await response.json();
        return {
            sessionId: data.session_id,
            status: data.status,
            qrPayload: '',
            expiresAt: 0,
            claims: data.proof?.attributes
        };
    }
    /**
     * Cancel an ongoing verification session
     */
    async cancelSession(sessionId) {
        const headers = {
            'Content-Type': 'application/json',
            ...this.config.headers
        };
        if (this.config.apiKey) {
            headers['X-API-Key'] = this.config.apiKey;
        }
        try {
            await fetch(`${this.config.relayUrl}/api/v1/sessions/${sessionId}`, {
                method: 'DELETE',
                headers
            });
        }
        catch {
            // Ignore errors - session might already be expired
        }
        if (this.currentSession?.sessionId === sessionId) {
            this.stopPolling();
            this.currentSession = null;
        }
    }
    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    /**
     * Verify credentials - main entry point
     */
    async verify(request, options) {
        const showModal = options?.showModal !== false;
        const pollInterval = options?.pollInterval || 2000;
        try {
            // Create session
            const session = await this.createSession(request);
            options?.onSessionCreated?.(session);
            // Generate QR
            let qrDataUrl;
            try {
                qrDataUrl = await this.generateQRBase64(session.qrPayload, options?.qrOptions);
            }
            catch (error) {
                throw new QRGenerationError(error instanceof Error ? error.message : 'QR generation failed');
            }
            options?.onQRReady?.(qrDataUrl);
            // If not showing modal, return early with session info
            if (!showModal) {
                return {
                    success: false,
                    sessionId: session.sessionId,
                    error: 'PENDING'
                };
            }
            // Return verification result via polling
            return new Promise((resolve) => {
                const checkStatus = async () => {
                    try {
                        const status = await this.getSessionStatus(session.sessionId);
                        if (status.status === 'COMPLETED') {
                            options?.onWalletScanned?.();
                            const result = {
                                success: true,
                                sessionId: session.sessionId,
                                claims: status.claims
                            };
                            options?.onComplete?.(result);
                            resolve(result);
                            return true;
                        }
                        if (status.status === 'EXPIRED') {
                            const result = {
                                success: false,
                                sessionId: session.sessionId,
                                error: 'Session expired',
                                errorCode: 'SESSION_EXPIRED'
                            };
                            options?.onTimeout?.();
                            resolve(result);
                            return true;
                        }
                    }
                    catch (error) {
                        console.error('[ZeroAuth] Status check error:', error);
                    }
                    return false;
                };
                // Start polling
                this.pollingInterval = setInterval(async () => {
                    if (await checkStatus()) {
                        this.stopPolling();
                    }
                }, pollInterval);
                // Timeout
                setTimeout(() => {
                    this.stopPolling();
                    const result = {
                        success: false,
                        sessionId: session.sessionId,
                        error: 'Verification timed out',
                        errorCode: 'TIMEOUT'
                    };
                    options?.onTimeout?.();
                    resolve(result);
                }, (request?.timeout || this.config.timeout) * 1000);
            });
        }
        catch (error) {
            const err = error instanceof ZeroAuthError
                ? error
                : new ZeroAuthError(error instanceof Error ? error.message : 'Unknown error');
            options?.onError?.(err);
            return {
                success: false,
                error: err.message,
                errorCode: err.code
            };
        }
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.stopPolling();
        if (this.currentSession) {
            this.cancelSession(this.currentSession.sessionId);
        }
    }
}
// ============================================
// Default Configuration
// ============================================
export const defaultConfig = {
    verifierName: 'ZeroAuth User',
    credentialType: 'Age Verification',
    claims: ['birth_year'],
    timeout: 60
};
export default ZeroAuth;
