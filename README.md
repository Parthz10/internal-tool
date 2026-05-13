# Internal Tools Builder

Production-grade, self-hostable internal tools builder for e-commerce operations teams. Operators can connect PostgreSQL or REST data sources, compose dashboards on a 12-column canvas, publish them, and run typed data-bound components.

## Stack

- Next.js 14 App Router with strict TypeScript
- Tailwind CSS
- Prisma with PostgreSQL
- `pg` for operator-supplied PostgreSQL data sources
- JWT cookie sessions with `bcryptjs`
- AES-256-GCM encrypted data source configs
- Zustand builder state, dnd-kit canvas interactions, SWR runtime fetching

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Set environment variables:

- `DATABASE_URL`: PostgreSQL URL for the app database.
- `JWT_SECRET`: random secret for signing session cookies. Use a 64-character hex string.
- `DATA_ENCRYPTION_KEY`: AES-256-GCM key. Prefer a 64-character hex key from `openssl rand -hex 32`; a 32-byte secret string is also accepted.
- `NEXT_PUBLIC_APP_URL`: public app URL, usually `http://localhost:3000` locally.

4. Create the database schema:

```bash
npm run prisma:dev
```

5. Start the app:

```bash
npm run dev
```

## Security Model

- Passwords are hashed with bcrypt at 12 rounds.
- Sessions are stored in an `httpOnly`, same-site cookie signed with `JWT_SECRET`.
- Data source config JSON is encrypted before being written to Prisma.
- The client never receives data source credentials.
- Every route handler re-checks workspace membership before reading or writing workspace-owned records.
- PostgreSQL read queries run inside a read-only transaction. Mutation execution requires an explicit mutation request.
- Query execution and outbound REST calls are capped at 8 seconds.

## Canvas Schema

Canvas state is defined and validated in `lib/canvas-schema.ts`. Every saved app canvas must contain `blocks` and `variables`. Block ids use cuid-compatible strings, and block layout is stored as grid coordinates: `x`, `y`, `w`, `h`.

## Adding A Block Type

1. Add the literal to `blockTypeSchema` in `lib/canvas-schema.ts`.
2. Add a discriminated Zod schema for the block and include it in `blockSchema`.
3. Add a builder preview component in `components/builder/components`.
4. Add the block to `ComponentPanel`.
5. Render its editable fields in `PropertiesPanel`.
6. Render runtime behavior in `components/runtime/RuntimeBlock.tsx`.
7. Validate that save and runtime query requests still pass `canvasStateSchema`.

## Deployment

This app is designed for a single VPS, Railway, or Render deployment with one PostgreSQL database for app metadata. Operator-defined PostgreSQL sources should be external databases with least-privilege credentials.
