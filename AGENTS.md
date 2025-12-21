# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router (MCP routes at `app/api/mcp/[[...path]]/route.ts` and `app/mcp/route.ts`).
- `convex/`: Convex schema and functions; `_generated/` is auto-created.
- `lib/`: TypeScript utilities (e.g., `rain-api.ts`, `card-decrypt.ts`).
- `scripts/`: Node/TS CLI scripts to exercise APIs and workflows.
- `public/`: Static assets. Config lives in root (`*.config.*`, `tsconfig.json`).

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server at `http://localhost:3000`.
- `npm run build`: Production build.
- `npm start`: Run the production server.
- `npm run lint`: Run ESLint across the project.
- Selected scripts (require `.env.local`):
  - `npm run rain:initiate`, `rain:create-card`, `rain:update-card`, `rain:get-users`, `rain:sync-users`, `rain:sync-cards`.
  - Tests/exercises: `npm run test:mcp-server`, `npm run test:agent-workflow`, `npm run test:mcp-card-details`.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Indentation: 2 spaces; semicolons required.
- Files: prefer kebab-case in `lib/` and `scripts/` (e.g., `get-user-contracts.ts`). Keep Convex modules aligned to collection names.
- Exports: functions `camelCase`, types/interfaces `PascalCase`, constants `UPPER_SNAKE_CASE`.
- Lint with `npm run lint` (Next + core-web-vitals). Fix issues before PR.

## Testing Guidelines
- Primary tests are runnable scripts in `scripts/`. Example: `npm run test:mcp-server` to verify the MCP endpoint.
- Ensure `.env.local` is configured (see `.env.example`). For non-destructive flows, set `USE_TEST_CARDS=1`.
- Name ad-hoc test scripts as `test-*.ts` and place in `scripts/`.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject; optional scope (e.g., `convex: sync cards on create`).
- PRs must include: purpose summary, linked issues, setup instructions, and screenshots if UI changes.
- Pre-PR checklist: run `npm run lint`, run relevant `scripts/test-*`, update docs (README/TESTING) if behavior changes.

## Security & Configuration
- Never commit secrets. Use `.env.local` (ignored by Git). Keys: `NEXT_PUBLIC_CONVEX_URL`, `MCP_API_KEY`, `REDIS_URL`, Rain API creds; see `.env.example`.
- The MCP server authenticates via `Authorization: Bearer <MCP_API_KEY>`. Clients must send `Accept: application/json, text/event-stream`. Discovery endpoints may be unauthenticated in dev.
- Server-Sent Events on Vercel require `REDIS_URL`.
