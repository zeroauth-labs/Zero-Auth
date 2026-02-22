import cors from 'cors';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { createSession, getSession, updateSession, cleanupExpiredSessions } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting - protect against abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Cleanup expired sessions every minute
setInterval(async () => {
  try {
    await cleanupExpiredSessions();
  } catch (error) {
    console.error('Error during session cleanup:', error);
  }
}, 60 * 1000);

// Create a new verification session
app.post('/api/v1/sessions', async (req, res) => {
  try {
    const { verifier_name, required_claims } = req.body;
    const session_id = uuidv4();
    const nonce = uuidv4();

    const session = await createSession(session_id, nonce, verifier_name, required_claims);

    // Get the public URL from environment (required for callback)
    const publicUrl = process.env.PUBLIC_URL;
    if (!publicUrl) {
      return res.status(500).json({ error: 'PUBLIC_URL environment variable not set' });
    }

    // QR Payload Format
    const qr_payload = {
      v: 1,
      action: 'verify',
      session_id,
      nonce,
      verifier: {
        name: verifier_name || 'Zero Auth Verifier',
        did: 'did:web:relay.zeroauth.app', // Mock DID - update for production
        callback: `${publicUrl}/api/v1/sessions/${session_id}/proof`,
      },
      required_claims,
      credential_type: 'Age Verification', // Default for V1
      expires_at: Math.floor((Date.now() + 5 * 60 * 1000) / 1000), // Unix timestamp (5 mins)
    };

    res.json({ session_id, nonce, qr_payload });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session status
app.get('/api/v1/sessions/:id', async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Submit proof for a session
app.post('/api/v1/sessions/:id/proof', async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    await updateSession(req.params.id, {
      status: 'COMPLETED',
      proof: req.body, // Wallet sends the ProofPayload
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating session with proof:', error);
    res.status(500).json({ error: 'Failed to submit proof' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zero Auth Relay running on port ${PORT}`);
  console.log(`Using Supabase for session storage`);
});
