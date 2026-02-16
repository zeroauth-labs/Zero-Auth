---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: JSON Credential Import

## Objective
Enable users to import credentials via signed JSON/JWT payloads, expanding the wallet's usability beyond simple forms.

## Context
- zero-auth-wallet/app/(tabs)/credentials.tsx
- zero-auth-wallet/store/auth-store.ts

## Tasks

<task type="auto">
  <name>Implement Import Screen</name>
  <files>
    - zero-auth-wallet/app/add-credential/import.tsx
    - zero-auth-wallet/app/add-credential/index.tsx
  </files>
  <action>
    - Create `import.tsx` with a text area for JSON/JWT input.
    - Implement a "Paste from Clipboard" button.
    - Add navigation from the main "Add Credential" hub to the new import screen.
  </action>
  <verify>Navigation to /add-credential/import works</verify>
  <done>Import screen is accessible and takes user input.</done>
</task>

<task type="auto">
  <name>Implement Import Logic</name>
  <files>
    - zero-auth-wallet/app/add-credential/import.tsx
  </files>
  <action>
    - Parse JSON input.
    - Validate required fields (issuer, type, attributes).
    - Trigger the same commitment/salt generation flow as `verify.tsx` (consider refactoring the core logic into a shared hook or utility).
  </action>
  <verify>Import a mock JSON and check if it appears in the list</verify>
  <done>Valid JSON credentials are successfully parsed and stored in the wallet.</done>
</task>

## Success Criteria
- [ ] User can import a valid JSON credential from the clipboard.
- [ ] Imported credentials generate appropriate Poseidon commitments automatically.
