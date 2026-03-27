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
- `src/app/api/execute/route.ts`: Piston execution bridge endpoint.
- `src/app/api/runtimes/route.ts`: Proxy for Piston runtimes list.

### Business Logic & Data Access
- Prisma client singleton lives in `src/lib/prisma.ts`.
- Business rules should be implemented in `src/lib/**` and consumed by route handlers, not embedded in page components.
- Schema and persistence model live in `prisma/schema.prisma`.

### External Systems
- PostgreSQL persists assignments/submissions.
- Piston provides isolated code execution (`ghcr.io/engineer-man/piston`, port 2000).
- Docker Compose orchestrates `postgres` and `piston`.

## Boundary Rules
- UI components do not directly call Prisma.
- API routes validate input and delegate to typed service logic.
- Piston response normalization is centralized before persistence.
