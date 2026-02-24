import cors from 'cors';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { createSession, getSession, updateSession, cleanupExpiredSessions } from './db.js';
import { validateSessionCreation, validateProofSubmission, validateProofStructure } from './validation.js';
import { ErrorCode, createError, SUPPORTED_CREDENTIAL_TYPES, isValidClaims } from './errors.js';
import { verifyProof, loadVerificationKeysFromDb, isVerificationEnabled, computeProofHash } from './zk.js';

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

    // Use credential_type from request, default to first supported type
    const selectedCredentialType = credential_type || SUPPORTED_CREDENTIAL_TYPES[0];

    // Create session with credential_type
    const session = await createSession(session_id, nonce, verifier_name, required_claims, selectedCredentialType);

    // Get the public URL from environment (required for callback)
    const publicUrl = process.env.PUBLIC_URL;
    if (!publicUrl) {
      return res.status(500).json(createError(
        ErrorCode.CONFIGURATION_ERROR,
        'PUBLIC_URL environment variable not set'
      ));
    }

    // QR Payload Format
    // Use configured DID or derive from public URL
    const relayDid = process.env.RELAY_DID || `did:web:${new URL(publicUrl).hostname}`;
    
    const qr_payload = {
      v: 1,
      action: 'verify',
      session_id,
      nonce,
      verifier: {
        name: verifier_name || 'Zero Auth Verifier',
        did: relayDid,
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
    console.log('Proof submission - session_id:', req.params.id);
    console.log('Proof submission - body:', JSON.stringify(req.body).substring(0, 200));
    
    const session = await getSession(req.params.id);
    console.log('Proof submission - session found:', !!session);
    
    if (!session) {
      return res.status(404).json(createError(ErrorCode.SESSION_NOT_FOUND, 'Session not found or expired'));
    }

    // Check if session is already completed
    if (session.status === 'COMPLETED') {
      return res.status(400).json(createError(ErrorCode.SESSION_ALREADY_COMPLETED, 'Session already completed'));
    }

    // Get proof from request (either wrapped in "proof" key or direct)
    const proof = req.body;
    const proofData = proof?.proof || proof;

    // Proof Replay Protection - check for duplicate proof hash
    const proofHash = computeProofHash(proofData as Record<string, unknown>);
    
    // Check if this proof hash already exists in the session
    if (session.proof_hash && session.proof_hash === proofHash) {
      console.log('[Replay] Duplicate proof detected');
      return res.status(400).json(createError(
        ErrorCode.DUPLICATE_PROOF,
        'This proof has already been submitted'
      ));
    }

    // Validate required_claims against proof
    const sessionRequiredClaims = session.required_claims;

    // Handle required_claims as either array or JSON string from database
    let claimsArray: string[] = [];
    if (sessionRequiredClaims) {
      if (Array.isArray(sessionRequiredClaims)) {
        claimsArray = sessionRequiredClaims as string[];
      } else if (typeof sessionRequiredClaims === 'string') {
        try {
          claimsArray = JSON.parse(sessionRequiredClaims);
        } catch {
          claimsArray = [];
        }
      }
    }

    if (claimsArray.length > 0) {
      // Proof Schema Validation - validate structure before processing
      const schemaResult = validateProofStructure(proofData);
      
      if (!schemaResult.valid) {
        console.log('[Schema] Proof validation failed:', schemaResult.errors);
        return res.status(400).json(createError(
          ErrorCode.INVALID_PROOF_SCHEMA,
          'Invalid proof structure',
          { errors: schemaResult.errors }
        ));
      }
      
      // ZK Proof Verification - cryptographically verify the proof
      // Use the credential_type stored in the session to select the right verification key
      const isValid = await verifyProof(
        proofData as Record<string, unknown>,
        [],
        session.credential_type
      );
      
      if (!isValid) {
        console.log('[ZK] Proof verification failed');
        return res.status(400).json(createError(
          ErrorCode.ZK_VERIFICATION_FAILED,
          'ZK proof verification failed - proof is invalid'
        ));
      }
      
      console.log('ZK proof verified successfully');
    }

    console.log('About to update session...');
    await updateSession(req.params.id, {
      status: 'COMPLETED',
      proof: proofData,
      proof_hash: proofHash,
    });
    console.log('Session updated successfully');

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating session with proof:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json(createError(ErrorCode.DATABASE_ERROR, 'Failed to submit proof: ' + error.message));
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

// Load ZK verification keys from database at startup
async function startServer() {
  try {
    await loadVerificationKeysFromDb();
    const supportedTypes = await import('./zk.js').then(m => m.getSupportedCredentialTypes());
    
    app.listen(PORT, () => {
      console.log(`Zero Auth Relay running on port ${PORT}`);
      console.log(`Using Supabase for session storage`);
      console.log(`Supported credential types: ${SUPPORTED_CREDENTIAL_TYPES.join(', ')}`);
      console.log(`ZK verification: ${supportedTypes.length > 0 ? 'enabled for: ' + supportedTypes.join(', ') : 'disabled (no keys in database)'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
