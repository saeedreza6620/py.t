# Run, database initialization and deployment

## Local development from this ZIP
Requirements from package.json: Node >=22.13.0, pnpm 11.25.0, internet access to the pinned package registry. Use a machine/environment supporting Node, filesystem and Workers tooling. A standard Claude chat or frontend-only Artifact cannot run the complete backend.

From source/:
```sh
corepack pnpm install --frozen-lockfile
corepack pnpm build
```
If Corepack is not available, install the exact pinned pnpm via your normal package manager; do not silently update package versions. The project has pnpm-lock.yaml, not an npm package-lock.json. Older README mentions npm ci; prefer the actual pnpm lock and packageManager field. Image-specific scripts/install-pnpm.sh assumes a managed Linux environment and is not the portable installation path.

Clean extracted copies have no .sites-runtime selection, so scripts/execution-profile.mjs defaults to portable. The source includes its own build/sites-vite-plugin.ts and license; it is required by vite.config.ts. Do not remove it without designing a replacement for Sites integration.

## Local database
Build generates dist/server/wrangler.json. For an EMPTY local DB, apply drizzle/0000 through 0015 in numeric order:
```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_moaning_lily_hollister.sql
```
Repeat once for each pending migration. Do NOT replay already applied files. scripts/bootstrap-empty-local-db.mjs in this handoff automates the empty-only case and requires an explicit --empty-database confirmation.

Then start the built Worker:
```sh
corepack pnpm start
```
Development UI/HMR: corepack pnpm dev. A static file server for public/legacy cannot serve /api/*.

Secrets belong in the private Worker environment, not a public file. Local Wrangler can use ignored .dev.vars according to your selected runtime; .dev.vars.example shows names only. Confirm local injection with an authenticated test; missing configuration must not be replaced with fake values.

## Hosting choices
- Existing ChatGPT Site: .openai/hosting.json retains the current project_id and DB binding. Only authorized Sites tooling/account can publish to it; possessing the ZIP is not ownership/authentication.
- New independent ChatGPT Site: deliberately clear only old project_id from a COPY, provision a new Site and new DB; retain DB binding/schema. Do not call this old-data migration.
- External Cloudflare: this source produces a Worker-compatible build; provision a real D1 DB and configure real bindings/static assets/Secrets before publishing. Generated local config has a placeholder database ID. Do not deploy it blindly or invent a database ID. Sites-specific hosting/auth/static integration may need deliberate adaptation. Existing project authorization required before such architecture changes.
- Generic Node/Vercel/static Claude hosting is not a drop-in replacement for cloudflare:workers and D1.

## Database migration versus source migration
This ZIP contains schema, migrations, starter knowledge and catalog metadata, not production records. If old data is required, obtain an authorized real D1 export/backup separately and validate schema/history before import. Preserve AUTH_HASH_KEY when restoring identity-related hashes; rotating it can break recovery/session matching. Never share old sessions/Secrets in Claude chat.

## Publication acceptance
Build success is only one gate. Confirm actual HTTP responses, provider access, user isolation, persistence, mobile rendering and install assets. Do not append ?v=... and call that a deployment. Record real URL and source SHA after an actual publish succeeds.
