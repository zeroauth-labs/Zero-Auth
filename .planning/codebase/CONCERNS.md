# Codebase Concerns

**Analysis Date:** 2026-02-21

## Tech Debt

**Revocation registry not implemented:**
- Issue: Revocation checks return "valid" or "unknown" without a registry or cache.
- Files: `zero-auth-wallet/lib/revocation.ts`
- Impact: Revoked credentials appear valid or indeterminate.
- Fix approach: Integrate a registry client and persist cached results in AsyncStorage.

**Relay logic only exists as compiled output:**
- Issue: Relay service source code is not present; only `dist/index.js` is tracked.
- Files: `zero-auth-relay/dist/index.js`
- Impact: Maintenance, debugging, and testing are blocked at source level.
- Fix approach: Track source (e.g., `src/`) and build artifacts separately.

**Large build artifacts and vendor directories tracked in repo:**
- Issue: Generated bundles and vendor dependencies are committed.
- Files: `zero-auth-wallet/dist/metadata.json`, `zero-auth-relay/node_modules/http-errors/index.js`, `node_modules/.package-lock.json`
- Impact: Repository size growth, slow CI, and noisy diffs.
- Fix approach: Remove generated outputs from VCS and rebuild in CI.

**Duplicate circuit assets stored in multiple locations:**
- Issue: Circuit files exist in both assets and circuit folders.
- Files: `zero-auth-wallet/assets/circuits/student_check_final.zkey`, `zero-auth-wallet/circuits/student_check_final.zkey`
- Impact: Mismatch risk between build-time and runtime circuit versions.
- Fix approach: Keep a single canonical circuit directory and reference it consistently.

## Known Bugs

**Raw private key access uses wrong key alias:**
- Symptoms: `getRawPrivateKey` always returns null even when wallet is initialized.
- Files: `zero-auth-wallet/store/wallet-store.ts`, `zero-auth-wallet/lib/wallet.ts`
- Trigger: Call `getRawPrivateKey()` after `generateAndStoreIdentity()`.
- Workaround: Use the same key alias as `PRIVATE_KEY_ALIAS`.

**Revocation warning does not gate proof generation:**
- Symptoms: Proof generation proceeds even after user selects cancel in the warning alert.
- Files: `zero-auth-wallet/app/approve-request.tsx`
- Trigger: Revocation status is `unknown` and user taps Cancel.
- Workaround: Block proof flow until user explicitly confirms.

**Queued offline actions can be dropped silently:**
- Symptoms: Actions are cleared even when handler errors occur.
- Files: `zero-auth-wallet/lib/offline.ts`
- Trigger: `processQueuedActions` throws during handling.
- Workaround: Retry failed actions and only clear successful ones.

## Security Considerations

**Credential import lacks signature verification:**
- Risk: Untrusted JSON credentials can be stored as "verified" without issuer validation.
- Files: `zero-auth-wallet/app/add-credential/import.tsx`
- Current mitigation: Basic structural checks only.
- Recommendations: Require issuer signatures and validate them before storing.

**Proof submission to arbitrary callback URL:**
- Risk: QR payload controls the callback endpoint, enabling data exfiltration.
- Files: `zero-auth-wallet/app/approve-request.tsx`, `zero-auth-wallet/lib/qr-protocol.ts`
- Current mitigation: None.
- Recommendations: Validate callback URLs against an allowlist or a verifier registry.

**QR request parsing bypasses schema validation:**
- Risk: Malformed or expired requests can be processed.
- Files: `zero-auth-wallet/app/approve-request.tsx`, `zero-auth-wallet/lib/qr-protocol.ts`
- Current mitigation: JSON.parse only.
- Recommendations: Enforce `parseVerificationQR` and reject invalid payloads.

**Relay accepts proofs without auth or verification:**
- Risk: Anyone can submit or overwrite proofs for any session ID.
- Files: `zero-auth-relay/dist/index.js`
- Current mitigation: In-memory session store only.
- Recommendations: Add proof verification, auth, and request validation.

