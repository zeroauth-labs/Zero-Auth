# REQUIREMENTS.md

## Functional Requirements
| ID | Requirement | Source | Status |
|----|-------------|--------|--------|
| REQ-01 | Wallet must initialize Poseidon hashing stably in Hermes | Goal 3 | Pending |
| REQ-02 | Wallet must import credentials from a signed JSON/JWT | Issuance | Pending |
| REQ-03 | Wallet must scan SDK-generated QR codes | Goal 2 | Pending |
| REQ-04 | Wallet must generate Groth16 proofs for Age (>18/ <18) | Goal 4 | Pending |
| REQ-05 | Wallet must generate Groth16 proofs for Student Status | Goal 4 | Pending |
| REQ-06 | Wallet must display a list of active sessions | Goal 5 | Pending |
| REQ-07 | Wallet must allow revoking an active session | Goal 5 | Pending |
| REQ-08 | SDK must generate session-based QR codes via Relay | Goal 2 | Pending |
| REQ-09 | Relay must verify proofs and store session state in Redis | Goal 1 | Pending |

## Technical Requirements
| ID | Requirement | Source | Status |
|----|-------------|--------|--------|
| TECH-01 | Use `snarkjs` and `circomlibjs` for cryptography | Strategy | Pending |
| TECH-02 | Transition to Custom Dev Client for native ZK performance | Strategy | Pending |
| TECH-03 | Maintain stateless Relay API (session data in Redis only) | Strategy | Pending |
