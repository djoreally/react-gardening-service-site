# BuildOS Agent Contract

This repository operates under BuildOS regardless of which AI coding agent is active.

Before editing, inspect existing product, architecture, authorization, schema, integrations, tests, and BuildOS state. Reuse canonical concepts. Never suppress errors, fake success, bypass authorization, or claim verification that was not performed.

When any BuildOS gate, test, build, CI, deployment, or production verification fails, the active AI MUST identify and repair the root cause, rerun the exact failed gate, continue only after it passes, redeploy the repaired exact SHA when deployment failed, and preserve the RED failure as evidence. Never bypass or weaken the gate. Stop only for a genuine external/human gate.

Production is GREEN only after the exact deployed SHA is independently verified.
