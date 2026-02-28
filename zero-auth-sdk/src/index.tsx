/**
 * ZeroAuth SDK - React Implementation
 * React components and hooks for ZK credential verification
 */

import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// Re-export all types and classes from main SDK
export * from './index';

// ============================================
// Context
// ============================================

interface ZeroAuthContextValue {
  config: ZeroAuthConfig | null;
  isVerifying: boolean;
  error: Error | null;
  startVerification: (request?: Partial<VerificationRequest>) => Promise<VerificationResult>;
}

const ZeroAuthContext = createContext<ZeroAuthContextValue | null>(null);

export function useZeroAuth() {
  const context = useContext(ZeroAuthContext);
  if (!context) {
    throw new Error('useZeroAuth must be used within ZeroAuthProvider');
  }
  return context;
}

// ============================================
// Types (extended for React)
// ============================================

export interface ZeroAuthConfig {
  relayUrl: string;
  apiKey?: string;
  verifierName?: string;
  credentialType?: string;
  claims?: string[];
  timeout?: number;
  headers?: Record<string, string>;
}

export interface VerificationRequest {
  credentialType: string;
  claims: string[];
  useCase?: 'LOGIN' | 'VERIFICATION' | 'TRIAL_LICENSE';
  timeout?: number;
}

export interface VerificationResult {
  success: boolean;
  sessionId?: string;
  claims?: Record<string, unknown>;
  error?: string;
  errorCode?: string;
}

export interface ZeroAuthButtonProps {
  /** Verification request options */
  request?: Partial<VerificationRequest>;
  /** Button text */
  text?: string;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Custom button content */
  children?: React.ReactNode;
  /** Called on successful verification */
  onSuccess?: (result: VerificationResult) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Show modal (default true) */
  showModal?: boolean;
}

export interface ZeroAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  sessionId: string;
  verifierName?: string;
  credentialType?: string;
  claims?: string[];
  onCancel?: () => void;
  onComplete?: (result: VerificationResult) => void;
  pollInterval?: number;
  timeout?: number;
}

export interface ZeroAuthProviderProps {
  config: ZeroAuthConfig;
  children: React.ReactNode;
}

export interface useZeroAuthReturn extends ZeroAuthContextValue {
  sessionId: string | null;
  qrDataUrl: string | null;
  status: 'idle' | 'pending' | 'scanning' | 'completed' | 'error' | 'expired';
}

// ============================================
// Provider Component
// ============================================

