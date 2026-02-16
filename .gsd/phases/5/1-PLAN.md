---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: SDK Resilience & Polling

## Objective
Implement a robust polling mechanism with exponential backoff and better error handling in the Zero Auth SDK.

## Context
- zero-auth-sdk/src/index.ts

## Tasks

<task type="auto">
  <name>Refactor Polling Logic</name>
  <files>
    - zero-auth-sdk/src/index.ts
  </files>
  <action>
    - Replace `setInterval` with a recursive `setTimeout` based polling function.
    - Implement exponential backoff (initial: 2s, factor: 1.5, max: 10s).
    - Add a retry counter for transient network errors (max 5).
    - Return standardized error objects (`{ success: false, error, code }`).
  </action>
  <verify>Manual verification with simulated network failures</verify>
  <done>SDK handles network hiccups gracefully and respects timeouts accurately.</done>
</task>

<task type="auto">
  <name>Add Cancellation Support</name>
  <files>
    - zero-auth-sdk/src/index.ts
  </files>
  <action>
    - Update the `verify` method signature or return value to allow cancelling the poll from the calling application.
  </action>
  <verify>Test cancellation by calling .cancel() during a verification flow</verify>
  <done>Verifiers can stop the SDK from polling if the user navigates away or cancels.</done>
</task>

## Success Criteria
- [ ] SDK polling logic uses exponential backoff.
- [ ] Transient network errors do not cause immediate failure.
- [ ] Cancellation is supported and clean.
