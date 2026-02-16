---
phase: 3
plan: 2
wave: 2
---

# Plan 3.2: Wallet Session Dashboard

## Objective
Create a user interface for managing active sessions and integrate the revocation call to the Relay.

## Context
- zero-auth-wallet/app/(tabs)/history.tsx (or new screen)
- zero-auth-wallet/store/auth-store.ts

## Tasks

<task type="auto">
  <name>Build Session List UI</name>
  <files>
    - zero-auth-wallet/app/(tabs)/history.tsx
  </files>
  <action>
    - Refactor 'History' tab to show 'Active Sessions' and 'Past Connections'.
    - Categorize sessions from `auth-store`.
  </action>
  <verify>Visual check in Expo Go</verify>
  <done>Active sessions are clearly listed with service names and timestamps.</done>
</task>

<task type="auto">
  <name>Integrate Remote Revocation</name>
  <files>
    - zero-auth-wallet/store/auth-store.ts
  </files>
  <action>
    - Update `terminateSession` action to call the Relay's `DELETE` endpoint.
    - Use a try-catch block to ensure local termination succeeds even if network fails (log warning for network failure).
  </action>
  <verify>Terminate a session and check Relay logs/Redis</verify>
  <done>Terminating a session in the wallet also marks it as REVOKED on the Relay.</done>
</task>

## Success Criteria
- [ ] User can see all active services with access.
- [ ] Tapping 'Revoke' immediately ends the session locally and remotely.
