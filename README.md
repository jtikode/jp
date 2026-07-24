# J.P. Traders Operations Hub

Internal operations app for J.P. Traders: a mobile Field Terminal for salesmen, a Telecaller desk, a Warehouse module, and an Admin backend with reporting, ledger, and purchase-intelligence views.

## Stack

Next.js (App Router, TypeScript) + Prisma + Tailwind. Local development uses SQLite; production is meant to run on PostgreSQL (e.g. Neon) + Vercel + Vercel Blob for photo storage.

## Running locally

```bash
npm install
npx prisma migrate dev
npm run db:seed   # creates the first admin login: admin / changeme123
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Change the seeded admin password (or create a new admin and deactivate the seeded one) before real use.

## Environment variables (`.env`)

- `DATABASE_URL` — `file:./dev.db` locally; a PostgreSQL connection string in production.
- `SESSION_SECRET` — 32+ random characters, used to encrypt the login session cookie. Generate a real one before deploying (`openssl rand -base64 32`).
- `BLOB_READ_WRITE_TOKEN` — only needed in production. Without it, visit photos are written to `public/uploads` on local disk (dev-only fallback).

## Deploying to production

The app was built against SQLite locally since no Postgres instance was available in this environment, but it's meant to run on Postgres in production. Before deploying:

1. Provision a Postgres database (e.g. [Neon](https://neon.tech)) and get its connection string.
2. In `prisma/schema.prisma`, change the datasource `provider` from `"sqlite"` to `"postgresql"`.
3. In `src/lib/db.ts` and `prisma/seed.ts`, swap the `@prisma/adapter-better-sqlite3` driver adapter for `@prisma/adapter-pg` (or your preferred Postgres adapter), pointed at `DATABASE_URL`.
4. Run `npx prisma migrate deploy` against the new database, then `npm run db:seed`.
5. Set up [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) and add `BLOB_READ_WRITE_TOKEN` to your Vercel project's environment variables — without it, photo uploads will fail on Vercel's ephemeral filesystem.
6. Set a real `SESSION_SECRET` and `DATABASE_URL` in the Vercel project settings.
7. Deploy the project to Vercel (framework preset: Next.js, zero extra config needed otherwise).

## Notes

- Submitted visit, telecaller, and warehouse records are immutable by design — there is no edit/delete UI for them, only admin-side viewing/filtering.
- CSV/Excel imports (store master, ledger, purchase history) match columns case-insensitively against a list of expected aliases (see `src/lib/csv.ts` and the alias lists in `src/actions/importActions.ts`) — if the owner's export uses different column headers than expected, add the header to the relevant alias list.
