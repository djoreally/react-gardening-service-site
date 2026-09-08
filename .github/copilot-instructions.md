# Copilot Instructions

- Do not publish or ship a release until the verification suite has completed successfully.
- Any failed quality gate must stop the release; never publish around the blocker.
- Never use npm for package-manager operations.
- Never commit API keys, tokens, passwords, or service credentials to source; load secrets from environment variables or an approved secret store.
