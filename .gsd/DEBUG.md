# Debug Session: ZK-Timeout-002

## Symptom
`[Error: ZK Request Timed Out]` persists.
Logs show `postMessage` is called, but WebView never logs "Received Message".
Suspect the large HTML string (containing 1.3MB snarkjs) is failing to parse or load correctly in the Android WebView, causing the bridge listeners to be unresponsive or the WebView to be in a broken state, even if it logs "Ready".

## Hypotheses
1.  **H1 (High)**: **HTML String Size Limit**. Injecting 2MB of code directly into the `html` prop string might be truncating or crashing the WebView's document loader on Android.
2.  **H2**: Timing race condition where the message is sent before the listener is active (unlikely given "Ready" log).

## Attempts

### Attempt 5
**Action:** Replace `postMessage` (RN -> WebView) with a direct `injectJavaScript` call targeting a global bridge function. 
**Result:** Log-verified successful injection ("Ready (v5)"), but failed with `TypeError: poseidon is not a function`.
**Conclusion:** FAILED. Issue with library export format or scope.

### Pivot
**Action:** Created `demo-mock` branch with a pure JavaScript mock of the ZK Engine.
**Goal:** Ensure 100% stable UI flow for the upcoming demo while debugging the core library issues in separate sessions.
### Attempt 6 (Current on `main`)
**Action:** 
1.  Dynamic Poseidon Mapping: Use `window.poseidon['poseidon' + inputs.length]` in Bridge v6.
2.  Synchronization: Use `useEffect` hook to trigger injection as soon as BOTH assets are loaded and WebView is mounted.
3.  Logging: Detailed "Fully Ready (v6)" status check.
**Result:** TBD