export function ZeroAuthProvider({ config, children }: ZeroAuthProviderProps) {
  const zeroAuthRef = useRef<ZeroAuth | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    zeroAuthRef.current = new ZeroAuth(config);
    return () => {
      zeroAuthRef.current?.destroy();
    };
  }, [config.relayUrl, config.apiKey]);

  const startVerification = useCallback(async (request?: Partial<VerificationRequest>): Promise<VerificationResult> => {
    if (!zeroAuthRef.current) {
      const err = new Error('ZeroAuth not initialized');
      setError(err);
      throw err;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await zeroAuthRef.current.verify(request, { showModal: false });
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Unknown error');
      setError(err);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return (
    <ZeroAuthContext.Provider value={{ config, isVerifying, error, startVerification }}>
      {children}
    </ZeroAuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useZeroAuthVerification() {
  const { config, isVerifying, error, startVerification } = useZeroAuth();
  const zeroAuthRef = useRef<ZeroAuth | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'scanning' | 'completed' | 'error' | 'expired'>('idle');

  useEffect(() => {
    if (config) {
      zeroAuthRef.current = new ZeroAuth(config);
    }
    return () => {
      zeroAuthRef.current?.destroy();
    };
  }, [config?.relayUrl, config?.apiKey]);

  const verify = useCallback(async (request?: Partial<VerificationRequest>) => {
    if (!zeroAuthRef.current) {
      throw new Error('ZeroAuth not initialized');
    }

    setStatus('pending');
    setSessionId(null);
    setQrDataUrl(null);

    try {
      const session = await zeroAuthRef.current.createSession(request);
      setSessionId(session.sessionId);

      const qr = await zeroAuthRef.current.generateQRBase64(session.qrPayload);
      setQrDataUrl(qr);
      setStatus('scanning');

      // Poll for completion
      return new Promise<VerificationResult>((resolve) => {
        const checkStatus = async (): Promise<boolean> => {
          try {
            const statusResult = await zeroAuthRef.current!.getSessionStatus(session.sessionId);
            
            if (statusResult.status === 'COMPLETED') {
              setStatus('completed');
              resolve({
                success: true,
                sessionId: session.sessionId,
                claims: statusResult.claims
              });
              return true;
            }
            
            if (statusResult.status === 'EXPIRED') {
              setStatus('expired');
              resolve({
                success: false,
                sessionId: session.sessionId,
                error: 'Session expired',
                errorCode: 'SESSION_EXPIRED'
              });
              return true;
            }
          } catch (e) {
            console.error('[ZeroAuth] Status check:', e);
          }
          return false;
        };

        const interval = setInterval(async () => {
          if (await checkStatus()) {
            clearInterval(interval);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(interval);
          if (status === 'scanning') {
            setStatus('expired');
            resolve({
              success: false,
              sessionId: session.sessionId,
              error: 'Verification timed out',
              errorCode: 'TIMEOUT'
            });
          }
        }, (request?.timeout || config.timeout || 60) * 1000);
      });
    } catch (e) {
      setStatus('error');
      throw e;
    }
  }, [config.timeout]);

  const cancel = useCallback(async () => {
    if (zeroAuthRef.current && sessionId) {
      await zeroAuthRef.current.cancelSession(sessionId);
    }
    setStatus('idle');
    setSessionId(null);
    setQrDataUrl(null);
  }, [sessionId]);

  return {
    verify,
    cancel,
    sessionId,
    qrDataUrl,
    status,
    isVerifying,
    error
  };
}

// ============================================
// Button Component
// ============================================

export function ZeroAuthButton({
  request,
  text = 'Sign in with ZeroAuth',
  className = '',
  style = {},
  children,
  onSuccess,
  onError,
  showModal = true
}: ZeroAuthButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<{ sessionId: string; qrDataUrl: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const zeroAuthRef = useRef<ZeroAuth | null>(null);

  // Initialize ZeroAuth
  useEffect(() => {
    const config = (window as any).__ZERO_AUTH_CONFIG__;
    if (config?.relayUrl) {
      zeroAuthRef.current = new ZeroAuth(config);
    }
    return () => zeroAuthRef.current?.destroy();
  }, []);

  const handleClick = async () => {
    if (!zeroAuthRef.current) {
      onError?.(new Error('ZeroAuth not configured'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await zeroAuthRef.current.verify(request, {
        showModal,
        onSuccess: (res) => {
          setIsOpen(false);
          onSuccess?.(res);
        },
        onError: (err) => {
          onError?.(err);
        }
      });

      // If not showing modal, we get session info
      if (!showModal && result.sessionId) {
        const sessionData = await zeroAuthRef.current.createSession(request);
        const qr = await zeroAuthRef.current.generateQRBase64(sessionData.qrPayload);
        setSession({ sessionId: sessionData.sessionId, qrDataUrl: qr });
      }
    } catch (e) {
      onError?.(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`zero-auth-button ${className}`}
        style={{
          backgroundColor: '#7aa2f7',
          color: '#1a1b26',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          ...style
        }}
      >
        {isLoading ? 'Loading...' : children || text}
      </button>

      {showModal && isOpen && session && (
        <ZeroAuthModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          qrDataUrl={session.qrDataUrl}
          sessionId={session.sessionId}
          verifierName={request?.credentialType}
          credentialType={request?.credentialType}
          claims={request?.claims}
        />
      )}
    </>
  );
}

// ============================================
// Modal Component
// ============================================

export function ZeroAuthModal({
  isOpen,
  onClose,
  qrDataUrl,
  sessionId,
  verifierName,
  credentialType = 'Age Verification',
  claims = [],
  onCancel,
  onComplete,
  pollInterval = 2000,
  timeout = 60
}: ZeroAuthModalProps) {
  const [status, setStatus] = useState<'scanning' | 'completed' | 'expired' | 'error'>('scanning');
  const [error, setError] = useState<string>('');
  const zeroAuthRef = useRef<ZeroAuth | null>(null);
  const config = (window as any).__ZERO_AUTH_CONFIG__;

  useEffect(() => {
    if (isOpen && config?.relayUrl) {
      zeroAuthRef.current = new ZeroAuth(config);
      startPolling();
    }
    return () => zeroAuthRef.current?.destroy();
  }, [isOpen]);

  const startPolling = async () => {
    if (!zeroAuthRef.current) return;

    const checkStatus = async (): Promise<boolean> => {
      try {
        const result = await zeroAuthRef.current!.getSessionStatus(sessionId);
        
        if (result.status === 'COMPLETED') {
          setStatus('completed');
          onComplete?.({
            success: true,
            sessionId,
            claims: result.claims
          });
          return true;
        }
        
        if (result.status === 'EXPIRED') {
          setStatus('expired');
          setError('Session expired. Please try again.');
          return true;
        }
      } catch (e) {
        console.error('[ZeroAuth] Status check:', e);
      }
      return false;
    };

    const interval = setInterval(async () => {
      if (await checkStatus()) {
        clearInterval(interval);
      }
    }, pollInterval);

    // Timeout
    setTimeout(() => {
      clearInterval(interval);
      if (status === 'scanning') {
        setStatus('expired');
        setError('Verification timed out');
      }
    }, timeout * 1000);
  };

  const handleCancel = () => {
    zeroAuthRef.current?.cancelSession(sessionId);
    onCancel?.();
    onClose();
  };

  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="zero-auth-modal-overlay" onClick={onClose}>
      <div 
        className="zero-auth-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="zero-auth-modal-header">
          <h3 className="zero-auth-modal-title">ZeroAuth Verification</h3>
          <button className="zero-auth-modal-close" onClick={handleCancel}>×</button>
        </div>

        {/* Scanning State */}
        {status === 'scanning' && (
          <>
            <div className="zero-auth-modal-qr">
              <img src={qrDataUrl} alt="QR Code" className="zero-auth-modal-qr-image" />
            </div>
            <p className="zero-auth-modal-instructions">
              Scan this QR code with your ZeroAuth Wallet app
            </p>
            <div className="zero-auth-modal-session">
              <span className="zero-auth-modal-session-label">Session ID:</span>
              <code className="zero-auth-modal-session-id">{sessionId.slice(0, 8)}...</code>
              <button onClick={handleCopySessionId} className="zero-auth-modal-copy-btn">
                Copy
              </button>
            </div>
            <button onClick={handleCancel} className="zero-auth-modal-cancel-btn">
              Cancel
            </button>
          </>
        )}

        {/* Completed State */}
        {status === 'completed' && (
          <div className="zero-auth-modal-result zero-auth-modal-success">
            <div className="zero-auth-modal-result-icon">✓</div>
            <p className="zero-auth-modal-result-text">Verified!</p>
            <button onClick={onClose} className="zero-auth-modal-done-btn">
              Done
            </button>
          </div>
        )}

        {/* Expired/Error State */}
        {(status === 'expired' || status === 'error') && (
          <div className="zero-auth-modal-result zero-auth-modal-error">
            <div className="zero-auth-modal-result-icon">✕</div>
            <p className="zero-auth-modal-result-text">{error || 'Verification failed'}</p>
            <button onClick={onClose} className="zero-auth-modal-done-btn">
              Close
            </button>
          </div>
        )}
      </div>

      {/* CSS Styles */}
      <style>{`
        .zero-auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          backgroundColor: rgba(0, 0, 0, 0.8);
          display: flex;
          alignItems: center;
          justifyContent: center;
          z-index: 999999;
        }
        .zero-auth-modal-content {
          background: #1a1b26;
          borderRadius: 16px;
          padding: 24px;
          max-width: 360px;
          width: 90%;
          color: #fff;
        }
        .zero-auth-modal-header {
          display: flex;
          justifyContent: space-between;
          alignItems: center;
          marginBottom: 20px;
        }
        .zero-auth-modal-title {
          margin: 0;
          fontSize: 18px;
          fontWeight: 600;
        }
        .zero-auth-modal-close {
          background: none;
          border: none;
          color: #fff;
          fontSize: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .zero-auth-modal-qr {
          textAlign: center;
          margin-bottom: 16px;
        }
        .zero-auth-modal-qr-image {
          borderRadius: 8px;
          max-width: 200px;
        }
        .zero-auth-modal-instructions {
          textAlign: center;
          color: #7aa2f7;
          fontSize: 14px;
          marginBottom: 16px;
        }
        .zero-auth-modal-session {
          display: flex;
          alignItems: center;
          justifyContent: center;
          gap: 8px;
          background: #0f0f14;
          padding: 8px 12px;
          borderRadius: 8px;
          marginBottom: 16px;
        }
        .zero-auth-modal-session-label {
          fontSize: 12px;
          color: #888;
        }
        .zero-auth-modal-session-id {
          fontSize: 12px;
          color: #7aa2f7;
          fontFamily: monospace;
        }
        .zero-auth-modal-copy-btn {
          background: none;
          border: none;
          color: #7aa2f7;
          fontSize: 12px;
          cursor: pointer;
        }
        .zero-auth-modal-cancel-btn {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px solid #333;
          borderRadius: 8px;
          color: #888;
          cursor: pointer;
          fontSize: 14px;
        }
        .zero-auth-modal-result {
          textAlign: center;
          padding: 24px 0;
        }
        .zero-auth-modal-success .zero-auth-modal-result-icon {
          color: #4ade80;
        }
        .zero-auth-modal-error .zero-auth-modal-result-icon {
          color: #f7768e;
        }
        .zero-auth-modal-result-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .zero-auth-modal-result-text {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .zero-auth-modal-done-btn {
          background: #7aa2f7;
          color: #1a1b26;
          padding: 12px 32px;
          border: none;
          borderRadius: 8px;
          font-weight: bold;
          cursor: pointer;
        }
      `}</style>
    </div>,
    document.body
  );
}

// ============================================
// Standalone QR Component
// ============================================

export function ZeroAuthQR({ 
  payload, 
  size = 200,
  ...props 
}: { 
  payload: string; 
  size?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function generateQR() {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(payload, {
          width: size,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        setQrDataUrl(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'QR generation failed');
      }
    }
    generateQR();
  }, [payload, size]);

  if (error) return <div {...props}>{error}</div>;

  return (
    <div {...props}>
      {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: size, height: size }} />}
    </div>
  );
}

export default ZeroAuth;
