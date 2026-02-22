// ZeroAuth Relay - Request Validation

import { Request, Response, NextFunction } from 'express';
import { isValidCredentialType, isValidClaims, ErrorCode, createError } from './errors.js';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateSessionCreation(req: Request, res: Response, next: NextFunction) {
  const errors: ValidationError[] = [];
  
  // Validate credential_type
  const { credential_type, required_claims, verifier_name } = req.body;
  
  if (credential_type !== undefined) {
    if (!isValidCredentialType(credential_type)) {
      errors.push({
        field: 'credential_type',
        message: `Invalid credential type. Supported: Age Verification, Student ID, Trial`,
      });
    }
  }
  
  // Validate required_claims
  if (required_claims !== undefined) {
    if (!isValidClaims(required_claims)) {
      errors.push({
        field: 'required_claims',
        message: 'required_claims must be an array of strings',
      });
    }
  }
  
  // Validate verifier_name if provided
  if (verifier_name !== undefined && typeof verifier_name !== 'string') {
    errors.push({
      field: 'verifier_name',
      message: 'verifier_name must be a string',
    });
  }
  
  if (errors.length > 0) {
    return res.status(400).json(createError(
      ErrorCode.INVALID_REQUEST_BODY,
      'Invalid request body',
      { errors }
    ));
  }
  
  next();
}

export function validateProofSubmission(req: Request, res: Response, next: NextFunction) {
  const errors: ValidationError[] = [];
  
  // Accept either {"proof": {...}} or directly {...}
  const body = req.body;
  const proof = body?.proof || body;
  
  if (proof === undefined) {
    errors.push({
      field: 'proof',
      message: 'Proof is required',
    });
  }
  
  // Check proof size (max 1MB) - handle undefined proof
  const proofSize = JSON.stringify(proof || {}).length;
  const MAX_PROOF_SIZE = 1024 * 1024; // 1MB
  
  if (proofSize > MAX_PROOF_SIZE) {
    return res.status(413).json(createError(
      ErrorCode.PROOF_TOO_LARGE,
      `Proof payload exceeds maximum size of ${MAX_PROOF_SIZE} bytes`
    ));
  }
  
  if (errors.length > 0) {
    return res.status(400).json(createError(
      ErrorCode.INVALID_REQUEST_BODY,
      'Invalid request body',
      { errors }
    ));
  }
  
  next();
}
