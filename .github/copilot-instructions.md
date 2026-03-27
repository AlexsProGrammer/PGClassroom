# Project Guidelines

## Stack Detection
- Current repository state: bootstrap planning only (`IMPLEMENTATION.md` present, runtime manifests not yet committed).
- Planned primary stack (source of truth: `IMPLEMENTATION.md`): Next.js 14+ (App Router), TypeScript, pnpm, Prisma, PostgreSQL, Tailwind CSS.
- Planned linting: ESLint (via Next.js setup).
- Planned testing: no automated test framework explicitly defined yet; current verification is command-level and end-to-end flow checks.

## Coding Standards
- Use TypeScript strict mode for all app/runtime code.
- Avoid `any`; use explicit domain types and narrowed unions.
- Keep API route contracts typed (request/response payloads and error shapes).
- Keep business rules out of UI components; place data access and execution logic in `src/lib` and API route handlers.
- Follow React Server Component defaults; use Client Components only when state/effects/browser APIs are required.
- Follow Tailwind utility-first patterns; do not add inline styles unless unavoidable.
- Keep Prisma usage centralized through a singleton client in `src/lib/prisma.ts`.

## Verification Commands
Run the applicable commands after each implementation step:

```bash
pnpm install
pnpm lint
pnpm prisma validate
pnpm prisma db push
pnpm dev
docker compose up -d
curl http://localhost:2358/languages
```

## Execution Policy
- If manifests are missing, scaffold them first according to `IMPLEMENTATION.md` before feature work.
- Every completed phase must update `IMPLEMENTATION.md` checkboxes and include verification evidence in commit/PR notes.



<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
