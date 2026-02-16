---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Extended Circuits Implementation

## Objective
Implement and prepare the ZK circuits for Student Status and Minor Verification.

## Context
- zero-auth-wallet/circuits/age_check.circom
- zero-auth-wallet/assets/circuits/ (target)

## Tasks

<task type="auto">
  <name>Implement Student Status Circuit</name>
  <files>
    - zero-auth-wallet/circuits/student_check.circom
  </files>
  <action>
    - Create a new Circom circuit that verifies a student status attribute.
    - Inputs: `currentYear`, `expiryYear`, `isStudent`, `salt`, `commitment`.
    - Constraints: `isStudent === 1`, `expiryYear >= currentYear`, `Poseidon(isStudent, expiryYear, salt) === commitment`.
  </action>
  <verify>circom student_check.circom --r1cs --wasm --sym</verify>
  <done>Circuit logic is mathematically sound and compiles to R1CS.</done>
</task>

<task type="auto">
  <name>Generate Circuit Assets</name>
  <files>
    - zero-auth-wallet/assets/circuits/student_check.wasm [NEW]
    - zero-auth-wallet/assets/circuits/student_check_final.zkey [NEW]
  </files>
  <action>
    - Follow the Groth16 setup (Power of Tau) to generate the .zkey.
    - (Note: In this environment, we will use the existing pot12_final.ptau to speed up the process).
    - Move generated assets to the wallet's assets directory.
  </action>
  <verify>ls zero-auth-wallet/assets/circuits/</verify>
  <done>WASM and ZKey assets are ready for mobile injection.</done>
</task>

## Success Criteria
- [ ] Student Status circuit correctly proves University eligibility without revealing details.
- [ ] Assets are small enough for mobile distribution (< 500KB per zkey).
