# Debug Session: Ecosystem Failures

## Resolution

**Root Cause 1:** `REDIS_URL` defaulted to port 6374 which is non-standard and likely not what's running.
**Fix 1:** Updated `zero-auth-relay/src/config.ts` to use port 6379.

**Root Cause 2 (Suspected):** Expo Go network/cache mismatch. The `IOException` suggests the app cannot reach the Metro bundler or is trying to fetch a stale update.
**Troubleshooting 2:**
1. Clear Expo Go cache.
2. Use `npx expo start --tunnel` if LAN fails.
3. Ensure phone and PC are on the same subnet.

**Action Required:**
1. Start Redis: `redis-server` (or `sudo systemctl start redis`)
2. Restart the app: `npm run dev:all`

## Symptom 1: Redis Connection Refused
**Description:** Relay fails to start or spams logs with `ECONNREFUSED` when trying to connect to Redis on port 6374.
**Expected:** Relay connects to Redis at the configured URL.
**Actual:** `ECONNREFUSED ::1:6374` and `127.0.0.1:6374`.

## Symptom 2: Expo Go Update Failure
**Description:** Expo Go shows `java.io.IOException: failed to download remote update` when opening the wallet.
**Expected:** Wallet opens and connects to the Metro bundler.
**Actual:** IOException during splash screen/loading.

## Evidence

### Relay Config (Investigation)
- `REDIS_URL` in `src/config.ts`: `redis://localhost:6374` (Incorrect default)
- Redis process status: No active `redis-server` found in `ps aux`.

### Expo Config (Investigation)
- `updates` in `app.json`: Missing (Default behavior)
- `projectId` in `app.json`: `8d8644dd-aecd-4a14-ac43-32a15e24a0c4`
- Metro bundler status: [TO BE CHECKED]

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `REDIS_URL` is hardcoded to port 6374 instead of standard 6379 | 100% | CONFIRMED |
| 2 | Local Redis is not running | 100% | CONFIRMED |
| 3 | Expo `updates.url` is misconfigured (likely pointing to remote instead of local) | 70% | UNTESTED |
