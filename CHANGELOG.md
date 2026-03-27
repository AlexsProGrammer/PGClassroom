# CHANGELOG

## 0.6.0 - 2026-03-27

- Added `userId` (optional FK to User) and `filePath` fields to `Submission` model with `@@unique([assignmentId, userId])` compound constraint.
- Added `submissions` relation on `User` model.
- Created `src/app/api/upload/route.ts`: multipart/form-data upload endpoint for PDF files with auth, assignment type validation, PDF magic byte verification, and 10 MB size limit. Files stored at `src/uploads/[assignmentId]/[userId].pdf`.
- Created `src/app/api/files/[...path]/route.ts`: authenticated file-serving route with path traversal protection for viewing uploaded PDFs.
- Created `src/app/api/grading/[assignmentId]/route.ts`: GET fetches assignment + all submissions (with user info); PATCH grades a submission (sets points, tutorFeedback, status → MANUALLY_GRADED). Restricted to EDITOR/TEACHER roles.
- Built grading UI at `src/app/(admin)/admin/grading/[assignmentId]/page.tsx`: sidebar listing pending/graded submissions, split-screen view with PDF iframe or code display on left, grading form on right.
- Verified: logged in as TEACHER, graded submission #1 with 95 points, DB confirmed `status=MANUALLY_GRADED`.

## 0.5.0 - 2026-03-27

- Added Redis container to `docker-compose.yml` for BullMQ queue backend.
- Secured Piston container: removed public port binding, now bound to `127.0.0.1:2000` only (localhost dev) with `expose: ["2000"]` for production Docker networking.
- Installed `bullmq` and `ioredis` dependencies.
- Created `src/lib/queue.ts` with BullMQ `Queue` and `Worker` (concurrency: 3) that processes code execution jobs against Piston and saves results to Prisma.
- Refactored `src/app/api/execute/route.ts` to enqueue jobs via BullMQ instead of calling Piston directly; returns `jobId` and `submissionId` with 202 status.
- Added `src/app/api/submissions/[id]/route.ts` polling endpoint for frontend to check submission results.
- Updated student quest page to poll for async execution results instead of waiting synchronously.
- Added `REDIS_URL` to `.env`.
- Verified: 10 concurrent requests processed correctly through queue with concurrency limit of 3.

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
