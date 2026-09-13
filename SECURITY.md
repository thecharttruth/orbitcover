# Security configuration

Authentication is disabled in the checked-in application configuration. When
enabling it, inject `GROK_AUTH_CLIENT_ID` and `GROK_AUTH_CLIENT_SECRET` through
the hosting provider's server-side environment, along with the existing
database and session configuration. This applies to preview and production.
The app fails closed when authentication is enabled without both OAuth values.
Never use a `VITE_` prefix for a credential.

Older exports included a shared Grok preview client secret. It has been removed
from the current source, but historical commits and existing copies still
contain it. Its owner must confirm whether it remains valid and rotate or revoke
it at the Grok authentication provider. A source-code change cannot perform that
revocation. Do not paste the value into an issue or pull request.

The transitive `js-yaml` dependency is constrained to the patched 4.3.2 release.
Use `npm audit` when changing the lockfile. Run `npm test`, `npm run typecheck`,
and `npm run build` before deploying dependency or authentication changes.
