/**
 * ZeroAuth SDK Types
 */

export interface ZeroAuthConfig {
  /** URL of the relay server */
  relayUrl: string;
  /** Default verifier name shown to users */
  verifierName?: string;
  /** Default credential type to request */
  credentialType?: string;
  /** Default claims to request */
  claims?: string[];
  /** Request timeout in seconds */
  timeout?: number;
}

export interface VerificationRequest {
  credentialType: string;
  claims: string[];
  timeout?: number;
}

export interface VerificationResult {
  success: boolean;
  sessionId?: string;
  claims?: Record<string, unknown>;
  error?: string;
}

export interface ZeroAuthOptions {
  /** Text shown on the button */
  buttonText?: string;
  /** Button CSS class */
  buttonClass?: string;
  /** Callback when verification completes */
  onSuccess?: (result: VerificationResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * ZeroAuth SDK
 * 
 * Simple JS SDK for verifying credentials without passwords.
 * 
 * @example
 * ```js
 * const zeroAuth = new ZeroAuth({
 *   relayUrl: 'https://your-relay.com'
 * });
 * 
 * // Use with custom button
 * button.onclick = async () => {
 *   const result = await zeroAuth.verify({
 *     credentialType: 'Age Verification',
 *     claims: ['birth_year']
 *   });
 *   console.log(result);
 * };
 * ```
 */
export class ZeroAuth {
  private config: ZeroAuthConfig;
  
  constructor(config: ZeroAuthConfig) {
    if (!config.relayUrl) {
      throw new Error('relayUrl is required');
    }
    this.config = {
      verifierName: 'ZeroAuth User',
      credentialType: 'Age Verification',
      claims: ['birth_year'],
      timeout: 60,
      ...config
    };
  }

  /**
   * Verify credentials
   * @param request - Verification request options
   * @returns Promise with verification result
   */
  async verify(request?: Partial<VerificationRequest>): Promise<VerificationResult> {
    const req: VerificationRequest = {
      credentialType: request?.credentialType || this.config.credentialType || 'Age Verification',
      claims: request?.claims || this.config.claims || ['birth_year'],
      timeout: request?.timeout || this.config.timeout || 60
    };

    try {
      // Create session via relay
      const response = await fetch(`${this.config.relayUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifier_name: this.config.verifierName,
          credential_type: req.credentialType,
          required_claims: req.claims,
          timeout: req.timeout
        })
      });

      if (!response.ok) {
        let errorMessage = `Failed to create session: ${response.status}`;
        try {
          const errorJson = await response.json();
          errorMessage = `Server error (${response.status}): ${errorJson.message || errorJson.error || JSON.stringify(errorJson)}`;
          console.error('[ZeroAuth SDK] Session creation error:', errorJson);
        } catch {
          // Response wasn't JSON
          const errorText = await response.text();
          errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
          console.error('[ZeroAuth SDK] Session creation error:', errorText);
        }
        throw new Error(errorMessage);
      }

      const { session_id, qr_payload } = await response.json();

      // Open verification modal with QR code
      const result = await this.showVerificationModal(qr_payload, session_id, req.timeout);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Show verification modal (simple prompt-based for SDK)
   * In a real implementation, this would show a proper modal
   */
  private async showVerificationModal(qrPayload: unknown, sessionId: string, timeout?: number): Promise<VerificationResult> {
    // For SDK, we return the session info so the website can display QR however they want
    // The website is responsible for showing the QR and handling the flow
    
    // For now, return info needed to build custom UI
    return new Promise((resolve) => {
      // Website should show QR and poll for status
      // This is a placeholder - actual implementation depends on UI approach
      
      const checkStatus = async () => {
        try {
          const response = await fetch(`${this.config.relayUrl}/api/v1/sessions/${sessionId}`);
          if (response.ok) {
            const session = await response.json();
            console.log('[ZeroAuth SDK] Session status:', session.status);
            if (session.status === 'COMPLETED') {
              resolve({
                success: true,
                sessionId,
                claims: session.proof?.attributes || {}
              });
              return true;
            } else if (session.status === 'expired') {
              console.log('[ZeroAuth SDK] Session expired');
              resolve({
                success: false,
                sessionId,
                error: 'Verification session expired. Please try again.'
              });
              return true; // Stop polling
            }
          } else if (response.status === 404) {
            console.log('[ZeroAuth SDK] Session not found (404)');
            resolve({
              success: false,
              sessionId,
              error: 'Verification session not found. It may have expired.'
            });
            return true; // Stop polling
          } else {
            console.log('[ZeroAuth SDK] Status check failed:', response.status);
          }
        } catch (error) {
          console.error('[ZeroAuth SDK] Status check error:', error);
        }
        return false;
      };

      // Poll for completion
      const pollInterval = setInterval(async () => {
        if (await checkStatus()) {
          clearInterval(pollInterval);
        }
      }, 2000);

      // Timeout
      setTimeout(() => {
        clearInterval(pollInterval);
        resolve({
          success: false,
          sessionId,
          error: 'Verification timed out'
        });
      }, (timeout || 60) * 1000);

      // Return initial state - website should handle UI
      resolve({
        success: false,
        sessionId,
        error: 'QR_CODE' // Special code indicating QR should be shown
      });
    });
  }
}

export default ZeroAuth;
