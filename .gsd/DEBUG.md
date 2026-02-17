# Debug Session: CORS-NGROK-HEADER

## Symptom
User reports `Cross-Origin Request Blocked` when the SDK tries to call the Relay via Ngrok.
Error: `header ‘ngrok-skip-browser-warning’ is not allowed according to header ‘Access-Control-Allow-Headers’`.

## Evidence
- User log shows explicit rejection of `ngrok-skip-browser-warning`.
- `zero-auth-relay/src/index.ts` only has `['Content-Type', 'Authorization', 'bypass-tunnel-reminder']`.

## Resolution
**Root Cause:** Missing `ngrok-skip-browser-warning` in Express CORS config.
**Fix:** Add the header to `allowedHeaders`.
