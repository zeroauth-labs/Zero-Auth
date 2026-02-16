# RESEARCH: WebView-Based ZK Strategy

## Goal
Implement stable, high-performance ZK proof generation in Expo Go by bypassing the Hermes engine's WebAssembly limitations.

## Findings

### 1. Environment Constraints
- **Hermes**: Struggles with binary `ffjavascript` and massive WASM/memory allocations.
- **WebView (Android/iOS)**: Uses system browser engines (V8/JavaScriptCore) which have native WASM support and superior memory management.

### 2. Bridge Communication (postMessage)
- `postMessage` is reliable for the small JSON payloads returned by Groth16 proofs.
- Large binary injection (passing `.zkey` via bridge) can be RAM-intensive but is the most "Expo Go friendly" approach as it avoids local file server complexity.

### 3. Library Compatibility
- `snarkjs` is browser-ready.
- `circomlibjs` (Poseidon) requires fixed-point math and specific field implementations that run natively in the browser but fail in Hermes.

### 4. Performance Targets
- **WebView Startup**: ~500ms - 1s (mitigated by persistent mounting).
- **ZK Generation (Age Check)**: ~1s - 2s.
- **Total Target**: < 5s end-to-end.

## Recommended Approach
- Use `react-native-webview`.
- Create a persistent `ZKEngine` component in `app/_layout.tsx`.
- Inject a self-contained HTML/JS bundle containing minified `snarkjs`.
- Pass `.wasm` and `.zkey` as Base64 blobs from the Expo Asset system into the WebView.
