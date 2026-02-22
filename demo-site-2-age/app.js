/**
 * Z-Date Demo Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Zero-Auth SDK
    const zeroAuth = new ZeroAuth.ZeroAuth({
        relayUrl: 'https://zeroauth-relay.onrender.com/', // Default relay URL
        verifierName: 'Z-Date Dating',
        credentialType: 'Age Verification',
        claims: ['birth_year']
    });

    // 2. State Management
    const state = {
        isVerified: false,
        isAuthenticated: false,
        currentView: 'home'
    };

    // 3. UI Elements
    const views = {
        home: document.getElementById('view-home'),
        auth: document.getElementById('view-auth'),
        discover: document.getElementById('view-discover')
    };

    const navLinks = document.querySelectorAll('.nav-link');
    const verifyBtn = document.getElementById('verify-age-btn');
    const qrContainer = document.getElementById('qr-container');
    const qrCanvas = document.getElementById('qr-canvas');
    const cancelVerifyBtn = document.getElementById('cancel-verify');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForm = document.getElementById('auth-form');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const statusModal = document.getElementById('status-modal');
    const closeModalBtn = document.getElementById('close-modal');

    // 4. Navigation Logic
    function switchView(viewName) {
        if (viewName === 'discover' && !state.isVerified) {
            showModal('Verification Required', 'Please verify your age first to access discovery.', 'error');
            return;
        }

        Object.keys(views).forEach(key => {
            views[key].classList.remove('active');
        });

        views[viewName].classList.add('active');
        state.currentView = viewName;

        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(link.dataset.view);
        });
    });

    // 5. Zero-Auth Integration
    let qr = null;

    zeroAuth.onQRReady((qrPayload, sessionId) => {
        console.log("QR Payload ready:", qrPayload);
        qrContainer.classList.remove('hidden');

        // Generate QR Code
        if (!qr) {
            qr = new QRious({
                element: qrCanvas,
                size: 200,
                value: JSON.stringify(qrPayload)
            });
        } else {
            qr.value = JSON.stringify(qrPayload);
        }
    });

    verifyBtn.addEventListener('click', async () => {
        verifyBtn.disabled = true;
        verifyBtn.innerText = 'Initializing...';

        try {
            const result = await zeroAuth.verify();

            if (result.success) {
                state.isVerified = true;
                qrContainer.classList.add('hidden');
                showModal('Age Verified!', 'You have successfully proved you are 18+. Redirecting to discovery...', 'success');
                setTimeout(() => {
                    hideModal();
                    switchView('discover');
                }, 2000);
            } else {
                if (result.error !== 'Verification timed out') {
                    showModal('Verification Failed', result.error || 'Failed to verify age.', 'error');
                }
            }
        } catch (error) {
            showModal('Error', 'An unexpected error occurred.', 'error');
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.innerText = 'Verify with Zero-Auth';
            qrContainer.classList.add('hidden');
        }
    });

    cancelVerifyBtn.addEventListener('click', () => {
        qrContainer.classList.add('hidden');
        verifyBtn.disabled = false;
        verifyBtn.innerText = 'Verify with Zero-Auth';
    });

    // 6. Auth Simulation
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            authSubmitBtn.innerText = tab.dataset.tab === 'login' ? 'Login' : 'Sign Up';
        });
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.isAuthenticated = true;
        showModal('Welcome!', 'Authentication successful.', 'success');
        setTimeout(() => {
            hideModal();
            switchView('home');
        }, 1500);
    });

    // 7. Utility Functions
    function showModal(title, message, type) {
        document.getElementById('status-title').innerText = title;
        document.getElementById('status-message').innerText = message;
        statusModal.classList.remove('hidden');
    }

    function hideModal() {
        statusModal.classList.add('hidden');
    }

    closeModalBtn.addEventListener('click', hideModal);
});
