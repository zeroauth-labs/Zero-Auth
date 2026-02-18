# Codebase Concerns

**Analysis Date:** 2026-02-18

## Tech Debt

**Wallet `My Zero ID` view is a placeholder.**
- Issue: `zero-auth-wallet/app/my-qr.tsx` just renders a static QR icon and text with a comment saying the real session handling will be added later.
- Files: `zero-auth-wallet/app/my-qr.tsx`
- Impact: There is no way for users to export their DID or expose a live QR to verifiers, so the wallet cannot actually prove its identity in-app.
- Fix approach: Hook this screen up to the wallet store / relay session data (derive the DID + relay callback, render a real QR, trigger share actions) so the “My Zero ID” flow becomes functional.

**SDK basic example hard-codes an ephemeral ngrok relay.**
- Issue: `zero-auth-sdk/examples/basic/src/main.ts` pins `RELAY_URL` to `https://corrie-overluscious-nonderogatorily.ngrok-free.dev` (line 5).
- Files: `zero-auth-sdk/examples/basic/src/main.ts`
- Impact: As soon as that ngrok tunnel expires the example can’t reach the relay, so onboarding materials break and demos fail for new contributors.
- Fix approach: Parameterize the relay host via an env var or CLI flag and default to a locally running relay (or documented placeholder) instead of baking a throwaway tunnel URL.

## Known Bugs

**`ZeroAuth.verify` never exposes the cancel handler.**
- Issue: In `zero-auth-sdk/src/index.ts` the cancel callback is assigned to the resolver (`(resolve as any).cancel = cancel`) rather than the promise object that is returned.
- Files: `zero-auth-sdk/src/index.ts`
- Impact: Consumers can’t stop polling even when they navigate away, so the verification request continues running until the timeout elapses.
- Fix approach: Capture the promise in a variable (e.g., `const promise = new Promise(...); promise.cancel = cancel; return promise;`) so the returned object carries the cancel handler.

**Secret key backup flow always fails.**
- Issue: `zero-auth-wallet/app/(tabs)/settings.tsx` calls `useWalletStore.getState().getRawPrivateKey()`, but `getRawPrivateKey` reads `expo-secure-store` key `'privateKey'` while `generateAndStoreIdentity()` stores the secret under `'zero_auth_sk'`.
- Files: `zero-auth-wallet/app/(tabs)/settings.tsx`, `zero-auth-wallet/lib/wallet.ts`
- Impact: The “Backup Identity” button shows “Could not retrieve key” every time and the secret can never be exported.
- Fix approach: Export the shared alias constant from `lib/wallet.ts` or add an accessor that reads from `'zero_auth_sk'` so the backup dialog can actually load the stored private key.

## Security Considerations

**Relay callback URL comes from an attacker-controlled Host header.**
- Issue: `zero-auth-relay/src/lib/network.ts` uses `req.get('host')` (or `PUBLIC_URL`) to build the callback URL that ends up inside the QR payload, with no allow-listing or validation.
- Files: `zero-auth-relay/src/lib/network.ts`
- Impact: A malicious client can forge a Host header (or set `PUBLIC_URL`) and trick the wallet into posting ZK proofs to any domain, exfiltrating sensitive proof data.
- Fix approach: Pin the callback host in configuration, validate that incoming Host headers/SNI match the trusted relay domain, or cryptographically bind sessions so wallets reject mismatched callbacks.

**Wallet posts proofs to whatever callback the QR specifies.**
- Issue: `zero-auth-wallet/app/approve-request.tsx` sends the proof payload to `request.verifier.callback` blindly (lines 64-82), without verifying the domain or TLS status of that URL.
- Files: `zero-auth-wallet/app/approve-request.tsx`
- Impact: A crafted QR can point `verifier.callback` at an attacker-controlled HTTP endpoint, enabling theft of proofs and metadata that should remain private.
- Fix approach: Restrict callbacks to known relay hosts (or require user consent for unknown domains), verify the `verifier.did` before posting, and enforce TLS so proofs always travel over trusted channels.

## Performance Bottlenecks

**Injecting SnarkJS/Poseidon via large script strings slows startup.**
- Issue: `zero-auth-wallet/components/ZKEngine.tsx` downloads the entire `snarkjs` and `poseidon` bundles, reads them as strings, and injects them through multiple `webView.injectJavaScript` calls every time the WebView becomes ready.
- Files: `zero-auth-wallet/components/ZKEngine.tsx`
- Impact: Cold start has to parse megabytes of JS via string injection, causing jank on low-end devices and repeated work whenever the component re-initializes.
- Fix approach: Ship a dedicated HTML/JS bundle shipped with the app (or hosted file) and point the WebView to it so the heavy scripts load only once instead of re-injecting via template literals.

## Fragile Areas

**Manual script injection and polyfills in the ZK bridge are brittle.**
- Issue: The same `ZKEngine` component builds the bridge by concatenating inline strings, polyfilling globals, and manually reposting log messages (lines 23-234) rather than using a static script file.
- Files: `zero-auth-wallet/components/ZKEngine.tsx`
- Impact: Any change to SnarkJS, Poseidon, or the bridge logic requires editing fragile template literals, and a single missing quote can leave the WebView dead with no compile-time checks.
- Fix approach: Move the injected logic into a dedicated static JS file or WebView-based HTML page and load it via `source`/URI, which gives syntax checking and keeps the native code from reassembling huge strings.

## Scaling Limits

**Not detected.**
- Issue: Not detected
- Files: Not detected
- Impact: Not detected
- Fix approach: Not detected

## Dependencies at Risk

**Not detected.**
- Issue: Not detected
- Files: Not detected
- Impact: Not detected
- Fix approach: Not detected

## Missing Critical Features

**Not detected.**
- Issue: Not detected
- Files: Not detected
- Impact: Not detected
- Fix approach: Not detected

## Test Coverage Gaps

**No automated tests or coverage are configured.**
- Issue: None of the manifest files (`package.json`, `zero-auth-relay/package.json`, `zero-auth-sdk/package.json`, `zero-auth-wallet/package.json`) expose any `test` script or reference a test runner/framework.
- Files: `package.json`, `zero-auth-relay/package.json`, `zero-auth-sdk/package.json`, `zero-auth-wallet/package.json`
- Impact: Every change is deployed without automated verification, which makes regressions in relay, wallet, or SDK flows easy to miss.
- Fix approach: Add at least a smoke test suite (e.g., Vitest/Jest) per package and wire up a root `test` command or CI job that runs them before release.

---

*Concerns audit: 2026-02-18*
