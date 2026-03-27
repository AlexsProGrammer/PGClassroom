# CHANGELOG

## 0.4.0 - 2026-03-27

- Added `Role` enum (STUDENT, EDITOR, TEACHER) and `User` model with `password` and `role` fields to Prisma schema.
- Added `AssignmentType` enum (CODE, QUIZ, UPLOAD) and `config` (JSON) field to `Assignment` model.
- Added `SubmissionStatus` enum and replaced `Submission.status` (String) with typed enum. Added `points`, `tutorFeedback`, and `aiFeedback` fields.
- Installed `next-auth@beta` (Auth.js v5) and `bcryptjs` for authentication.
- Implemented `src/lib/auth.ts` with Credentials provider and bcrypt password verification.
- Created NextAuth API route handler at `src/app/api/auth/[...nextauth]/route.ts`.
- Added NextAuth type augmentation in `src/types/next-auth.d.ts` to include `role` on session/JWT.
- Created login page at `src/app/(auth)/login/page.tsx`.
- Created `src/proxy.ts` (Next.js 16 proxy, replaces middleware) to protect all routes: unauthenticated users redirect to `/login`; `/admin/*` requires EDITOR or TEACHER role.
- Updated `/api/execute` route to use `SubmissionStatus` enum instead of plain strings.
- Added `AUTH_SECRET` to `.env`.

## 0.3.0 - 2026-03-27

- Migrated code execution engine from Judge0 to Piston (`ghcr.io/engineer-man/piston`).
- Replaced 4 Docker services (judge0-server, judge0-worker, redis, judge0-postgres) with a single Piston container.
- Deleted `judge0.conf`; Piston uses per-request execution limits.
- Updated Prisma schema: `Assignment.language_id` (Int) replaced with `language` (String) + `languageVersion` (String); added `Submission.runCode` (Int?).
- Rewrote `/api/execute` route to call Piston's `/api/v2/execute` with structured status mapping.
- Updated `/api/assignments` route to accept `language` and `languageVersion` strings.
- Added `/api/runtimes` proxy route for dynamic language dropdown in Admin UI.
- Admin dashboard now fetches available runtimes from Piston dynamically.
- Student quest page maps Monaco editor language from Piston language names.
- Installed Python 3.12.0 and Java 15.0.2 runtimes in Piston.

## 0.2.0 - 2026-03-27

- Completed Phase 4 Student Workspace with dynamic assignment loading at `/student/quest/[id]`.
- Added Monaco editor integration with language mapping based on assignment `language_id`.
- Implemented "Run Code" execution flow calling `/api/execute` with loading state handling.
- Added terminal/output panel to display status, `stdout`, `stderr`, and execution errors.
- Verified execution flow with both intentional syntax error output and successful "hello" output.
