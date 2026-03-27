
# IMPLEMENTATION.md - Build 2.0: Enterprise LMS (Piston, DSGVO, Auth & AI Batching)

## 1. Project Context & Architecture
- **Goal:** Upgrade the existing Next.js + Piston codebase to a fully secure, GDPR-compliant (DSGVO) LMS. Implement role-based access control (RBAC), multi-type assignments (Code, Quizzes, PDF Uploads), asynchronous execution queuing via BullMQ, manual grading interfaces, and a nightly batch-processing AI grader using a local Ollama instance (Gemma 2B).
- **Tech Stack & Dependencies:**
  - **Auth:** `next-auth@beta` (Auth.js v5), `bcryptjs`
  - **Queueing:** `bullmq`, `ioredis`
  - **File Handling:** `multer` or Next.js native API route standard form parsing.
  - **AI Integration:** Official `ollama` Node.js SDK.
  - **Cron:** `node-cron`
  - **Commands:** - `pnpm add next-auth@beta bcryptjs bullmq ioredis node-cron ollama`
    - `pnpm add -D @types/bcryptjs @types/node-cron`
- **File Structure:**
  ```text
  ├── docker-compose.yml              # Add Redis (for BullMQ) and Ollama. Secure Piston.
  ├── prisma/
  │   └── schema.prisma               # Expand with Roles, Assignment Types, Feedback
  ├── src/
  │   ├── app/
  │   │   ├── (auth)/                 # Login pages
  │   │   ├── (admin)/                # Teacher/Editor routes (Grading UI)
  │   │   ├── api/
  │   │   │   ├── auth/[...nextauth]/ # NextAuth config
  │   │   │   └── execute/            # Refactored to use BullMQ
  │   ├── lib/
  │   │   ├── auth.ts                 # NextAuth logic & Role Middleware
  │   │   ├── queue.ts                # BullMQ producer and worker setup
  │   │   └── cron.ts                 # Nightly AI grading script
  │   └── uploads/                    # Local directory for PDF uploads
  ```
- **Attention Points:** - **Security:** Remove port `2000:2000` from Piston in `docker-compose.yml` to prevent external access. It must only communicate via the internal Docker bridge.
  - **AI Ram Management:** Ollama must be configured to unload the model when idle.

## 2. Execution Phases

#### Phase 1: Security, Auth & Schema Upgrade
- [x] **Step 1.1:** Update `prisma/schema.prisma`. Add `enum Role { STUDENT, EDITOR, TEACHER }`. Update `User` with `password` and `role`. Update `Assignment` with `type` (CODE, QUIZ, UPLOAD) and `config` (JSON). Update `Submission` with `points`, `tutorFeedback`, `aiFeedback`, and `status`. Run `pnpm prisma db push`.
- [x] **Step 1.2:** Implement `src/lib/auth.ts` using NextAuth (Credentials Provider). Verify passwords using `bcryptjs`. 
- [x] **Step 1.3:** Create a middleware (`src/middleware.ts`) to protect routes. `/admin/*` requires `EDITOR` or `TEACHER` role. All other routes require authentication.
- [x] **Verification:** Start the app. Attempt to access `/admin/dashboard` unauthenticated and verify redirection to `/login`.

#### Phase 2: Piston Queuing & Rate Limiting (Crucial for VM Stability)
- [x] **Step 2.1:** Update `docker-compose.yml` to include a `redis` container. Remove the public ports from the `piston` container so it is only internally accessible.
- [x] **Step 2.2:** In `src/lib/queue.ts`, initialize a `Queue` and a `Worker` using `bullmq` connected to Redis. The worker's `concurrency` must be explicitly set to `3`.
- [x] **Step 2.3:** Refactor `src/app/api/execute/route.ts`. Instead of calling Piston directly, add the code payload to the BullMQ queue (`queue.add(...)`). Return a `jobId` to the frontend.
- [x] **Step 2.4:** The Worker logic in `queue.ts` will pick up the job, make the internal HTTP call to Piston (`http://piston:2000`), and save the result to Prisma.
- [x] **Verification:** Send 10 concurrent requests to `/api/execute` via a test script. Verify that the VM CPU does not spike dangerously and the worker processes exactly 3 jobs at a time.

#### Phase 3: File Uploads & Manual Grading UI
- [x] **Step 3.1:** Create `src/app/api/upload/route.ts` to handle `multipart/form-data`. Save PDF files securely to `./src/uploads/[assignmentId]/[userId].pdf`. Save the path in the `Submission` Prisma record.
- [x] **Step 3.2:** Build the Grading UI at `src/app/(admin)/admin/grading/[assignmentId]/page.tsx`. Fetch all `PENDING` submissions.
- [x] **Step 3.3:** Implement a split-screen UI: Left side uses `<iframe src="/api/files/[path]">` to show the PDF or a Monaco editor for code. Right side contains a form for `Points` and `Tutor Feedback`.
- [x] **Verification:** Log in as `TEACHER`. Navigate to the grading UI, assign points to a mock submission, and verify the DB updates the status to `MANUALLY_GRADED`.

#### Phase 4: Nightly AI Batch Processor (Gemma 2B)
- [ ] **Step 4.1:** Add `ollama` to `docker-compose.yml` (Image: `ollama/ollama`). Ensure a volume is mounted for model storage. Set environment variable `OLLAMA_KEEP_ALIVE=5m`.
- [ ] **Step 4.2:** Create `src/lib/cron.ts`. Initialize a `node-cron` job scheduled for `0 2 * * *` (2:00 AM daily).
- [ ] **Step 4.3:** In the cron callback, fetch all `Submission`s where `type == CODE`, `status == PENDING`, and `aiFeedback == null`.
- [ ] **Step 4.4:** Iterate through submissions. Use the `ollama` Node SDK to call the local Ollama container with a strict prompt: *"You are a helpful CS teacher. Analyze this student code. Provide 2 sentences of encouraging feedback and 1 technical improvement."*
- [ ] **Step 4.5:** Save the AI response to `aiFeedback` in Prisma.
- [ ] **Verification:** Modify the cron schedule temporarily to run every minute (`* * * * *`). Create a mock code submission. Wait 1 minute. Verify in the database that `aiFeedback` is populated. Revert cron schedule to 2:00 AM.
