# BuildOS

BuildOS is the policy, state, validation, repair, and release system for this repository.

Lifecycle: REQUEST → PREFLIGHT → EDIT → CHECK → REPAIR IF RED → VERIFY → DEPLOY → PRODUCTION VERIFY → CERTIFY.

Rules:
- Inspect before changing.
- Use the repository's real scripts and boundaries; do not invent missing gates.
- A failed gate starts a repair/retry loop; it is never a reason to bypass the gate.
- Preserve RED evidence and repair the root cause.
- Built, deployed, verified, and GREEN are distinct states.
- Exact SHA identity is required for release claims.
