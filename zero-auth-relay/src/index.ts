import cors from 'cors';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { createSession, getSession, updateSession, cleanupExpiredSessions } from './db.js';
import { validateSessionCreation, validateProofSubmission } from './validation.js';
import { ErrorCode, createError, SUPPORTED_CREDENTIAL_TYPES, isValidClaims } from './errors.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit request body size

// Rate limiting - protect against abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs (increased for demo)
  message: createError(ErrorCode.INVALID_REQUEST_BODY, 'Too many requests, please try again later'),
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
app.post('/api/v1/sessions', validateSessionCreation, async (req, res) => {
  try {
    const { verifier_name, required_claims, credential_type } = req.body;
    const session_id = uuidv4();
    const nonce = uuidv4();

    const session = await createSession(session_id, nonce, verifier_name, required_claims);

    // Get the public URL from environment (required for callback)
    const publicUrl = process.env.PUBLIC_URL;
    if (!publicUrl) {
      return res.status(500).json(createError(
        ErrorCode.CONFIGURATION_ERROR,
        'PUBLIC_URL environment variable not set'
      ));
    }

    // Use credential_type from request, default to first supported type
    const selectedCredentialType = credential_type || SUPPORTED_CREDENTIAL_TYPES[0];

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
      required_claims: required_claims || ['birth_year'],
      credential_type: selectedCredentialType,
      expires_at: Math.floor((Date.now() + 5 * 60 * 1000) / 1000), // Unix timestamp (5 mins)
    };

    res.json({ session_id, nonce, qr_payload });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json(createError(ErrorCode.DATABASE_ERROR, 'Failed to create session'));
  }
});

// Get session status
app.get('/api/v1/sessions/:id', async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json(createError(ErrorCode.SESSION_NOT_FOUND, 'Session not found or expired'));
    }
    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json(createError(ErrorCode.DATABASE_ERROR, 'Failed to get session'));
  }
});

// Submit proof for a session
app.post('/api/v1/sessions/:id/proof', validateProofSubmission, async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json(createError(ErrorCode.SESSION_NOT_FOUND, 'Session not found or expired'));
    }

    // Check if session is already completed
    if (session.status === 'COMPLETED') {
      return res.status(400).json(createError(ErrorCode.SESSION_ALREADY_COMPLETED, 'Session already completed'));
    }

    // Validate required_claims against proof
    const { required_claims } = session;
    const proof = req.body;

    if (required_claims && Array.isArray(required_claims) && required_claims.length > 0) {
      // Check if proof has the required claims
      const proofAttributes = proof?.attributes || {};
      const missingClaims = required_claims.filter(claim => !proofAttributes.hasOwnProperty(claim));
      
      if (missingClaims.length > 0) {
        return res.status(400).json(createError(
          ErrorCode.MISSING_REQUIRED_CLAIM,
          `Proof is missing required claims: ${missingClaims.join(', ')}`,
          { missingClaims }
        ));
      }
    }

    await updateSession(req.params.id, {
      status: 'COMPLETED',
      proof: proof,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating session with proof:', error);
    res.status(500).json(createError(ErrorCode.DATABASE_ERROR, 'Failed to submit proof'));
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zero Auth Relay running on port ${PORT}`);
  console.log(`Using Supabase for session storage`);
  console.log(`Supported credential types: ${SUPPORTED_CREDENTIAL_TYPES.join(', ')}`);
});
