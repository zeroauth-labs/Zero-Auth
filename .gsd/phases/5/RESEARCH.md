# RESEARCH: SDK Refinement & Production Prep

## SDK Polling Strategy
The current SDK uses a simple `setInterval`. While functional, it is not resilient to network instability or server transient downtime.

### Proposed Improvement: Exponential Backoff with Jitter
Instead of fixed intervals, we will implement an exponential backoff strategy:
- **Initial Delay**: 2 seconds.
- **Backoff Factor**: 1.5x.
- **Max Delay**: 10 seconds.
- **Max Retries for Network Errors**: 5.
- **Failures**: If the session ID is not found (404), stop immediately.

## Asset Loading for Expo Go
Recent research confirms that **Bundled Assets** (using `expo-asset`) are the most reliable for snarkjs in React Native.

### Optimization: Lazy Proving Assets
To keep the application responsive, we must ensure WASM/ZKey assets are:
1.  Read only once and cached in memory for the session.
2.  Verified correctly before injection into the WebView.

## Production Prep Checklist

### 1. SDK Error Codes
Standardize error messages returned by `verify()`:
- `ERR_TIMEOUT`: Verification timed out.
- `ERR_REVOKED`: User terminated the session.
- `ERR_EXPIRED`: Session expired on relay.
- `ERR_NETWORK`: Repeated connection failures.

### 2. Relay Security
- Ensure `CORS` is restricted to known verifier domains in production.
- Implement more granular rate limiting for session creation.
