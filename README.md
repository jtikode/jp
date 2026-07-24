# J.P. Traders Operations Hub

Internal operations app for J.P. Traders: a mobile Field Terminal for salesmen, a Telecaller desk, a Warehouse module, and an Admin backend with reporting, ledger, and purchase-intelligence views.

## Stack

Next.js (App Router, TypeScript) + Prisma + Tailwind. PostgreSQL database (Supabase in production). Deployed via Hostinger's "Deploy Web App" (Node.js hosting, Git-connected).

## Running locally

```bash
npm install
npx prisma migrate dev
npm run db:seed   # creates the first admin login: admin / changeme123
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Change the seeded admin password (or create a new admin and deactivate the seeded one) before real use.

## Environment variables (`.env`)

- `DATABASE_URL` — PostgreSQL connection string (`postgresql://USER:PASSWORD@HOST:PORT/DATABASE`). In production this points at the Supabase project connected through Hostinger's deploy flow.
- `SESSION_SECRET` — 32+ random characters, used to encrypt the login session cookie. Generate a real one before deploying (`openssl rand -base64 32`).
- `BLOB_READ_WRITE_TOKEN` — not needed on Hostinger. Leave unset and visit photos are written to `public/uploads` on local disk, which works fine since Hostinger's Node hosting is a persistent process (unlike Vercel's ephemeral serverless filesystem, which was the original target this fallback was designed around).

## Deploying (Hostinger)

1. Push this repo to GitHub (already done — connected as `jtikode/jp`).
2. In hPanel: **Advanced → Deploy Web App → Import Git repository → Connect with GitHub**, select the repo and `main` branch.
3. When prompted to connect a database, choose **Supabase** and follow Hostinger's guided setup to create/link a Supabase Postgres project.
4. Add environment variables in the deploy screen: `DATABASE_URL` (from the Supabase connection Hostinger gives you), `SESSION_SECRET` (a real random value — don't reuse the local dev one).
5. Deploy. The `postinstall` script runs `prisma generate` automatically after `npm install`, and all pages that depend on the database/session are marked `force-dynamic` so the build doesn't try to prerender them.
6. Once live, run migrations against the Supabase database (`npx prisma migrate deploy` with `DATABASE_URL` pointed at it) and seed the first admin (`npm run db:seed`), if Hostinger's deploy shell allows running one-off commands — otherwise these can be run from a local machine pointed at the same Supabase connection string.

## Notes

- Submitted visit, telecaller, and warehouse records are immutable by design — there is no edit/delete UI for them, only admin-side viewing/filtering.
- CSV/Excel imports (store master, ledger, purchase history) match columns case-insensitively against a list of expected aliases (see `src/lib/csv.ts` and the alias lists in `src/actions/importActions.ts`) — if the owner's export uses different column headers than expected, add the header to the relevant alias list.
