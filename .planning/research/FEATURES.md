# Feature Research

**Domain:** production-grade ZK credential wallet/relay/SDK systems
**Researched:** 2026-02-21
**Confidence:** LOW (no external sources consulted; validate against standards/docs)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hosted relay with persistence | Production traffic needs stable hosting, no localhost deps | MEDIUM | Managed hosting, env config, secrets, health checks, uptime monitoring |
| Relay database backed by managed DB | Verifications must survive restarts and scale | MEDIUM | Migrations, indexes, retention policies, backups |
| Real ZK proof generation + verification | Demo/mock is not acceptable for production | HIGH | Circuit integration, witness creation, verification key management |
| Request/response integrity | Verifiers expect tamper-proof payloads | MEDIUM | Nonce/challenge binding, signature over request/response |
| IO schema validation + versioning | Clients need stable formats | MEDIUM | JSON schema, version field, backwards-compat adapters |
| Wallet key encryption at rest | Users expect private keys protected | HIGH | Device storage, passcode/biometric gating, secure wipe on reset |
| Key rotation + revoke flows | Long-lived systems need safe rotation | MEDIUM | Rotation UX, revocation list updates, backward compatibility |
| SDK configuration surface | Integrators need clear, minimal config | MEDIUM | Env/endpoint config, modular imports, sane defaults |
| SDK error taxonomy | Production needs predictable failure modes | LOW | Typed errors, retryable vs fatal classification |
| QR payload constraints | QR is a primary transport; size limits apply | LOW | Payload compression, short-lived tokens, relay fetch by ID |
| Rate limiting + abuse controls | Public relay endpoints attract abuse | MEDIUM | IP-based limits, request quotas, captcha or API keys |
| Observability for relay | Operators expect logs/metrics/traces | MEDIUM | Structured logs, request IDs, basic metrics |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-claim proofs with selective disclosure | Richer proofs reduce data sharing | HIGH | Circuit supports multiple claims, selective reveal rules |
| SDK transport abstraction | Swap relay/SaaS/backends without SDK rewrite | MEDIUM | Pluggable transport, interface-based client |
| Offline verification mode | Works in low-connectivity settings | HIGH | Local verifier bundle, cached keys, expiry handling |
| Cross-platform wallet backup UX | Lower user loss; better retention | HIGH | Encrypted backup, recovery phrases, key escrow policies |
| Schema registry + compatibility tooling | Faster integrations, fewer IO bugs | MEDIUM | Schemas hosted, validation CLI, deprecation policy |
| Performance tuning for proofs | Reduced latency improves scan UX | HIGH | Precomputation, worker pools, caching of verification keys |
| Developer-focused SDK UX | Faster adoption | MEDIUM | Typed SDK, docs, examples, minimal setup |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Server-side custody of wallet private keys | Easier login/recovery | Violates trust model, increases breach impact | Client-side encryption + recovery UX |
| Custom crypto primitives | Perceived performance gains | Security risk, audit burden | Use standard ZK libs and audited primitives |
| Unbounded QR payloads | Avoid relay dependency | Fails in real QR scanners, poor UX | QR contains short token pointing to relay |
| Tight coupling of SDK to relay | Faster to ship | Locks integrators into one backend | Transport abstraction + interface contracts |
| Silent auto-retry on proof failures | Smooth UX | Masks correctness issues | Clear error states + retry guidance |

## Feature Dependencies

```
[Real ZK proof generation]
    └──requires──> [Circuit integration + verification keys]
                       └──requires──> [IO schema for inputs/outputs]

[Relay hosting + DB]
    └──requires──> [Schema migrations + indexes]

[Wallet key encryption]
    └──requires──> [Secure storage primitives]

[Multi-claim proofs]
    └──requires──> [Real ZK proof generation]

[QR short token flow]
    └──requires──> [Relay fetch-by-id endpoint]

[SDK transport abstraction]
    └──requires──> [Stable IO schemas + error taxonomy]
```

### Dependency Notes

- **Real ZK proof generation requires circuit integration + verification keys:** proofs cannot be produced or verified without correct keys and circuit-specific witness logic.
- **Circuit integration requires IO schema for inputs/outputs:** wallet, relay, and verifier must agree on inputs for deterministic proofs.
- **QR short token flow requires relay fetch-by-id endpoint:** QR size limits mandate a short identifier with server lookup.
- **SDK transport abstraction requires stable IO schemas + error taxonomy:** pluggability only works if formats and failures are consistent.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Hosted relay + managed DB — remove localhost dependencies and persist verification traffic
- [ ] Real ZK proof generation + verification — replace demo/mock flows
- [ ] IO schema validation + versioning — ensure SDK/wallet/relay compatibility
- [ ] Wallet key encryption + reset behavior — secure keys and safe wipe on reset
- [ ] SDK modular config + error taxonomy — predictable integration surface
- [ ] QR short-token flow — practical QR sizes in production

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Rate limiting + abuse controls — when public traffic appears
- [ ] Observability dashboards — when SLOs are defined
- [ ] Multi-claim proofs — when multi-credential use cases appear
- [ ] Performance optimizations — after baseline measurements

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Offline verification mode — high complexity, niche for some deployments
- [ ] Cross-platform recovery flows — heavy UX + security tradeoffs
- [ ] Schema registry + tooling — only after ecosystem grows

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hosted relay + managed DB | HIGH | MEDIUM | P1 |
| Real ZK proof generation + verification | HIGH | HIGH | P1 |
| IO schema validation + versioning | HIGH | MEDIUM | P1 |
| Wallet key encryption + reset behavior | HIGH | HIGH | P1 |
| SDK modular config + error taxonomy | HIGH | MEDIUM | P1 |
| QR short-token flow | MEDIUM | LOW | P1 |
| Rate limiting + abuse controls | MEDIUM | MEDIUM | P2 |
| Observability dashboards | MEDIUM | MEDIUM | P2 |
| Multi-claim proofs | HIGH | HIGH | P2 |
| Performance optimizations | MEDIUM | HIGH | P2 |
| Offline verification mode | LOW | HIGH | P3 |
| Schema registry + tooling | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A | Competitor B | Our Approach |
|---------|--------------|--------------|--------------|
| Real ZK proof flows | Not researched | Not researched | Integrate real circuits and verification keys |
| Wallet key protection | Not researched | Not researched | Client-side encryption + reset safety |
| IO schema/versioning | Not researched | Not researched | Versioned schemas + validators |

## Sources

- No external sources consulted (needs validation against standards and competitor documentation)

---
*Feature research for: production-grade ZK wallet/relay/SDK systems*
*Researched: 2026-02-21*
