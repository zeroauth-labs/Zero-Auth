# RESEARCH: Phase 6 — Production UX & E2E Testing

## E2E Workflow Orchestration
To enable seamless testing of the full product, we need to run three distinct environments simultaneously:
1.  **Relay**: Handles sessions and ZK verification.
2.  **SDK Example**: A web server hosting the demo.
3.  **Wallet**: Local Expo environment.

### Tooling: `concurrently`
We can use the `concurrently` npm package to start all three from the root directory. This avoids the need for 3 terminal tabs.

## Biometric Enrollment
Best practices for Expo:
- Use `expo-local-authentication`.
- Check `hasHardwareAsync()` and `isEnrolledAsync()` before prompting.
- Fallback to device PIN if biometrics fail or are not available.
- **Workflow**: Initial "Security Setup" screen after the first credential import.

## Mock Data Generator
To make testing easier, we will add a "Developer Mode" or "Demo" button in the wallet that imports a set of standard credentials (Age, Student ID) with pre-defined salts.
