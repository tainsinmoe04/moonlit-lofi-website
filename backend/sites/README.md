# Private music backend

This directory preserves the Cloudflare/Sites implementation used by Moonlit Lofi: D1 catalog/playlists/settings/listening events, R2 media uploads, and creator-only Studio.

The live backend remains in its existing owner-private deployment. Runtime credentials are configured in hosting settings, not in this repository.

- `ADMIN_EMAIL`: creator identity supplied by trusted Sites authentication.
- `PROXY_SIGNING_SECRET`: shared with the Vercel public gateway to verify listening-country metadata.

`.openai/hosting.example.json` is a sanitized configuration example. It intentionally has no account-specific project identity. Local `.dev.vars`, database state and deployment credentials are omitted.

Run the included backend tooling only in a properly provisioned Cloudflare/Sites project. The `oai-authenticated-user-*` headers must come from a trusted authentication layer; never expose this backend directly while trusting arbitrary browser-provided headers.
