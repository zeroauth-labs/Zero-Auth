---
phase: 4
plan: 3
wave: 3
---

# Plan 4.3: Relay & SDK Multi-Claim Support

## Objective
Enable Verifiers to request specific claims via the SDK and update the Relay to verify them correctly.

## Context
- zero-auth-sdk/src/index.ts
- zero-auth-relay/src/index.ts
- zero-auth-relay/src/lib/verifier.ts

## Tasks

<task type="auto">
  <name>Expand SDK Request Options</name>
  <files>
    - zero-auth-sdk/src/index.ts
  </files>
  <action>
    - Update `VerifyOptions` to allow selecting specific circuits or credential types.
    - Ensure the QR payload includes the `credential_type` and `required_claims`.
  </action>
  <verify>SDK generation of QR payload with 'Student ID' type</verify>
  <done>SDK supports requesting different types of ZK verifications.</done>
</task>

<task type="auto">
  <name>Add Multi-Circuit Verification in Relay</name>
  <files>
    - zero-auth-relay/src/lib/verifier.ts
  </files>
  <action>
    - Update the `verifyProof` function to load the correct verification keys for each circuit.
    - Implement a mapping of `circuit_id` -> `vkey`.
  </action>
  <verify>Relay test with manual proof submission</verify>
  <done>Relay correctly validates proofs for multiple different circuits.</done>
</task>

## Success Criteria
- [ ] Relay can verify both Age and Student proofs.
- [ ] SDK can initiate specific verification flows via the `type` parameter.
