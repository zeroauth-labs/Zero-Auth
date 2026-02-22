import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

// Types
export interface ZeroAuthConfig {
  relayUrl: string;
  verifierName?: string;
  credentialType?: string;
  claims?: string[];
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

export interface ZeroAuthButtonProps {
  text?: string;
  className?: string;
  style?: React.CSSProperties;
  credentialType?: string;
  claims?: string[];
  onSuccess?: (result: VerificationResult) => void;
  onError?: (error: Error) => void;
}

// QR Code generator (uses canvas API)
function generateQRCode(text: string, canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
    // Simple QR code implementation using canvas
    // For production, you'd use a library like qrcode
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // For now, we'll show the QR data as text
    // A real implementation would use a QR library
    canvas.width = 200;
    canvas.height = 200;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#000000';
    ctx.font = '12px monospace';
    
    // Split text into lines
    const lines = text.split('');
    lines.forEach((line, i) => {
      ctx.fillText(line, 10, 20 + i * 14);
    });
    
    // Draw a simple QR-like pattern
    ctx.fillStyle = '#000000';
    // Corner patterns
    ctx.fillRect(10, 10, 50, 50);
    ctx.fillRect(15, 15, 40, 40);
    ctx.fillRect(20, 20, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(25, 25, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillRect(30, 30, 10, 10);
    
    ctx.fillRect(140, 10, 50, 50);
    ctx.fillRect(145, 15, 40, 40);
    ctx.fillRect(150, 20, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(155, 25, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillRect(160, 30, 10, 10);
    
    ctx.fillRect(10, 140, 50, 50);
    ctx.fillRect(15, 145, 40, 40);
    ctx.fillRect(20, 150, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(25, 155, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillRect(30, 160, 10, 10);
    
    resolve();
  });
}

// Modal Component
function ZeroAuthModal({ 
  isOpen, 
  onClose, 
  qrPayload, 
  sessionId,
  onComplete 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  qrPayload: any;
  sessionId: string;
  onComplete: (result: VerificationResult) => void;
}) {
  const [status, setStatus] = useState<'pending' | 'scanning' | 'verified' | 'error'>('pending');
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (!isOpen || !sessionId) return;

    // Get relay URL from window or config
    const relayUrl = (window as any).ZeroAuthConfig?.relayUrl || '';
    
    // Poll for verification
    const checkStatus = async () => {
      try {
        const response = await fetch(`${relayUrl}/api/v1/sessions/${sessionId}`);
        if (response.ok) {
          const session = await response.json();
          if (session.status === 'COMPLETED') {
            setStatus('verified');
            onComplete({
              success: true,
              sessionId,
              claims: session.proof?.attributes || {}
            });
          }
        }
      } catch (e) {
        console.error('Status check error:', e);
      }
    };

    const interval = setInterval(checkStatus, 2000);
    setStatus('scanning');

    return () => clearInterval(interval);
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999
    }}>
      <div style={{
        backgroundColor: '#1a1b26',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '320px',
        width: '90%',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>ZeroAuth Verification</h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}
          >
            ×
          </button>
        </div>

        {status === 'scanning' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p style={{ color: '#7aa2f7', marginBottom: '8px' }}>Scan with ZeroAuth Wallet</p>
              <canvas 
                ref={(el) => {
                  if (el && qrPayload) {
                    generateQRCode(JSON.stringify(qrPayload), el);
                  }
                }}
                style={{ borderRadius: '8px' }}
              />
            </div>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '14px' }}>
              Waiting for verification...
            </p>
          </>
        )}

        {status === 'verified' && (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <p style={{ color: '#4ade80', fontSize: '18px' }}>Verified!</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Main ZeroAuth Button Component
export function ZeroAuthButton({
  text = 'Sign in with ZeroAuth',
  className = '',
  style = {},
  credentialType = 'Age Verification',
  claims = ['birth_year'],
  onSuccess,
  onError
}: ZeroAuthButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [qrPayload, setQrPayload] = useState<any>(null);

  const handleClick = async () => {
    const relayUrl = (window as any).ZeroAuthConfig?.relayUrl;
    if (!relayUrl) {
      onError?.(new Error('ZeroAuth not configured. Set window.ZeroAuthConfig.relayUrl'));
      return;
    }

    try {
      const response = await fetch(`${relayUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifier_name: (window as any).ZeroAuthConfig?.verifierName || 'ZeroAuth User',
          credential_type: credentialType,
          required_claims: claims,
          timeout: 60
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setQrPayload(data.qr_payload);
      setIsModalOpen(true);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const handleComplete = (result: VerificationResult) => {
    setIsModalOpen(false);
    onSuccess?.(result);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className={className}
        style={{
          backgroundColor: '#7aa2f7',
          color: '#1a1b26',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          ...style
        }}
      >
        {text}
      </button>

      <ZeroAuthModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        qrPayload={qrPayload}
        sessionId={sessionId}
        onComplete={handleComplete}
      />
    </>
  );
}

// Standalone verify function
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
    
    // Store config globally for button component
    if (typeof window !== 'undefined') {
      (window as any).ZeroAuthConfig = this.config;
    }
  }

  async verify(request?: Partial<VerificationRequest>): Promise<VerificationResult> {
    const req: VerificationRequest = {
      credentialType: request?.credentialType || this.config.credentialType || 'Age Verification',
      claims: request?.claims || this.config.claims || ['birth_year'],
      timeout: request?.timeout || this.config.timeout || 60
    };

    try {
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

      // Poll for completion
      return new Promise((resolve) => {
        const checkStatus = async () => {
          try {
            const res = await fetch(`${this.config.relayUrl}/api/v1/sessions/${session_id}`);
            if (res.ok) {
              const session = await res.json();
              if (session.status === 'COMPLETED') {
                resolve({
                  success: true,
                  sessionId: session_id,
                  claims: session.proof?.attributes || {}
                });
                return true;
              }
            }
          } catch {}
          return false;
        };

        const interval = setInterval(async () => {
          if (await checkStatus()) {
            clearInterval(interval);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(interval);
          resolve({
            success: false,
            sessionId: session_id,
            error: 'Verification timed out'
          });
        }, (req.timeout || 60) * 1000);
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default ZeroAuth;