**Environment file committed to repo:**
- Risk: Configuration values are tracked in VCS.
- Files: `zero-auth-relay/.env`
- Current mitigation: None.
- Recommendations: Remove `.env` from VCS and document required env vars.

## Performance Bottlenecks

**Large circuit assets loaded and base64 encoded in memory:**
- Problem: `.wasm` and `.zkey` files are read into base64 strings per credential type.
- Files: `zero-auth-wallet/lib/proof.ts`
- Cause: Full file read into memory with per-session cache only.
- Improvement path: Stream or persist assets and avoid repeated encoding.

**ZK engine injects large JS bundles into WebView on load:**
- Problem: Startup latency and memory spikes during injection.
- Files: `zero-auth-wallet/components/ZKEngine.tsx`
- Cause: Inline injection of entire `snarkjs` and `poseidon` bundles.
- Improvement path: Pre-bundle in WebView or load from local files with caching.

**Offline queue polling runs every 5 seconds:**
- Problem: Battery and CPU usage even when idle.
- Files: `zero-auth-wallet/lib/offline.ts`
- Cause: `setInterval`-based queue count updates.
- Improvement path: Update counts on queue mutations or app state changes.

## Fragile Areas

**WebView bridge depends on custom injection timing:**
- Files: `zero-auth-wallet/components/ZKEngine.tsx`
- Why fragile: Execution fails when assets or WebView load ordering changes.
- Safe modification: Keep injection order and status transitions consistent.
- Test coverage: No tests detected for bridge behavior.

**Credential type matching relies on exact string values:**
- Files: `zero-auth-wallet/lib/proof.ts`, `zero-auth-wallet/store/auth-store.ts`
- Why fragile: String mismatches break proof generation.
- Safe modification: Centralize credential type constants and use enums.
- Test coverage: No tests detected for type mapping.

**Proof flow assumes request is valid and present:**
- Files: `zero-auth-wallet/app/approve-request.tsx`
- Why fragile: `request!` is used without schema guard or expiry checks.
- Safe modification: Validate before use and handle nulls explicitly.
- Test coverage: No tests detected for approval flow.

## Scaling Limits

**Relay session storage is in-memory with per-session timeouts:**
- Current capacity: Single process, memory-bound.
- Limit: Sessions are lost on restart and do not scale horizontally.
- Scaling path: Use Redis or database-backed sessions with TTL.

## Dependencies at Risk

**Legacy FileSystem API usage:**
- Risk: Deprecation or behavioral changes in Expo file APIs.
- Impact: Circuit asset loading failures.
- Files: `zero-auth-wallet/lib/proof.ts`, `zero-auth-wallet/components/ZKEngine.tsx`
- Migration plan: Migrate to `expo-file-system` non-legacy APIs.

## Missing Critical Features

**Revocation registry integration:**
- Problem: No authoritative revocation check.
- Blocks: Reliable credential validity enforcement.
- Files: `zero-auth-wallet/lib/revocation.ts`

**Proof verification at relay:**
- Problem: Proofs are stored without cryptographic verification.
- Blocks: Trust in the relay as a verification endpoint.
- Files: `zero-auth-relay/dist/index.js`

**Issuer signature verification on credentials:**
- Problem: Credentials are accepted without issuer proof.
- Blocks: Trust model for imported or demo credentials.
- Files: `zero-auth-wallet/app/add-credential/import.tsx`, `zero-auth-wallet/app/add-credential/verify.tsx`

## Test Coverage Gaps

**No automated tests detected:**
- What's not tested: Wallet state, proof generation, QR parsing, relay endpoints.
- Files: `zero-auth-wallet/lib/proof.ts`, `zero-auth-wallet/lib/qr-protocol.ts`, `zero-auth-wallet/store/auth-store.ts`, `zero-auth-relay/dist/index.js`
- Risk: Regressions in core flows go unnoticed.
- Priority: High

---

*Concerns audit: 2026-02-21*
