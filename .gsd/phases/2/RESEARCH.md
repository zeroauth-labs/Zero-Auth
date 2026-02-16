# RESEARCH: Credential Schema & Import Flow

## Goal
Enable the wallet to import credentials from external sources (JSON/JWT) and securely store them with salted Poseidon commitments.

## Proposed JSON Schema
To maintain compatibility with the ZK circuits, the imported JSON must contain:
1.  **Metadata**: Issuer name, DID, issuance date.
2.  **Attributes**: Raw values (e.g., `birth_year`, `id_number`).
3.  **Signature**: (For MVP, we might simulate this or use a simple Ed25519 signature).

```json
{
  "issuer": "Government Portal",
  "type": "Age Verification",
  "attributes": {
    "birth_year": 1995,
    "full_name": "Alice Smith"
  },
  "signature": "..."
}
```

## Import Strategy
1.  **Clipboard Import**: Allow users to paste a JSON string.
2.  **QR Import**: (Bonus) Scan a QR code containing the JSON/JWT.
3.  **Verification Flow**: 
    - Validate signature (if present).
    - Generate a unique **Salt** for this credential.
    - Compute **Poseidon Commitments** for all sensitive attributes (e.g., `birth_year`).
    - Store Salt in `SecureStore`.
    - Store Credential + Commitments in `AuthStore`.

## Implementation Tasks (Phase 2)
- Fix `verify.tsx` to use the async ZK Bridge for commitment computation.
- Create `import-credential.tsx` screen.
- Implement JSON parsing and validation logic.
- Update `Credential` type to include more metadata if needed.
