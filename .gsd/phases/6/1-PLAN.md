---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: E2E Workflow Orchestration

## Objective
Enable a single-command developer experience to run the entire Zero Auth ecosystem for testing.

## Context
- root directory
- zero-auth-relay/
- zero-auth-sdk/examples/basic/
- zero-auth-wallet/

## Tasks

<task type="auto">
  <name>Initialize Root Workspace</name>
  <files>
    - [NEW] package.json
  </files>
  <action>
    - Create a root-level `package.json` if it doesn't exist.
    - Install `concurrently` and `wait-on` as dev dependencies.
    - Add a `dev:all` script that starts:
      1. Relay (npm run dev)
      2. SDK Example (vite or serve)
      3. Wallet (npx expo start)
  </action>
  <verify>Run `npm run dev:all` and ensure processes start</verify>
  <done>Full ecosystem can be started with one command.</done>
</task>

<task type="auto">
  <name>Create E2E Testing Guide</name>
  <files>
    - [NEW] TESTING.md
  </files>
  <action>
    - Document the step-by-step "Golden Path" for testing:
      1. Run `npm run dev:all`.
      2. Import test credentials in Wallet.
      3. Open SDK Demo in browser.
      4. Scan QR and verify.
  </action>
  <verify>Follow the guide personally to ensure it works</verify>
  <done>User has a clear manual for testing the product.</done>
</task>

## Success Criteria
- [ ] Root script `npm run dev:all` works.
- [ ] TESTING.md provides a clear workflow.
