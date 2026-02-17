---
phase: 8
plan: 1
wave: 1
---

# Plan 8.1: Relay Refactoring

## Objective
Decouple the Relay's monolithic `index.ts` into a clean, service-oriented architecture. This improves maintainability and makes debugging network issues easier.

## Context
- .gsd/ARCHITECTURE.md
- zero-auth-relay/src/index.ts

## Tasks

<task type="auto">
  <name>Extract Network Utilities</name>
  <files>zero-auth-relay/src/lib/network.ts</files>
  <action>
    Create `src/lib/network.ts`.
    Move `getLanIp` function here.
    Add `resolveCallbackUrl(req, sessionId)` helper that handles the `PUBLIC_URL` vs `localhost` logic (including the ngrok/tunnel checks).
  </action>
  <verify>grep "getLanIp" zero-auth-relay/src/lib/network.ts</verify>
  <done>Network logic is isolated and reusable.</done>
</task>

<task type="auto">
  <name>Extract Session Service</name>
  <files>zero-auth-relay/src/services/session.service.ts</files>
  <action>
    Create `src/services/session.service.ts`.
    Move all Session creation, retrieval, proof verification, and revocation logic here.
    It should interact with `SessionStore` (Redis) and `verifyProof` (ZK).
    The API handlers in `index.ts` should just call this service.
  </action>
  <verify>grep "class SessionService" zero-auth-relay/src/services/session.service.ts</verify>
  <done>Business logic is separated from HTTP transport layer.</done>
</task>

<task type="auto">
  <name>Clean Main Entry Point</name>
  <files>zero-auth-relay/src/index.ts</files>
  <action>
    Refactor `index.ts` to be a thin HTTP layer.
    Use `SessionService` for all logic.
    Use `resolveCallbackUrl` from `network.ts`.
    Keep the CORS configuration and global logger.
  </action>
  <verify>grep "SessionService.create" zero-auth-relay/src/index.ts</verify>
  <done>index.ts is under 100 lines and readable.</done>
</task>

## Success Criteria
- [ ] Relay starts successfully (`npm run dev:relay`).
- [ ] Session creation works via curl/Postman.
- [ ] IP resolution logic is centralized.
