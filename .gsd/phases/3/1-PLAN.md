---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Relay Revocation API

## Objective
Implement an endpoint in the Relay to allow sessions to be revoked by their ID, ensuring the verifier is notified of the termination.

## Context
- zero-auth-relay/src/index.ts
- zero-auth-relay/src/lib/redis.ts

## Tasks

<task type="auto">
  <name>Implement Revocation Endpoint</name>
  <files>
    - zero-auth-relay/src/index.ts
  </files>
  <action>
    - Add `DELETE /api/v1/sessions/:id` endpoint.
    - Instead of deleting from Redis immediately, update the session status to `REVOKED`.
    - This ensures any polling clients (SDK) receive a clear 'REVOKED' signal rather than a '404 Not Found'.
  </action>
  <verify>curl -X DELETE http://localhost:3000/api/v1/sessions/{id}</verify>
  <done>Revocation endpoint correctly updates session status in Redis.</done>
</task>

<task type="auto">
  <name>Update Status Retrieval</name>
  <files>
    - zero-auth-relay/src/index.ts
  </files>
  <action>
    - Ensure `GET /api/v1/sessions/:id` returns the full session object including the `REVOKED` status.
  </action>
  <verify>curl http://localhost:3000/api/v1/sessions/{id}</verify>
  <done>Session status is correctly reported as REVOKED after deletion.</done>
</task>

## Success Criteria
- [ ] Relay can mark any active session as REVOKED via API.
- [ ] REVOKED status is persistent in Redis until TTL expiry.
