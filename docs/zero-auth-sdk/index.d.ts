/**
 * ZeroAuth SDK - Pure JavaScript Implementation
 * Passwordless ZK credential verification for web applications
 */
export type UseCaseType = 'LOGIN' | 'VERIFICATION' | 'TRIAL_LICENSE';
export interface ZeroAuthConfig {
    /** URL of the relay server (required) */
    relayUrl: string;
    /** API Key for verifier authentication */
    apiKey?: string;
    /** Default verifier name shown to users */
    verifierName?: string;
    /** Default credential type to request */
    credentialType?: string;
    /** Default claims to request */
    claims?: string[];
    /** Request timeout in seconds (default: 60) */
    timeout?: number;
    /** Custom headers for relay requests */
    headers?: Record<string, string>;
}
export interface VerificationRequest {
    credentialType: string;
    claims: string[];
    useCase?: UseCaseType;
    timeout?: number;
}
export interface VerificationResult {
    success: boolean;
    sessionId?: string;
    claims?: Record<string, unknown>;
    error?: string;
    errorCode?: string;
}
export interface SessionInfo {
    sessionId: string;
    status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
    qrPayload: string;
    expiresAt: number;
    claims?: Record<string, unknown>;
}
export interface QRCodeOptions {
    /** QR code width in pixels */
    width?: number;
    /** QR code color (dark modules) */
    color?: string;
    /** QR code background color */
    backgroundColor?: string;
    /** QR error correction level */
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}
export interface ZeroAuthOptions {
    /** Text shown on the button */
    buttonText?: string;
    /** Button CSS class */
    buttonClass?: string;
    /** Custom button component */
    buttonElement?: HTMLElement;
    /** Callback when verification completes */
    onSuccess?: (result: VerificationResult) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
    /** Callback when session is created */
    onSessionCreated?: (session: SessionInfo) => void;
    /** Callback when QR is ready */
    onQRReady?: (qrDataUrl: string) => void;
    /** Callback when wallet scans */
    onWalletScanned?: () => void;
    /** Callback when verification completes */
    onComplete?: (result: VerificationResult) => void;
    /** Callback on timeout */
    onTimeout?: () => void;
    /** Callback on cancel */
    onCancel?: () => void;
    /** Custom QR code options */
    qrOptions?: QRCodeOptions;
    /** Show modal (default: true) */
    showModal?: boolean;
    /** Polling interval in ms (default: 2000) */
    pollInterval?: number;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare class ZeroAuthError extends Error {
    code?: string | undefined;
    statusCode?: number | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number | undefined);
}
export declare class ConfigurationError extends ZeroAuthError {
    constructor(message: string);
}
export declare class NetworkError extends ZeroAuthError {
    constructor(message: string, statusCode?: number);
}
export declare class SessionError extends ZeroAuthError {
    constructor(message: string, code?: string);
}
export declare class QRGenerationError extends ZeroAuthError {
    constructor(message: string);
}
/**
 * Validates the SDK configuration
 */
export declare function validateConfig(config: ZeroAuthConfig): ValidationResult;
/**
 * Validates a QR payload to detect tampering
 */
export declare function validateQRPayload(payload: string): {
    valid: boolean;
    data?: any;
    error?: string;
};
export declare class ZeroAuth {
    private config;
    private pollingInterval;
    private currentSession;
    constructor(config: ZeroAuthConfig);
    /**
     * Get the relay URL
     */
    getRelayUrl(): string;
    /**
     * Get deep link URL for direct wallet opening
     */
    generateDeeplink(sessionId: string): string;
    /**
     * Generate QR code as base64 data URL
     */
    generateQRBase64(payload: string, options?: QRCodeOptions): Promise<string>;
    /**
     * Generate QR code as canvas element
     */
    generateQRCanvas(payload: string, canvas: HTMLCanvasElement, options?: QRCodeOptions): Promise<void>;
    /**
     * Create a verification session
     */
    createSession(request?: Partial<VerificationRequest>): Promise<SessionInfo>;
    /**
     * Get session status without polling
     */
    getSessionStatus(sessionId: string): Promise<SessionInfo>;
    /**
     * Cancel an ongoing verification session
     */
    cancelSession(sessionId: string): Promise<void>;
    /**
     * Stop polling
     */
    stopPolling(): void;
    /**
     * Verify credentials - main entry point
     */
    verify(request?: Partial<VerificationRequest>, options?: ZeroAuthOptions): Promise<VerificationResult>;
    /**
     * Clean up resources
     */
    destroy(): void;
}
export declare const defaultConfig: Partial<ZeroAuthConfig>;
export default ZeroAuth;
