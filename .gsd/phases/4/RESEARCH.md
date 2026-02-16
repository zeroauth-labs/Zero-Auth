# RESEARCH: Extended Claims & Identity Verification

## Goal
Expand the capabilities of Zero Auth beyond simple "Age Verification" by adding new ZK-provable claims.

## New Claim Types

### 1. Student Status
- **Business Logic**: Prove the user is a current student without revealing the university name or student ID.
- **Attributes Required**: `is_student` (Boolean), `expiry_year` (Number), `salt`.
- **Circuit Logic**:
  - `signal input isStudent;`
  - `signal input currentYear;`
  - `signal input expiryYear;`
  - Ensure `isStudent == 1`.
  - Ensure `expiryYear >= currentYear`.

### 2. Minor Verification (Age < 18)
- **Business Logic**: Prove the user is under 18 (e.g., for parental consent flows).
- **Circuit Logic**:
  - `signal input birthYear;`
  - `signal input currentYear;`
  - `currentYear - birthYear < 18`.

## Implementation Strategy

### Circuit Management
- We will add `student_check.circom` to the `circuits/` directory.
- For the MVP, we will use a **generic comparison circuit** if possible, but dedicated circuits are safer for gas/size.
- Assets (`.wasm`, `.zkey`) will be bundled in the wallet under `assets/circuits`.

### Multi-Claim Verification
- **SDK Update**: Allow `required_claims` to specify the logic (e.g., `["is_student", "age < 18"]`).
- **Relay Update**: The verifier logic must understand which circuit to use for verification.
- **Wallet Update**: The `generateProof` function needs a mapping of `claim_type` -> `assets`.

## Risks
- **Asset Size**: Adding more `.zkey` files increases the app bundle size. 
  - *Mitigation*: Use smaller circuits or lazy loading from a CDN in production. For MVP, we bundle.
- **Circuit Complexity**: "Student Status" typically requires an issuance signature. 
  - *Clarification*: For Phase 4, we will prove relative to the **local commitment** stored in the wallet (Phase 2).
