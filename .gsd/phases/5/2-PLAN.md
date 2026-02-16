---
phase: 5
plan: 2
wave: 2
---

# Plan 5.2: Asset Optimization & Relay Hardening

## Objective
Optimize asset loading in the wallet and improve relay security for production.

## Context
- zero-auth-wallet/lib/proof.ts
- zero-auth-relay/src/index.ts

## Tasks

<task type="auto">
  <name>Optimize Wallet Asset Loading</name>
  <files>
    - zero-auth-wallet/lib/proof.ts
  </files>
  <action>
    - Implement a simple cache for Base64-encoded assets in `proof.ts` to avoid re-reading files from disk for every proof generation in the same session.
    - Add explicit logging/tracing for asset load times to aid in debugging performance issues.
  </action>
  <verify>Check logs for "Asset Loaded from Cache" messages on second proof generation</verify>
  <done>Assets are cached in memory after the first load, reducing subsequent proof generation latency.</done>
</task>

<task type="auto">
  <name>Relay Production Prep</name>
  <files>
    - zero-auth-relay/src/index.ts
    - zero-auth-relay/src/config.ts
  </files>
  <action>
    - Review and tighten CORS configuration.
    - Implement a "Cleanup" scheduled task (or simple interval) to remove EXPIRED or REVOKED sessions from Redis after a certain grace period (e.g., 1 hour).
  </action>
  <verify>Manually verify session cleanup logic by setting a short expiry</verify>
  <done>Relay is more secure and manages Redis memory more efficiently by cleaning up old sessions.</done>
</task>

## Success Criteria
- [ ] Wallet proof generation is faster on subsequent attempts.
- [ ] Relay automatically cleans up stale session data.
- [ ] Production-ready configurations are in place.
