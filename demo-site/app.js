// ZeroAuth Demo Site JavaScript

(function() {
  'use strict';

  // Configuration
  const DEFAULT_RELAY_URL = 'https://zeroauth-relay.onrender.com';
  const POLL_INTERVAL = 2000; // 2 seconds

  // State
  let state = {
    sessionId: null,
    pollTimer: null,
    countdownTimer: null,
    settings: {
      verifier_name: 'Demo Verifier',
      credential_type: 'Age Verification',
      claims: ['birth_year', 'country'],
      timeout: 60,
      relay_url: DEFAULT_RELAY_URL
    }
  };

  // Claim definitions by credential type
  const CLAIMS_BY_TYPE = {
    'Age Verification': [
      { id: 'birth_year', label: 'Birth Year' },
      { id: 'country', label: 'Country' }
    ],
    'Student Verification': [
      { id: 'expiry_year', label: 'Expiry Year' },
      { id: 'university', label: 'University' }
    ],
    'Trial': [
      { id: 'trial_period', label: '7 Days' }
    ]
  };

  // Use case mapping
  const USE_CASE_MAP = {
    'Age Verification': { credential_type: 'Age Verification', claims: ['birth_year', 'country'] },
    'Student Verification': { credential_type: 'Student ID', claims: ['expiry_year', 'university'] },
    'Trial': { credential_type: 'Trial', claims: ['trial_period'] }
  };

  // DOM Elements
  const elements = {
    settingsForm: document.getElementById('settings-form'),
    verifierName: document.getElementById('verifier-name'),
    credentialType: document.getElementById('credential-type'),
    claimsCheckboxes: document.getElementById('claims-checkboxes'),
    timeout: document.getElementById('timeout'),
    timeoutValue: document.getElementById('timeout-value'),
    toggleAdvanced: document.getElementById('toggle-advanced'),
    advancedOptions: document.getElementById('advanced-options'),
    relayUrl: document.getElementById('relay-url'),
    signinBtn: document.getElementById('signin-btn'),
    loadingText: document.getElementById('loading-text'),
    settingsSection: document.getElementById('settings-section'),
    signinSection: document.getElementById('signin-section'),
    qrSection: document.getElementById('qr-section'),
    qrCanvas: document.getElementById('qr-canvas'),
    sessionVerifier: document.getElementById('session-verifier'),
    sessionClaims: document.getElementById('session-claims'),
    countdown: document.getElementById('countdown'),
    cancelBtn: document.getElementById('cancel-btn'),
    resultSection: document.getElementById('result-section'),
    resultContent: document.getElementById('result-content'),
    tryAgainBtn: document.getElementById('try-again-btn')
  };

  // Initialize
  function init() {
    updateClaimsCheckboxes();
    bindEventListeners();
    loadEnvFromWindow();
  }

  // Load environment from window.ENV if available
  function loadEnvFromWindow() {
    if (window.ENV && window.ENV.RELAY_URL) {
      state.settings.relay_url = window.ENV.RELAY_URL;
      elements.relayUrl.value = window.ENV.RELAY_URL;
    }
  }

  // Update claims checkboxes based on credential type
  function updateClaimsCheckboxes() {
    const credentialType = elements.credentialType.value;
    const claims = CLAIMS_BY_TYPE[credentialType] || [];
    
    elements.claimsCheckboxes.innerHTML = claims.map(claim => `
      <div class="checkbox-item">
        <input 
          type="checkbox" 
          id="claim-${claim.id}" 
          value="${claim.id}" 
          ${claims.length === 2 ? 'checked' : ''}
        >
        <label for="claim-${claim.id}">${claim.label}</label>
      </div>
    `).join('');

    // Update default claims
    state.settings.claims = claims.map(c => c.id);
  }

  // Bind event listeners
  function bindEventListeners() {
    // Settings changes
    elements.verifierName.addEventListener('input', (e) => {
      state.settings.verifier_name = e.target.value;
    });

    elements.credentialType.addEventListener('change', (e) => {
      state.settings.credential_type = e.target.value;
      updateClaimsCheckboxes();
    });

    elements.timeout.addEventListener('input', (e) => {
      const value = parseInt(e.target.value, 10);
      state.settings.timeout = value;
      elements.timeoutValue.textContent = value;
    });

    elements.relayUrl.addEventListener('input', (e) => {
      state.settings.relay_url = e.target.value || DEFAULT_RELAY_URL;
    });

    // Claims checkboxes (delegated)
    elements.claimsCheckboxes.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const checkedClaims = Array.from(
          elements.claimsCheckboxes.querySelectorAll('input:checked')
        ).map(cb => cb.value);
        state.settings.claims = checkedClaims;
      }
    });

    // Advanced options toggle
    elements.toggleAdvanced.addEventListener('click', () => {
      const isHidden = elements.advancedOptions.classList.contains('hidden');
      elements.advancedOptions.classList.toggle('hidden');
      elements.toggleAdvanced.textContent = isHidden 
        ? 'Hide Advanced Options ▴' 
        : 'Show Advanced Options ▾';
    });

    // Sign in button
    elements.signinBtn.addEventListener('click', handleSignIn);

    // Cancel button
    elements.cancelBtn.addEventListener('click', handleCancel);

    // Try again button
    elements.tryAgainBtn.addEventListener('click', handleTryAgain);
  }

  // Handle sign in click
  async function handleSignIn() {
    try {
      showLoading(true);
      const session = await createSession();
      if (session) {
        state.sessionId = session.session_id;
        showQRCode(session);
        startPolling(session.session_id);
        startCountdown(state.settings.timeout);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      showResult({
        success: false,
        error: error.message || 'Failed to create session'
      });
    }
  }

  // Create session via relay
  async function createSession() {
    const relayUrl = state.settings.relay_url;
    const useCase = USE_CASE_MAP[state.settings.credential_type] || USE_CASE_MAP['Login'];

    const payload = {
      verifier_name: state.settings.verifier_name,
      credential_type: useCase.credential_type,
      required_claims: state.settings.claims,
      timeout: state.settings.timeout
    };

    const response = await fetch(`${relayUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}: Failed to create session`);
    }

    return response.json();
  }

  // Show QR code
  function showQRCode(session) {
    // Hide sections
    elements.settingsSection.classList.add('hidden');
    elements.signinSection.classList.add('hidden');
    
    // Update session info
    elements.sessionVerifier.textContent = session.verifier_name || state.settings.verifier_name;
    elements.sessionClaims.textContent = (session.requested_claims || state.settings.claims).join(', ');

    // Generate QR code from qr_payload
    const qrPayload = JSON.stringify(session.qr_payload || {
      session_id: session.session_id,
      relay_url: state.settings.relay_url
    });

    QRCode.toCanvas(elements.qrCanvas, qrPayload, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }, (error) => {
      if (error) {
        console.error('QR generation error:', error);
      }
    });

    // Show QR section
    elements.qrSection.classList.remove('hidden');
    showLoading(false);
  }

  // Start polling for session status
  function startPolling(sessionId) {
    state.pollTimer = setInterval(async () => {
      try {
        const status = await pollSessionStatus(sessionId);
        if (status.status === 'completed' || status.status === 'verified') {
          stopPolling();
          stopCountdown();
          showResult({ success: true, claims: status.claims || {} });
        } else if (status.status === 'expired' || status.status === 'cancelled') {
          stopPolling();
          stopCountdown();
          showResult({ 
            success: false, 
            error: `Session ${status.status}` 
          });
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, POLL_INTERVAL);
  }

  // Poll session status
  async function pollSessionStatus(sessionId) {
    const relayUrl = state.settings.relay_url;
    const response = await fetch(`${relayUrl}/api/v1/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to get session status`);
    }

    return response.json();
  }

  // Stop polling
  function stopPolling() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  // Start countdown timer
  function startCountdown(seconds) {
    let remaining = seconds;
    elements.countdown.textContent = remaining;

    state.countdownTimer = setInterval(() => {
      remaining--;
      elements.countdown.textContent = remaining;

      if (remaining <= 0) {
        stopCountdown();
        showResult({ 
          success: false, 
          error: 'Session timed out' 
        });
      }
    }, 1000);
  }

  // Stop countdown
  function stopCountdown() {
    if (state.countdownTimer) {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
    }
  }

  // Handle cancel
  function handleCancel() {
    stopPolling();
    stopCountdown();
    state.sessionId = null;
    resetUI();
  }

  // Handle try again
  function handleTryAgain() {
    state.sessionId = null;
    resetUI();
  }

  // Reset UI to initial state
  function resetUI() {
    elements.qrSection.classList.add('hidden');
    elements.resultSection.classList.add('hidden');
    elements.settingsSection.classList.remove('hidden');
    elements.signinSection.classList.remove('hidden');
    showLoading(false);
  }

  // Show result
  function showResult(result) {
    elements.qrSection.classList.add('hidden');
    
    if (result.success) {
      elements.resultContent.innerHTML = `
        <div class="result-success">
          <div class="icon">✓</div>
          <h3>Verification Successful!</h3>
          <div class="claims-display">
            <h4>Received Claims:</h4>
            <ul>
              ${Object.entries(result.claims || {}).map(([key, value]) => `
                <li><strong>${key}:</strong> ${JSON.stringify(value)}</li>
              `).join('') || '<li>No claims received</li>'}
            </ul>
          </div>
        </div>
      `;
    } else {
      elements.resultContent.innerHTML = `
        <div class="result-error">
          <div class="icon">✗</div>
          <h3>Verification Failed</h3>
          <p>${result.error || 'An error occurred during verification.'}</p>
        </div>
      `;
    }

    elements.resultSection.classList.remove('hidden');
  }

  // Show/hide loading state
  function showLoading(show) {
    elements.signinBtn.disabled = show;
    elements.loadingText.classList.toggle('hidden', !show);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.ZeroAuthDemo = {
    getState: () => state,
    createSession: () => handleSignIn(),
    cancel: () => handleCancel()
  };
})();
