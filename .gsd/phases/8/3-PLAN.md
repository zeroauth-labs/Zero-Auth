---
phase: 8
plan: 3
wave: 2
---

# Plan 8.3: End-to-End Verification (Ngrok)

## Objective
Verify the complete flow using a real `ngrok` tunnel to ensure physical device connectivity.

## Tasks

<task type="checkpoint:human-verify">
  <name>Start Ngrok Tunnel</name>
  <files>zero-auth-relay/.env</files>
  <action>
    User needs to start ngrok: `ngrok http 3000`.
    Copy the forwarding URL (e.g., `https://xxxx.ngrok-free.app`).
    Update `zero-auth-relay/.env`: `PUBLIC_URL=https://xxxx.ngrok-free.app`.
    Update `zero-auth-sdk/examples/basic/src/main.ts`: `RELAY_URL = ...`.
  </action>
  <verify>Manual confirmation</verify>
  <done>Tunnel is running and config is updated.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Execute Verification Flow</name>
  <files>app.json</files>
  <action>
    1. Restart Relay (`npm run dev:relay` or `dev:all`).
    2. Refresh SDK Page (Laptop).
    3. Scan with Physical Wallet (Phone).
    4. Approve.
    5. Verify Success on Website.
  </action>
  <verify>Successful "Verified" state on website.</verify>
  <done>End-to-End flow works over real internet.</done>
</task>

## Success Criteria
- [ ] Proof submitted successfully via Ngrok.
- [ ] No "Network Request Failed" errors.
