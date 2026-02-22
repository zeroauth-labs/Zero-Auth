// ZeroAuth SDK - Vanilla JS Version (no React dependency)

(function(global) {
  'use strict';

  // QR Code generator using canvas
  function generateQRCode(text, canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 200;
    canvas.height = 200;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    
    // Draw QR-like pattern (simplified)
    ctx.fillStyle = '#000000';
    // Top-left corner
    ctx.fillRect(10, 10, 50, 50);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 20, 30, 30);
    ctx.fillStyle = '#000000';
    ctx.fillRect(30, 30, 10, 10);
    
    // Top-right corner
    ctx.fillStyle = '#000000';
    ctx.fillRect(140, 10, 50, 50);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(150, 20, 30, 30);
    ctx.fillStyle = '#000000';
    ctx.fillRect(160, 30, 10, 10);
    
    // Bottom-left corner
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, 140, 50, 50);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 150, 30, 30);
    ctx.fillStyle = '#000000';
    ctx.fillRect(30, 160, 10, 10);
    
    // Add text
    ctx.fillStyle = '#000000';
    ctx.font = '10px monospace';
    ctx.fillText('Scan with', 60, 100);
    ctx.font = 'bold 12px monospace';
    ctx.fillText('ZeroAuth', 65, 115);
  }

  // Create modal element
  function createModal(config) {
    var existing = document.getElementById('zeroauth-modal');
    if (existing) existing.remove();
    
    var modal = document.createElement('div');
    modal.id = 'zeroauth-modal';
    modal.innerHTML = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:999999;"><div style="background:#1a1b26;border-radius:16px;padding:24px;max-width:320px;width:90%;color:#fff;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h3 style="margin:0;font-size:18px;">ZeroAuth Verification</h3><button id="zeroauth-close" style="background:none;border:none;color:#fff;cursor:pointer;font-size:24px;">×</button></div><div id="zeroauth-content" style="text-align:center;"><p style="color:#7aa2f7;margin-bottom:8px;">Scan with ZeroAuth Wallet</p><canvas id="zeroauth-qr" style="border-radius:8px;"></canvas><p style="color:#888;font-size:14px;margin-top:16px;">Waiting for verification...</p></div></div></div>';
    
    document.body.appendChild(modal);
    
    document.getElementById('zeroauth-close').onclick = function() {
      modal.remove();
      if (config.onClose) config.onClose();
    };
    
    if (config.qrPayload) {
      generateQRCode(JSON.stringify(config.qrPayload), document.getElementById('zeroauth-qr'));
    }
    
    return modal;
  }

  // ZeroAuth Button function
  function ZeroAuthButton(options) {
    options = options || {};
    var btn = document.createElement('button');
    btn.textContent = options.text || 'Sign in with ZeroAuth';
    btn.style.cssText = 'background:#7aa2f7;color:#1a1b26;padding:12px 24px;border-radius:8px;border:none;cursor:pointer;font-weight:bold;font-size:16px;';
    
    btn.onclick = function() {
      startVerification(options);
    };
    
    return btn;
  }

  // Start verification
  function startVerification(options) {
    options = options || {};
    var relayUrl = options.relayUrl || global.ZeroAuthConfig.relayUrl;
    var verifierName = options.verifierName || global.ZeroAuthConfig.verifierName || 'ZeroAuth User';
    var credentialType = options.credentialType || 'Age Verification';
    var claims = options.claims || ['birth_year'];
    var onSuccess = options.onSuccess;
    var onError = options.onError;
    
    if (!relayUrl) {
      if (onError) onError(new Error('relayUrl not configured'));
      return;
    }
    
    fetch(relayUrl + '/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verifier_name: verifierName,
        credential_type: credentialType,
        required_claims: claims
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      
      createModal({ qrPayload: data.qr_payload });
      
      var pollInterval = setInterval(function() {
        fetch(relayUrl + '/api/v1/sessions/' + data.session_id)
          .then(function(r) { return r.json(); })
          .then(function(session) {
            if (session.status === 'COMPLETED' || session.status === 'completed') {
              clearInterval(pollInterval);
              var modal = document.getElementById('zeroauth-modal');
              if (modal) modal.remove();
              if (onSuccess) onSuccess({ success: true, sessionId: data.session_id, claims: session.proof ? session.proof.attributes : {} });
            }
          })
          .catch(function() {});
      }, 2000);
      
      setTimeout(function() {
        clearInterval(pollInterval);
        var modal = document.getElementById('zeroauth-modal');
        if (modal) modal.remove();
        if (onError) onError(new Error('Verification timed out'));
      }, 60000);
    })
    .catch(function(err) {
      if (onError) onError(err);
    });
  }

  // Export
  global.ZeroAuthButton = ZeroAuthButton;
  global.ZeroAuth = { verify: function(options) { return new Promise(function(resolve, reject) { options = options || {}; options.onSuccess = resolve; options.onError = reject; startVerification(options); }); } };

})(window);
