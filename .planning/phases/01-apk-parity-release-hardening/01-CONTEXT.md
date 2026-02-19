# Phase 1: APK Parity + Release Hardening - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert wallet from Expo Go to a functional Android APK with feature parity — all existing flows must work in the APK. This includes credential add/revoke, proof generation, QR scan/display, DID+ed25519 keypair, verification steps, revocation checks, and offline behavior.

</domain>

<decisions>
## Implementation Decisions

### Build Approach
- Refactor existing wallet code to work with EAS build (not write from scratch)
- Keep existing wallet logic, adapt for native Android build
- Use EAS dev client workflow for development builds

### Testing Strategy
- Manual USB debugging with physical device
- No automated parity testing scripts needed
- Developer will test on connected device

### Offline Behavior
- Credential viewing works offline
- Actions (add/revoke) are queued when offline, executed when back online
- Revocation status may show cached state when offline

### Release Signing
- Use debug keystore for development builds
- Keystore approach: OpenCode's discretion for production signing later

### OpenCode's Discretion
- Exact build pipeline configuration (EAS project setup)
- Specific native module integration approach
- Error handling details for QR scanning and proof generation
- UI adaptation for APK-specific behaviors

</decisions>

<specifics>
## Specific Ideas

- "All stuff which is in the wallet, I want it rewritten/converted to make an EAS build" — means refactor existing, not rewrite from scratch
- User will connect phone via USB for testing

</specifics>

<deferred>
## Deferred Ideas

- Phase 2 Keystore integration (will be discussed in Phase 2)
- Phase 3 SDK improvements (will be discussed in Phase 3)

</deferred>

---

*Phase: 01-apk-parity-release-hardening*
*Context gathered: 2026-02-19*
