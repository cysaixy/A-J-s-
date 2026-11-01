# Feature port notes

The reference implementation was compared with this A&J system; the reference
repository was not modified. A&J branding, page structure, and CSS are retained.

## Ported behavior

- Backend security and infrastructure: Helmet, CORS allowlist, CSRF, rate
  limiting, request-size limits, PostgreSQL connection handling, and
  overdue-reservation processing.
- Schema compatibility: inventory pack sizes and precision, purchase costs,
  order staff/status metadata, free-form incident types, and persistent email
  verification codes.
- Controller and route behavior: reservations and custom order items,
  inventory/purchases, split payments and cash reconciliation, staff
  management, customer validation, and payment webhook handling.
- Frontend behavior: inventory packs, purchase metadata, reservation table and
  custom-item entry, delivery fees, 11-digit phone validation, OTP resend
  cooldown, and stronger staff passwords.

## Database migration

Apply the additive migration after the existing A&J migrations:

`backend/prisma/migrations/20261101150000_port_schema_alignment/migration.sql`

The migration has not been applied to any hosted database. Do not deploy until
the target database has been backed up and the migration reviewed.

## Required configuration

- `CLIENT_ORIGIN`: comma-separated production frontend origins.
- `OTP_PEPPER`: secret used to hash email verification codes.
- `PAYMONGO_WEBHOOK_SECRET`: webhook signature verification secret.
- PostgreSQL: `POSTGRES_URL_DATABASE_URL`, `DATABASE_URL`, or `POSTGRES_URL`;
  local `DB_*` values are the fallback. `DIRECT_URL` is only for Prisma
  migration tooling, not the runtime pool.
- Existing integrations may also require Firebase, PayMongo API, Cloudinary,
  and SMTP credentials.

## Validation status

- Backend tests: 11/11 passed.
- Prisma schema validation passed.
- ESLint passed for changed backend JavaScript (no errors or warnings).
- Local backend startup and admin/customer page smoke checks passed; the logo
  asset route and CSP-backed inline interactions were verified.
- No CSS files were changed. Repository-wide lint still reports issues in
  untouched files.

No deployment or hosted-database migration is part of this port.
