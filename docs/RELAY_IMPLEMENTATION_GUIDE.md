# Zero-Auth Relay Implementation Guide

This document analyzes the current state of the Zero-Auth Relay (built with Express.js) and details the implementation plan to upgrade it into a production-ready, highly concurrent, and secure broker.

## 1. Analysis of Current Relay

### 1.1 Identified Flaws & Lacking Features
1. **Polling vs. Real-Time (SSE/WebSockets)**: The Relay forces the SDK to poll `GET /api/v1/sessions/:id` every 2 seconds. This scales poorly, causes unnecessary database queries, and introduces latency into the user experience.
2. **Basic Rate Limiting**: The `.use('/api', limiter)` restricts IPs globally to 500 requests per 15 minutes. This is too blunt. Create/Proof endpoints need stricter limits than status-checking endpoints.
3. **Synchronous ZK Verification**: The route `/api/v1/sessions/:id/proof` awaits `verifyProof` synchronously on the main thread. In Node.js, heavy cryptographic operations block the event loop, severely degrading concurrent performance if multiple users verify simultaneously.
4. **Poor State Cleanup**: `setInterval(cleanupExpiredSessions, 60000)` runs locally on the node process. If the Relay scales horizontally (multiple instances), they will all attempt database cleanup concurrently, causing transaction collisions in Supabase.
5. **Brittle Claim Formatting**: The code handling `required_claims` `(claimsArray = JSON.parse(sessionRequiredClaims))` is brittle and relies on catching exceptions to figure out if it was a string or array.

---

## 2. Implementation Guideline

### Phase 1: Real-Time Communication (SSE)
**Goal**: Eliminate HTTP polling by implementing Server-Sent Events (SSE) for seamless validation feedback to the SDK.

1. **New Route: `GET /api/v1/sessions/:id/stream`**:
   - Set headers to `Content-Type: text/event-stream`, `Connection: keep-alive`.
   - When the client connects, add their `res` object to a Map: `const clients = new Map<string, express.Response>();`
2. **Broadcast on Proof Completion**:
   - In `POST /api/v1/sessions/:id/proof`, after `updateSession('COMPLETED')`, locate the client in the `clients` Map.
   - Send `res.write('data: {"status": "COMPLETED"}\n\n')` to instantly notify the SDK, resulting in a 0-latency UI transition on the website.

### Phase 2: Performance & Scalability Enhancements
**Goal**: Allow the Relay to handle thousands of concurrent proofs without dropping connections.

1. **Offload ZK Verification to Worker Threads**:
   - Node.js `worker_threads` should be used for `verifyProof()`.
   - Create a `proof-worker.ts` that takes the `proofData` and `verification_key`.
   - The main Express thread offloads the task and awaits a Promise, keeping the main event loop free to handle incoming SSE connections.
2. **Dedicated Background Workers for Cleanup**:
   - Remove the `setInterval` from the Express API instance.
   - Move `cleanupExpiredSessions` into a separate worker process or use Supabase `pg_cron` jobs to clean up the DB at the database layer instead of the app layer.

### Phase 3: Supporting Multiple Use Cases
**Goal**: Adapt the Relay to handle arbitrary workflows safely.

1. **Dynamic Circuit/Key Loading**:
   - Currently, `loadVerificationKeysFromDb()` loads all keys at startup. 
   - Ensure the database maps `credential_type` AND `use_case` to specific Verification Keys (`vkey`).
   - If a request specifies `useCase: "TRIAL_LICENSE"`, the Relay must instantly fetch and cache the vkey specifically optimized for trial validation, ensuring strict separation of verification logic.
2. **Enhanced Validations**:
   - Standardize `required_claims`. Ensure the database schema strictly types it as `jsonb` array so the Relay never has to try-catch parse strings.

### Phase 4: Security Hardening
1. **Granular Rate Limiting**:
   - `POST /sessions` (Session creation): Max 10 per minute per IP.
   - `POST /sessions/:id/proof` (Proof submission): Max 5 per minute per IP (prevents spamming expensive ZK operations).
   - `GET /sessions/:id/stream` (SSE): Max 5 concurrent connections per IP.
2. **Strict Payload Validation**:
   - Integrate `zod` or `joi` to strictly parse the proof structure before even computing the hash. This prevents memory leaks from maliciously crafted, massive JSON proofs designed to exhaust the JSON parser.

---

## 3. Summary of Refactoring Impact
Upgrading the `zero-auth-relay` to utilize Server-Sent Events and Worker Threads will drastically decrease latency and completely prevent the Node event loop from locking during heavy cryptographic operations. This ensures enterprise-grade reliability.
