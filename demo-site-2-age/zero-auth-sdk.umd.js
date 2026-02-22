(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ZeroAuth = {}));
})(this, (function (exports) { 'use strict';

    /**
     * ZeroAuth SDK Types
     */
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
    class ZeroAuth {
        constructor(config) {
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
        async verify(request) {
            const req = {
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
                    throw new Error(`Failed to create session: ${response.statusText}`);
                }
                const { session_id, qr_payload } = await response.json();
                // Notify any registered callback about the QR payload
                if (this._onQRReady) {
                    this._onQRReady(qr_payload, session_id);
                }
                // Poll relay until verification completes or times out
                const result = await this.pollForCompletion(session_id, req.timeout);
                return result;
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }
        /**
         * Register a callback that fires when the QR payload is ready.
         * Use this to render your own QR code UI.
         */
        onQRReady(callback) {
            this._onQRReady = callback;
        }
        /**
         * Poll the relay for session completion.
         */
        pollForCompletion(sessionId, timeout) {
            return new Promise((resolve) => {
                let resolved = false;
                const finish = (result) => {
                    if (resolved)
                        return;
                    resolved = true;
                    clearInterval(pollInterval);
                    clearTimeout(timeoutId);
                    resolve(result);
                };
                const checkStatus = async () => {
                    try {
                        const response = await fetch(`${this.config.relayUrl}/api/v1/sessions/${sessionId}`);
                        if (response.ok) {
                            const session = await response.json();
                            if (session.status === 'COMPLETED') {
                                finish({
                                    success: true,
                                    sessionId,
                                    claims: session.proof?.attributes || {}
                                });
                            }
                        }
                    }
                    catch {
                        // Ignore transient network errors, keep polling
                    }
                };
                // Poll every 2 seconds
                const pollInterval = setInterval(checkStatus, 2000);
                // Timeout after configured duration
                const timeoutId = setTimeout(() => {
                    finish({
                        success: false,
                        sessionId,
                        error: 'Verification timed out'
                    });
                }, (timeout || 60) * 1000);
                // Initial check immediately
                checkStatus();
            });
        }
    }

    exports.ZeroAuth = ZeroAuth;
    exports.default = ZeroAuth;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
