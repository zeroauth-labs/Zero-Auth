// ZeroAuth Relay - Error Codes

export enum ErrorCode {
  // Session errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_ALREADY_COMPLETED = 'SESSION_ALREADY_COMPLETED',
  
  // Validation errors
  INVALID_CREDENTIAL_TYPE = 'INVALID_CREDENTIAL_TYPE',
  MISSING_REQUIRED_CLAIM = 'MISSING_REQUIRED_CLAIM',
  INVALID_REQUEST_BODY = 'INVALID_REQUEST_BODY',
  INVALID_CREDENTIAL_TYPE_FORMAT = 'INVALID_CREDENTIAL_TYPE_FORMAT',
  INVALID_CLAIMS_FORMAT = 'INVALID_CLAIMS_FORMAT',
  
  // Proof errors
  INVALID_PROOF = 'INVALID_PROOF',
  PROOF_TOO_LARGE = 'PROOF_TOO_LARGE',
  MISSING_PROOF = 'MISSING_PROOF',
  
  // Server errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export interface ApiError {
  error: string;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export function createError(code: ErrorCode, message: string, details?: Record<string, unknown>): ApiError {
  return {
    error: code,
    code,
    message,
    details,
  };
}

// Supported credential types
export const SUPPORTED_CREDENTIAL_TYPES = [
  'Age Verification',
  'Student ID',
  'Trial',
];

export function isValidCredentialType(type: unknown): boolean {
  return typeof type === 'string' && SUPPORTED_CREDENTIAL_TYPES.includes(type);
}

export function isValidClaims(claims: unknown): claims is string[] {
  return Array.isArray(claims) && claims.every(c => typeof c === 'string');
}
