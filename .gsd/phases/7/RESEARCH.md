# Research: ZK Generation Overhaul

## Problem Statement
The current ZK proof generation pipeline is fragile. It suffers from:
1.  **Asset Loading Instability**: Reliance on `Expo Asset` and `FileSystem` with Metro bunlding quirks has caused crashes (e.g. `Blob` polyfill issues, `require` executing code).
2.  **Untyped Bridge**: Communication between React Native and the WebView is unstructured (`any` types), leading to hard-to-debug failures.
3.  **No Feedback Loop**: The user sees a "Processing" spinner but has no insight into the 20-30s process. If a step hangs, there's no timeout or retry mechanism other than a blunt 20s timeout.
4.  **Memory Pressure**: Loading large WASM/zkey files as Base64 strings in JS memory before injecting them into the WebView is inefficient and prone to OOM on low-end devices.

## Proposed Architecture: v2 ZK Engine

### 1. Robust Asset Delivery
Instead of reading assets as Base64 strings in the RN thread and injecting them, we should:
*   **Serve Assets via Local Web Server**: Use `expo-file-system` to serve the `html` and assets (wasm, zkey) from a local directory. The WebView can then fetch them via `fetch('file://...')` or a local server port if needed.
    *   *Constraint*: WebView on Android/iOS has strict file access policies.
    *   *Alternative*: Keep the injection but optimize it. Chunking?
    *   *Better*: Unstructure the assets. The `snarkjs` and `poseidon` scripts are small. The `zkey` is large.
    *   *Optimized Loading*: The `zkey` should be loaded *inside* the WebView context directly if possible, or streamed. Since "file://" access is tricky in RN WebViews, the injection method is robust *if* the memory holds.
    *   *Refinement*: We stayed with injection for v1. For v2, let's strictly type the injection and verify md5/integrity.

### 2. Type-Safe Bridge Protocol
Define a strict JSON-RPC style protocol for the bridge.

```typescript
type BridgeRequest =
  | { method: 'INIT'; payload: { assets: AssetMap } }
  | { method: 'PROVE'; payload: ProofInput }
  | { method: 'PING' };

type BridgeResponse =
  | { id: string; result: any }
  | { id: string; error: string }
  | { id: string; event: 'LOG' | 'PROGRESS'; payload: any };
```

### 3. ZK Web Worker Pattern
Move the heavy `snarkjs` computation into a Web Worker *inside* the WebView (if supported by the WebView implementation on mobile) or just ensure it doesn't block the WebView's main thread (which might block the RN bridge communication).
*Actually, WebView JS thread is separate from RN JS thread. But blocking WebView JS stops it from receiving messages.*
*Mitigation*: Use `setTimeout` or `yield` inside the heavy loop if possible (hard with `snarkjs` internals), or accept the lock and rely on the native timeout.

### 4. Direct Bundle Loading (The Fix We Just Did)
We moved to `.bundle` files. This is good. We should formalize it.
*   **Action**: Ensure `metro.config.js` is documented and committed.
*   **Action**: Create a `scripts/bundle-zk.js` helper to automate the `esbuild` process for `poseidon` and `snarkjs`.

## Execution Plan

1.  **Harden the Bridge**: Rewrite `ZKEngine.tsx` to use a state machine (Idle -> Loading Assets -> Ready -> Proving -> Done).
2.  **Progress Events**: Patch the `html` script to emit progress events if `snarkjs` supports it (it has a logger). Hook into `snarkjs` logger to send events back to RN.
3.  **Asset Integrity**: Hash the assets on startup to ensure they aren't corrupted (partial downloads).
4.  **Fail-Fast**: Check for `global.BigInt` and `global.crypto` availability in the WebView immediately on load.

## Conclusion
We don't need a native module overhaul yet (Phase 8). We can fix the stability by treating the WebView as a robust microservice with a typed API and better state management.
