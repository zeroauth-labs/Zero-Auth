---
phase: 6
plan: 2
wave: 2
---

# Plan 6.2: Production UX & Biometrics

## Objective
Harden the wallet's user experience with biometric enrollment and easy demo data.

## Context
- zero-auth-wallet/app/
- zero-auth-wallet/store/auth-store.ts

## Tasks

<task type="auto">
  <name>Implement Demo Data Generator</name>
  <files>
    - zero-auth-wallet/app/(tabs)/index.tsx
    - zero-auth-wallet/store/auth-store.ts
  </files>
  <action>
    - Add a "Seed Demo Data" button in the Dashboard (visible only if no credentials).
    - Function should populate `auth-store` with:
      - 1x Identity Credential (Age 25, Country US)
      - 1x Student Credential (University X, Exp 2027)
    - Generate and persist secure salts for each immediately.
  </action>
  <verify>Pressing button populates vault and persists salts</verify>
  <done>Testers can start verification flows in < 5 seconds.</done>
</task>

<task type="auto">
  <name>Biometric Security Settings</name>
  <files>
    - [NEW] zero-auth-wallet/app/settings.tsx
    - zero-auth-wallet/store/auth-store.ts
  </files>
  <action>
    - Create a settings screen to toggle Biometric Gating.
    - Default to enabled if hardware is present.
    - Persist this preference in `auth-store`.
  </action>
  <verify>Toggling setting changes behavior in `approve-request.tsx`</verify>
  <done>Users have control over biometric security layers.</done>
</task>

## Success Criteria
- [ ] One-click demo data generation works.
- [ ] Biometric toggle is functional.
