# Moonlit Lofi

A dreamy music channel website with a sky-blue glass interface, music playback, playlists, favorites, a queue and sleep timer.

## Hosting architecture

- **Vercel** serves the public Next.js website and its restricted music API gateway.
- **The existing private Sites backend** keeps the D1 database, R2 uploads, creator sign-in, track editing and listening insights.
- `/studio` redirects the creator to the protected backend Studio. Listeners never receive creator privileges.
- Changes made in Studio appear on the public website when the library refreshes or the page reloads.

The original backend source is preserved in `backend/sites/`. It is excluded from Vercel builds.

## Local development

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set these server-only values in `.env.local` and in the Vercel project's production environment:

| Variable | Purpose |
| --- | --- |
| `SITE_BACKEND_URL` | HTTPS origin of the private music backend |
| `SITE_BACKEND_TOKEN` | Sites service-access bearer token; never exposed to the browser |
| `PROXY_SIGNING_SECRET` | Shared HMAC secret, also configured on the backend |

```sh
npm run build
npm start
```

## Public API boundary

The gateway only permits `GET /api/tracks`, `GET /api/playlists`, `GET /api/settings`, `GET /api/media/<uuid>`, and `POST /api/events`. It does not proxy creator writes, upload routes, credentials, cookies, or visitor-supplied identity headers.

Listening events use Vercel's country header and a timestamped HMAC signature. The backend verifies the signature before accepting the supplied country. Raw visitor IP addresses are not stored in the listening database.

## Creator features

Open `/studio` to use the creator account on the private backend. Studio supports audio uploads, replacing published cover artwork, editing metadata and YouTube links, creating/editing playlists, configuring music-platform links, and viewing country/time insights.

## Deployment

Import this repository into Vercel as **Next.js**, keep the root directory at the repository root, and configure the three server-only variables above. The included `vercel.json` sets the build commands. Git commits can then trigger deployments automatically.

## Assets

The music, logo and fantasy artwork belong to the Moonlit Lofi channel project. Secrets, local databases, uploaded runtime files, and private Git history are not part of this repository.
