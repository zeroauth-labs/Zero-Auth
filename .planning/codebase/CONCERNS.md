# Codebase Concerns

**Analysis Date:** 2026-03-06

## Tech Debt

**ZK Circuit Compilation:**
- Issue: Aadhaar circuit compilation is complex
- Files: `zero-auth-wallet/circuits/aadhaar_check.circom`
- Impact: Circuit must be manually compiled and bundled
- Fix approach: Automate circuit compilation in CI/CD

**Uncompiled Circuit Artifacts:**
- Issue: Some circuit files (.zkey) are uncompiled/commented
- Files: `zero-auth-wallet/circuits/aadhaar_check.circom`
- Impact: ZK proof generation may fail for certain flows
- Fix approach: Complete circuit compilation and testing

**State Management Duplication:**
- Issue: Auth state in Zustand + Supabase Auth can drift
- Files: `zero-auth-wallet/store/auth-store.ts`, `zero-auth-wallet/lib/supabase.ts`
- Impact: Session inconsistencies
- Fix approach: Single source of truth with sync mechanism

## Known Bugs

**No confirmed bugs from codebase inspection.** 

Check GitHub issues for reported bugs.

## Security Considerations

**Environment Variables:**
- Risk: `.env` files may contain secrets
- Files: `.env.example` present (good practice)
- Current mitigation: `.gitignore` excludes `.env*`
- Recommendations: Use Supabase secrets, rotate keys regularly

**Biometric Authentication:**
- Risk: Biometric can fail or be bypassed on some devices
- Files: `zero-auth-wallet/lib/proof.ts`
- Current mitigation: Graceful fallback messaging
- Recommendations: Add fallback authentication method

**ZK Proof Security:**
- Risk: Circuit vulnerabilities could allow false proofs
- Files: `zero-auth-wallet/circuits/`
- Current mitigation: Trusted setup, circuit testing
- Recommendations: Third-party audit of circuits

## Performance Bottlenecks

**ZK Proof Generation:**
- Problem: CPU-intensive, can freeze mobile UI
- Files: `zero-auth-wallet/components/ZKEngine.tsx`, `zero-auth-relay/src/proof-worker.ts`
- Cause: snarkjs operations
- Improvement path: Web worker, WASM optimization

**Database Queries:**
- Problem: N+1 queries in credential fetching
- Files: `supabase/functions/get-credential/index.ts`
- Cause: Multiple sequential queries
- Improvement path: Batch queries, RPC functions

## Fragile Areas

**Circuit Key Management:**
- Files: `zero-auth-wallet/assets/circuits/`
- Why fragile: Keys must match circuit, manually managed
- Safe modification: Test thoroughly, maintain key backups
- Test coverage: Limited

**Edge Function Deployment:**
- Files: `supabase/functions/*/`
- Why fragile: Functions must be deployed to Supabase
- Safe modification: Test locally with `supabase functions serve`
- Test coverage: None

## Scaling Limits

**Session Storage:**
- Current capacity: Supabase plan limits
- Limit: Row count and storage
- Scaling path: Upgrade Supabase plan, implement cleanup

**Relay Server:**
- Current capacity: Single instance
- Limit: CPU for ZK verification
- Scaling path: Horizontal scaling, proof worker queue

## Dependencies at Risk

**snarkjs:**
- Risk: Not actively maintained (0.7.x is old)
- Impact: Security vulnerabilities, missing features
- Migration plan: Monitor `0zk` or other alternatives

**Expo SDK:**
- Risk: Major version upgrades can break compatibility
- Impact: Build failures, API changes
- Migration plan: Keep updated, test thoroughly before upgrades

**circomlib:**
- Risk: Version mismatches between compilation and runtime
- Impact: Proof verification failures
- Migration plan: Lock versions, test circuit compatibility

## Missing Critical Features

**Comprehensive Test Suite:**
- Problem: Minimal automated tests
- Blocks: Confidence in refactoring, regression detection
- Priority: High

**Error Monitoring:**
- Problem: No error tracking service
- Blocks: Proactive bug discovery
- Priority: Medium

**Circuit Versioning:**
- Problem: No clear circuit version management
- Blocks: Upgrading circuits without breaking existing credentials
- Priority: High

## Test Coverage Gaps

**Wallet App:**
- What's not tested: UI flows, credential issuance, verification approval
- Files: `zero-auth-wallet/app/*.tsx`
- Risk: UI regressions unnoticed
- Priority: High

**SDK:**
- What's not tested: All SDK functions
- Files: `zero-auth-sdk/src/index.ts`
- Risk: Breaking changes
- Priority: High

**Relay API:**
- What's not tested: Most endpoints
- Files: `zero-auth-relay/src/index.ts`
- Risk: API bugs in production
- Priority: Medium

---

*Concerns audit: 2026-03-06*
