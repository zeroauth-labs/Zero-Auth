# Research: Poseidon-Lite Bridge Fix

## Context
Attempt 5 in the previous session failed with `TypeError: poseidon is not a function`. 
We are using `poseidon-lite` for hashing. 

## Findings
`poseidon-lite` (v0.3.0) does NOT export a single `poseidon` function. Instead, it exports named functions based on the number of inputs:
- `poseidon1(inputs, nOuts)`
- `poseidon2(inputs, nOuts)`
- ... up to `poseidon16`

Our bridge code was trying to call `poseidon(inputs)`, which resulted in `undefined`.

## Proposed Fix
Update the WebView bridge logic to select the correct poseidon function dynamically:

```javascript
const poseidonFunc = window[`poseidon${inputs.length}`];
if (!poseidonFunc) throw new Error(`Missing Poseidon function for ${inputs.length} inputs`);
const hash = poseidonFunc(inputs);
```

## Verification Plan
1.  **Direct Execution**: Open the WebView and manually call `window.poseidon2([123, 456])` from the console (or via `injectJavaScript` logs).
2.  **App Flow**: Trigger `POSEIDON_HASH` from the Wallet UI and verify the RESULT is returned.
