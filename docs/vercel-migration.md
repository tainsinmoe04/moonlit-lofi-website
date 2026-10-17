# Vercel backend migration

The implementation is staged behind `MOONLIT_BACKEND=native`. Without that exact server-side value, the existing Sites gateway remains active. Keep the old Site available until the independent backend passes the cutover checks.

## Provisioned and local data

- Existing Vercel project: `tain-sin-moe-s-projects/moonlit-lofi-website`.
- Neon Free database: `moonlit-lofi-database`, Washington / `iad1`. Preview deployments use separate database branches.
- Private Blob store required: `moonlit-lofi-private-media`, preferably `iad1` to match the Functions/database region. Never use a public store for member-only audio.
- The private backup lives outside this public repository under `D:/moonlitlofi/backups/sites-before-vercel-2026-10-17`. It contains database rows and the 12 currently referenced uploaded media files, with SHA-256 checksums. It is not a complete export of unused historical Blob objects.
- Static sample music, artwork, and the default catalog remain in the repository. Original user asset folders are untouched.

## Required private environment

Configure the exact intended project, not a different Vercel team or project:

```dotenv
MOONLIT_BACKEND=native
DATABASE_URL=<Neon pooled connection string>
BLOB_READ_WRITE_TOKEN=<token for the private Blob store>
BETTER_AUTH_SECRET=<at least 32 random bytes>
BETTER_AUTH_URL=https://moonlit-lofi-website.vercel.app
CREATOR_SETUP_TOKEN=<32 random bytes encoded as 64 hex characters>
```

Do not expose any of these values with a `NEXT_PUBLIC_` prefix. Keep `.env.local` untracked. Use distinct auth/setup secrets in isolated development or preview environments. `BETTER_AUTH_URL` must match the origin used for sign-in.

## Import before switching production

After project linkage and environment verification:

```powershell
node scripts/migrate-native.mjs
node scripts/import-site-backup.mjs D:/moonlitlofi/backups/sites-before-vercel-2026-10-17
```

Schema creation is additive. Import preserves IDs, timestamps, titles, descriptions, playlist ordering, track status, release dates, member hashes, and listening events. Media uploads preserve existing `/api/media/<UUID>` paths and are downloaded again to verify SHA-256 before recording them. Re-running the row import skips existing primary keys; it does not overwrite live edits.

Take a fresh source backup or stop creator edits immediately before cutover. Listening events can continue to arrive while migrating; export/import any final event delta before retiring the source.

## Creator setup

The owner personally opens `/studio/login`, selects **First time? Set up Studio**, and enters an email, a new password of at least 12 characters, and the private setup code. Never send the password in chat. Public sign-up is disabled. Setup is locked after the owner record exists, and every creator API checks a real Better Auth session against that record. Remove `CREATOR_SETUP_TOKEN` from production after successful setup.

Email password reset delivery is not configured. Keep the owner's credentials in a password manager. A recovery flow should be added before broadening creator access beyond one owner.

## Cutover checks

1. Verify catalog IDs, public/hidden counts, playlist order, all file sizes and media checksums against the source backup.
2. Verify anonymous requests cannot read creator data, create upload tokens, read member-only audio, or complete owner setup without its secret.
3. Verify real owner sign-in, editing, publishing, unpublishing, restoration, settings, and analytics on the independent runtime.
4. Upload an audio file larger than 4.5 MB through Studio to confirm direct multipart Blob uploads. Confirm seek requests return HTTP 206 and a valid `Content-Range`.
5. Verify approved member entry, revocation, expiry, and scheduled public release. Existing member codes are preserved when their hashes are imported.
6. Test desktop/mobile layouts, then enable native mode in production and deploy the tested commit.
7. Export/import the final listening-event delta. Keep the old source and backups for recovery; do not delete originals or the Site as part of this migration.

## Validation

`npm test` includes real PostgreSQL engine tests through PGlite for the native application routes and a real Better Auth password/session flow against an isolated database. It also retains the legacy gateway tests. These checks are not a substitute for the live cutover checks above.
