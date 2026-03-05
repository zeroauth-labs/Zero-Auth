# Zero Auth Data Formats

Single source of truth for JSON payloads exchanged between Wallet, Relay, and SDK.

## Versioning

- `v`: Protocol version for QR payloads. Current: `1`.
- Any breaking change requires a new `v` and a separate parser path.

## QR Payload (Verification Request)

QR codes encode a JSON object with the following shape:

```json
{
  "v": 1,
  "action": "verify",
  "session_id": "uuid",
  "nonce": "uuid",
  "verifier": {
    "name": "Zero Auth Verifier",
    "did": "did:web:example.com",
    "callback": "https://relay.example.com/api/v1/sessions/<session_id>/proof"
  },
  "required_claims": ["birth_year"],
  "credential_type": "Age Verification",
  "expires_at": 1710000000,
  "use_case": "VERIFICATION"
}
```

Rules:

- `action` must be `verify`.
- `required_claims` must be an array of strings (can be empty).
- `expires_at` is a Unix timestamp (seconds).
- `use_case` is optional and must be one of `LOGIN`, `VERIFICATION`, `TRIAL_LICENSE` when present.

## Proof Submission Request

**Endpoint:** `POST /api/v1/sessions/:id/proof`

**Canonical body format** (always wrap under `proof`):

```json
{
  "proof": {
    "pi_a": ["...", "..."],
    "pi_b": [["...", "..."], ["...", "..."]],
    "pi_c": ["...", "..."],
    "protocol": "groth16",
    "curve": "bn128",
    "publicSignals": ["..."]
  }
}
```

Notes:

- The Relay currently accepts both wrapped and unwrapped formats, but all clients should send the wrapped form for consistency.
- All bigint values **must** be encoded as decimal strings.

## ZK Proof Object (Groth16)

The proof object is always a JSON object with Groth16 fields:

```json
{
  "pi_a": ["a0", "a1"],
  "pi_b": [["b00", "b01"], ["b10", "b11"]],
  "pi_c": ["c0", "c1"],
  "protocol": "groth16",
  "curve": "bn128",
  "publicSignals": ["s0", "s1"]
}
```

Accepted shapes:

- `pi_a`: `[string, string]` or `[string, string, "1"]`
- `pi_b`: `[[string, string], [string, string]]` or `[[string, string], [string, string], ["1", "0"]]`
- `pi_c`: `[string, string]` or `[string, string, "1"]`

## Non-ZK Proof Object (Trial)

For `credential_type: "Trial"` the proof payload carries metadata only and uses empty ZK fields:

```json
{
  "credential_type": "Trial",
  "credential_id": "uuid",
  "issuedAt": 1710000000,
  "expiresAt": 1711000000,
  "attributes": { "plan": "trial" },
  "pi_a": [],
  "pi_b": [],
  "pi_c": [],
  "protocol": "trial",
  "curve": "none",
  "publicSignals": []
}
```

## Credential Attributes

All credentials store an `attributes` object with string keys. Expected keys by credential type:

**Age Verification**

- `birth_year` (number) or `year_of_birth` (number)

**Student ID**

- `is_student` (number, usually `1`)
- `university` (string)
- `expiry_year` (number) or `expires_at_year` (number)

General rules:

- Attribute values are stored as `string | number | boolean`.
- Any value committed in circuits must be representable as a bigint string in proofs.

## Public Signals

`publicSignals` is always an array of decimal strings. Its contents are circuit-specific and must remain in the same order used during proof generation.
