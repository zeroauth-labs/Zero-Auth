# Debug Session: ZK-Timeout-002

## Symptom
`[Error: ZK Request Timed Out]` persists.
Logs show `postMessage` is called, but WebView never logs "Received Message".
Suspect the large HTML string (containing 1.3MB snarkjs) is failing to parse or load correctly in the Android WebView, causing the bridge listeners to be unresponsive or the WebView to be in a broken state, even if it logs "Ready".

## Hypotheses
1.  **H1 (High)**: **HTML String Size Limit**. Injecting 2MB of code directly into the `html` prop string might be truncating or crashing the WebView's document loader on Android.
2.  **H2**: Timing race condition where the message is sent before the listener is active (unlikely given "Ready" log).

## Attempts

### Attempt 4
**Action:** Refactor `ZKEngine.tsx` to use `injectJavaScript` for asset loading instead of template literals.
1.  Load WebView with empty skeleton.
2.  On `onLoad`, sequentially inject `snarkjs` and `poseidon` via `injectJavaScript`.
3.  Inject the bridge logic.
4.  Signal Ready.

**Result:** TBD
