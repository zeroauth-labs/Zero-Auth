# RESEARCH: Session Management & Revocation Protocol

## Goal
Enable real-time revocation of ZK sessions. When a user "terminates" a session in their wallet, the verifier (service) must immediately lose access to the authenticated state.

## Proposed Protocol

### 1. Revocation Request (Wallet -> Relay)
**Endpoint**: `DELETE /api/v1/sessions/:id`
**Authentication**: For MVP, we will use the `id` and a simple signature check if possible (though `session_id` is only known to the wallet and relay at first).
**Action**: Relay marks the session as `REVOKED` in Redis.

### 2. Status Check (SDK -> Relay)
**Endpoint**: `GET /api/v1/sessions/:id`
**Return**: If status is `REVOKED`, the SDK should stop polling and inform the verifier that the session is inactive.

### 3. Redis Lifecycle
- **TTL**: Sessions currently have a 5-minute expiry in memory (need to verify Redis TTL).
- **Cleanup**: Revoked sessions should persist until their original TTL expires to prevent replay, but with a `status: 'REVOKED'`.

## UI Requirements (Wallet)
- **Active Sessions List**: A dedicated tab or section to see who has access right now.
- **Real-time Updates**: Reflecting local termination in the global state.

## Tech Stack
- **Redis**: Used for session persistence in the Relay.
- **Express**: Relay API.
- **Zustand**: Wallet state management.

## Risks
- **Network Failure**: If the wallet terminates locally but fails to notify the relay. 
  - *Mitigation*: Implementation of a retry queue or "Revocation Pending" status.
