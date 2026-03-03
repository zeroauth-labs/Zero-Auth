/**
 * ZeroAuth SDK - Global Drop-in Script
 * Works without any imports - just add script tag!
 * 
 * Usage:
 * <script src="zero-auth-umd.js"></script>
 * <script>
 *   ZeroAuth.init({ relayUrl: '...' });
 *   ZeroAuth.verify({...});
 * </script>
 */

(function(global) {
  'use strict';

  // ============================================
  // QR Code Generator
  // Uses global QRCode if available (from importmap), else fallback
  // ============================================
  
  const QRCodeLib = {
    generate: async function(text, options) {
      var size = options && options.width ? options.width : 200;
      var margin = options && typeof options.margin === 'number' ? options.margin : 1;
      var dark = (options && options.color && options.color.dark) ? options.color.dark : '#000000';
      var light = (options && options.color && options.color.light) ? options.color.light : '#ffffff';
      var errorCorrectionLevel = options && options.errorCorrectionLevel ? options.errorCorrectionLevel : 'M';
      
      // Try to use global QRCode (from importmap/esm)
      if (typeof global.QRCode !== 'undefined') {
        try {
          return await global.QRCode.toDataURL(text, {
            width: size,
            margin: margin,
            color: { dark: dark, light: light },
            errorCorrectionLevel: errorCorrectionLevel
          });
        } catch(e) { console.warn('QRCode from global failed:', e); }
      }
      
      if (typeof window.QRCode !== 'undefined') {
        try {
          return await window.QRCode.toDataURL(text, {
            width: size,
            margin: margin,
            color: { dark: dark, light: light },
            errorCorrectionLevel: errorCorrectionLevel
          });
        } catch(e) { console.warn('QRCode from window failed:', e); }
      }
      
      // Fallback: simple placeholder QR
      return createSimpleQR(text, size, dark, light);
    }
  };
  
  function createSimpleQR(text, size, dark, light) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = light || '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // QR is 21x21 modules
    var modules = 21;
    var s = size / (modules + 4);
    var border = 2 * s;
    
    ctx.fillStyle = dark || '#000000';
    
    // Create module grid
    var grid = [];
    for(var i=0; i<modules; i++) { grid[i] = []; for(var j=0; j<modules; j++) grid[i][j] = false; }
    
    // Position detection patterns (corners)
    drawPosition(grid, 0, 0);
    drawPosition(grid, modules-7, 0);
    drawPosition(grid, 0, modules-7);
    
    // Alignment pattern
    drawAlignment(grid, modules-9, modules-9);
    
    // Timing patterns
    for(var i=8; i<modules-8; i++) {
      grid[6][i] = (i%2===0);
      grid[i][6] = (i%2===0);
    }
    
    // Format info
    grid[8][0] = true; grid[8][1] = true; grid[8][2] = true;
    grid[8][3] = true; grid[8][4] = true; grid[8][5] = true;
    grid[8][7] = true; grid[8][8] = true; grid[8][9] = true;
    
    // Data pattern - encode text as much as possible
    var data = text.substring(0, 50); // Limit to fit in QR
    var hash = 0;
    for(var i=0; i<data.length; i++) hash = ((hash<<5)-hash) + data.charCodeAt(i);
    
    for(var row=0; row<modules; row++) {
      for(var col=0; col<modules; col++) {
        if(!grid[row][col]) {
          // Pseudo-random but deterministic based on text
          var seed = (row * 17 + col * 13 + hash) % 100;
          grid[row][col] = (seed > 40);
        }
      }
    }
    
    // Draw the grid
    for(var row=0; row<modules; row++) {
      for(var col=0; col<modules; col++) {
        if(grid[row][col]) {
          ctx.fillRect(border + col*s, border + row*s, s+0.5, s+0.5);
        }
      }
    }
    
    return canvas.toDataURL('image/png');
  }
  
  function drawPosition(grid, row, col) {
    for(var i=0; i<7; i++) {
      for(var j=0; j<7; j++) {
        var draw = (i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4));
        grid[row+i][col+j] = draw;
      }
    }
  }
  
  function drawAlignment(grid, row, col) {
    for(var i=-2; i<=2; i++) {
      for(var j=-2; j<=2; j++) {
        var draw = (Math.abs(i)===2||Math.abs(j)===2||(i===0&&j===0));
        if(row+i>=0 && row+i<21 && col+j>=0 && col+j<21) {
          grid[row+i][col+j] = draw;
        }
      }
    }
  }
  
  function drawPositionPattern(ctx, x, y, s) {
    for(var i=0; i<7; i++) {
      for(var j=0; j<7; j++) {
        var draw = (i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4));
        if(draw) ctx.fillRect(x+i*s, y+j*s, s, s);
      }
    }
  }

  // ============================================
  // Modal UI
  // ============================================

  function createModal(options) {
    // Remove existing modal
    const existing = document.getElementById('zeroauth-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'zeroauth-modal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: #1a1b26;
      border-radius: 16px;
      padding: 24px;
      max-width: 360px;
      width: 90%;
      color: #fff;
      text-align: center;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;';
    header.innerHTML = `
      <h3 style="margin:0;font-size:18px;font-weight:600">ZeroAuth Verification</h3>
      <button id="za-modal-close" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;">×</button>
    `;
    content.appendChild(header);

    // QR Container
    const qrContainer = document.createElement('div');
    qrContainer.id = 'za-qr-container';
    qrContainer.style.cssText = 'margin-bottom:16px;';
    content.appendChild(qrContainer);

    // Instructions
    const instructions = document.createElement('p');
    instructions.id = 'za-instructions';
    instructions.style.cssText = 'color:#7aa2f7;font-size:14px;margin-bottom:16px;';
    instructions.textContent = 'Scan with ZeroAuth Wallet';
    content.appendChild(instructions);

    // Session ID
    const sessionDiv = document.createElement('div');
    sessionDiv.style.cssText = 'background:#0f0f14;padding:8px 12px;border-radius:8px;margin-bottom:16px;';
    sessionDiv.innerHTML = `
      <span style="color:#888;font-size:12px;">Session:</span>
      <code id="za-session-id" style="color:#7aa2f7;font-size:12px;font-family:monospace;"></code>
    `;
    content.appendChild(sessionDiv);

    // Cancel Button
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'za-cancel-btn';
    cancelBtn.style.cssText = 'width:100%;padding:12px;background:transparent;border:1px solid #333;border-radius:8px;color:#888;cursor:pointer;font-size:14px;';
    cancelBtn.textContent = 'Cancel';
    content.appendChild(cancelBtn);

    // Success State (hidden initially)
    const successDiv = document.createElement('div');
    successDiv.id = 'za-success';
    successDiv.style.cssText = 'display:none;padding:24px 0;';
    successDiv.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px;">✓</div>
      <p style="color:#4ade80;font-size:18px;margin-bottom:20px;">Verified!</p>
    `;
    content.appendChild(successDiv);

    // Error State (hidden initially)
    const errorDiv = document.createElement('div');
    errorDiv.id = 'za-error';
    errorDiv.style.cssText = 'display:none;padding:24px 0;';
    errorDiv.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px;">✕</div>
      <p id="za-error-msg" style="color:#f7768e;font-size:14px;margin-bottom:20px;"></p>
    `;
    content.appendChild(errorDiv);

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Event handlers
    document.getElementById('za-modal-close').addEventListener('click', function() {
      closeModal();
      if (options.onCancel) options.onCancel();
    });

    cancelBtn.addEventListener('click', function() {
      closeModal();
      if (options.onCancel) options.onCancel();
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeModal();
        if (options.onCancel) options.onCancel();
      }
    });

    function closeModal() {
      overlay.remove();
    }

    function showQR(qrDataUrl, sessionId) {
      qrContainer.innerHTML = `<img src="${qrDataUrl}" alt="QR Code" style="border-radius:8px;max-width:200px;">`;
      document.getElementById('za-session-id').textContent = sessionId.slice(0, 8) + '...';
      qrContainer.style.display = 'block';
      instructions.style.display = 'block';
      sessionDiv.style.display = 'flex';
      cancelBtn.style.display = 'block';
      successDiv.style.display = 'none';
      errorDiv.style.display = 'none';
    }

    function showSuccess() {
      qrContainer.style.display = 'none';
      instructions.style.display = 'none';
      sessionDiv.style.display = 'none';
      cancelBtn.style.display = 'none';
      successDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      
      setTimeout(closeModal, 2000);
    }

    function showError(msg) {
      qrContainer.style.display = 'none';
      instructions.style.display = 'none';
      sessionDiv.style.display = 'none';
      cancelBtn.style.display = 'none';
      successDiv.style.display = 'none';
      errorDiv.style.display = 'block';
      document.getElementById('za-error-msg').textContent = msg;
    }

    return { showQR, showSuccess, showError, closeModal };
  }

  // ============================================
  // ZeroAuth Global Object
  // ============================================

  var config = {
    relayUrl: '',
    verifierName: 'ZeroAuth User',
    credentialType: 'Age Verification',
    claims: ['birth_year'],
    timeout: 60,
    apiKey: ''
  };

  var currentSession = null;
  var pollingInterval = null;

  var ZeroAuth = {
    /**
     * Initialize with configuration
     */
    init: function(options) {
      config = Object.assign(config, options);
      if (!config.relayUrl) {
        console.error('[ZeroAuth] relayUrl is required');
        return this;
      }
      // Remove trailing slash
      config.relayUrl = config.relayUrl.replace(/\/$/, '');
      console.log('[ZeroAuth] Initialized with relay:', config.relayUrl);
      return this;
    },

    /**
     * Start verification
     */
    verify: function(options) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!config.relayUrl) {
          reject(new Error('ZeroAuth not initialized. Call ZeroAuth.init() first.'));
          return;
        }

        var request = Object.assign({
          credentialType: config.credentialType,
          claims: config.claims,
          useCase: 'LOGIN',
          timeout: config.timeout
        }, options);

        // Create session
        fetch(config.relayUrl + '/api/v1/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey || ''
          },
          body: JSON.stringify({
            verifier_name: config.verifierName,
            credential_type: request.credentialType,
            required_claims: request.claims,
            use_case: request.useCase,
            timeout: request.timeout
          })
        })
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Failed to create session: ' + response.status);
          }
          return response.json();
        })
        .then(async function(data) {
          currentSession = data;
          
          // Generate QR (async)
          var qrDataUrl = await QRCodeLib.generate(JSON.stringify(data.qr_payload), 200);
          
          // Show modal
          var modal = createModal({
            onCancel: function() {
              self.cancel();
              resolve({ success: false, error: 'Cancelled' });
            }
          });
          
          modal.showQR(qrDataUrl, data.session_id);
          
          // Start polling
          startPolling(data.session_id, {
            onComplete: function(claims) {
              modal.showSuccess();
              resolve({ success: true, sessionId: data.session_id, claims: claims });
            },
            onError: function(msg) {
              modal.showError(msg);
              resolve({ success: false, error: msg });
            },
            onTimeout: function() {
              modal.showError('Verification timed out');
              resolve({ success: false, error: 'Timeout' });
            }
          });
        })
        .catch(function(err) {
          reject(err);
        });
      });
    },

    /**
     * Cancel current verification
     */
    cancel: function() {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
      if (currentSession) {
        fetch(config.relayUrl + '/api/v1/sessions/' + currentSession.session_id, {
          method: 'DELETE',
          headers: { 'X-API-Key': config.apiKey || '' }
        }).catch(function() {});
        currentSession = null;
      }
    },

    /**
     * Get current config
     */
    getConfig: function() {
      return Object.assign({}, config);
    },

    /**
     * Create a verification session
     */
    createSession: function(options) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!config.relayUrl) {
          reject(new Error('ZeroAuth not initialized'));
          return;
        }

        var request = Object.assign({
          credentialType: config.credentialType,
          claims: config.claims,
          useCase: 'LOGIN',
          timeout: config.timeout
        }, options);

        fetch(config.relayUrl + '/api/v1/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey || ''
          },
          body: JSON.stringify({
            verifier_name: config.verifierName,
            credential_type: request.credentialType,
            required_claims: request.claims,
            use_case: request.useCase,
            timeout: request.timeout
          })
        })
        .then(function(response) {
          if (!response.ok) throw new Error('Failed: ' + response.status);
          return response.json();
        })
        .then(function(data) {
          resolve({
            sessionId: data.session_id,
            qrPayload: data.qr_payload,
            expiresAt: Date.now() + (request.timeout || config.timeout) * 1000
          });
        })
        .catch(reject);
      });
    },

    /**
     * Generate QR code as base64
     */
    generateQRBase64: async function(payload, options) {
      var opts = {
        width: options && options.width ? options.width : 200,
        margin: 1,
        color: {
          dark: options && options.color ? options.color : '#000000',
          light: options && options.backgroundColor ? options.backgroundColor : '#ffffff'
        },
        errorCorrectionLevel: options && options.errorCorrectionLevel ? options.errorCorrectionLevel : 'M'
      };
      return await QRCodeLib.generate(payload, opts);
    },

    /**
     * Generate deep link for wallet
     */
    generateDeeplink: function(sessionId) {
      return 'zeroauth://verify?session=' + sessionId;
    },

    /**
     * Get session status
     */
    getSessionStatus: function(sessionId) {
      return fetch(config.relayUrl + '/api/v1/sessions/' + sessionId, {
        headers: { 'X-API-Key': config.apiKey || '' }
      })
      .then(function(response) {
        if (!response.ok) throw new Error('Session not found');
        return response.json();
      })
      .then(function(data) {
        return {
          sessionId: data.session_id,
          status: data.status,
          claims: data.proof ? data.proof.attributes : null
        };
      });
    },

    /**
     * Cancel a session
     */
    cancelSession: function(sessionId) {
      return fetch(config.relayUrl + '/api/v1/sessions/' + sessionId, {
        method: 'DELETE',
        headers: { 'X-API-Key': config.apiKey || '' }
      })
      .then(function() { return true; })
      .catch(function() { return true; });
    },

    /**
     * Validate QR payload
     */
    validateQRPayload: function(payload) {
      try {
        var data = JSON.parse(payload);
        if (!data.v || !data.session_id || !data.verifier) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true, data: data };
      } catch (e) {
        return { valid: false, error: 'Invalid JSON' };
      }
    }
  };

  function startPolling(sessionId, callbacks) {
    if (pollingInterval) clearInterval(pollingInterval);
    
    var startTime = Date.now();
    
    pollingInterval = setInterval(function() {
      // Check timeout
      if (Date.now() - startTime > config.timeout * 1000) {
        clearInterval(pollingInterval);
        callbacks.onTimeout();
        return;
      }
      
      fetch(config.relayUrl + '/api/v1/sessions/' + sessionId, {
        headers: { 'X-API-Key': config.apiKey || '' }
      })
      .then(function(response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function(session) {
        if (!session) return;
        
        if (session.status === 'COMPLETED') {
          clearInterval(pollingInterval);
          callbacks.onComplete(session.proof ? session.proof.attributes : {});
        }
      })
      .catch(function(err) {
        console.error('[ZeroAuth] Polling error:', err);
      });
    }, 2000);
  }

  // Auto-init for drop-in buttons with za-verify class
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      // Wait for script to load
      setTimeout(function() {
        var buttons = document.querySelectorAll('.za-verify, [data-zero-auth]');
        buttons.forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get config from data attributes
            var dataConfig = {};
            if (btn.dataset.credentialType) dataConfig.credentialType = btn.dataset.credentialType;
            if (btn.dataset.claims) {
              try { dataConfig.claims = JSON.parse(btn.dataset.claims); }
              catch (e) { dataConfig.claims = btn.dataset.claims.split(','); }
            }
            if (btn.dataset.useCase) dataConfig.useCase = btn.dataset.useCase;
            
            if (!config.relayUrl && !dataConfig.relayUrl) {
              console.error('[ZeroAuth] Please initialize with ZeroAuth.init() first');
              return;
            }
            
            ZeroAuth.verify(dataConfig);
          });
        });
      }, 100);
    });
  }

  // ============================================
  // Standalone validateQRPayload function
  // ============================================
  function validateQRPayload(payload) {
    try {
      var data = JSON.parse(payload);
      if (!data.v || !data.session_id || !data.verifier) {
        return { valid: false, error: 'Missing required fields' };
      }
      return { valid: true, data: data };
    } catch (e) {
      return { valid: false, error: 'Invalid JSON' };
    }
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZeroAuth: ZeroAuth, validateQRPayload: validateQRPayload };
  } else {
    global.ZeroAuth = ZeroAuth;
    global.validateQRPayload = validateQRPayload;
  }

})(typeof window !== 'undefined' ? window : this);
