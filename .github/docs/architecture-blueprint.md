# Architecture Blueprint

## Repository State
- Current checked-in implementation is planning-only.
- The target architecture below maps directly to the declared Build 1 layout in `IMPLEMENTATION.md`.

## Layer Mapping

### UI Layer
- Admin UI lives under `src/app/(admin)/admin/dashboard/`.
- Student UI lives under `src/app/(student)/student/quest/[id]/`.
- Shared UI components live under `src/components/`.

### Routing & API Layer
- HTTP route handlers live under `src/app/api/**/route.ts`.
- `src/app/api/assignments/route.ts`: assignment CRUD endpoints.
- `src/app/api/execute/route.ts`: Judge0 execution bridge endpoint.

### Business Logic & Data Access
- Prisma client singleton lives in `src/lib/prisma.ts`.
- Business rules should be implemented in `src/lib/**` and consumed by route handlers, not embedded in page components.
- Schema and persistence model live in `prisma/schema.prisma`.

### External Systems
- PostgreSQL persists assignments/submissions.
- Judge0 provides isolated code execution.
- Docker Compose orchestrates `postgres`, `redis`, `judge0-server`, and `judge0-worker`.

## Boundary Rules
- UI components do not directly call Prisma.
- API routes validate input and delegate to typed service logic.
- Judge0 response normalization is centralized before persistence.
