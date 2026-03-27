# IMPLEMENTATION.md - Build 1: Self-Hosted LMS Prototype

## 1. Project Context & Architecture
- **Goal:** Build the first functional prototype (Build 1) of a self-hosted, air-gapped capable Learning Management System (LMS) for programming tasks. It features a Next.js full-stack application (serving both Admin and Student interfaces) and relies on a local Judge0 instance for secure, multi-language code execution.
- **Tech Stack & Dependencies:**
  - **Framework:** Next.js 14+ (App Router) with TypeScript.
  - **Database & ORM:** PostgreSQL, Prisma ORM.
  - **Execution Engine:** Judge0 (Self-hosted via Docker Compose).
  - **Package Manager:** `pnpm`.
  - **UI/Editor:** Tailwind CSS, `lucide-react`, `@monaco-editor/react`.
  - **Initial Commands:** - `pnpm create next-app@latest lms-prototype --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
    - `pnpm add @prisma/client @monaco-editor/react lucide-react`
    - `pnpm add -D prisma`
- **File Structure:**
  ```text
  ├── docker-compose.yml              # Defines Postgres, Redis, Judge0 Server, Judge0 Worker
  ├── prisma/
  │   └── schema.prisma               # Database schema (Models: User, Assignment, Submission)
  ├── src/
  │   ├── app/
  │   │   ├── (admin)/
  │   │   │   └── admin/dashboard/    # Admin UI: Create/List assignments
  │   │   ├── (student)/
  │   │   │   └── student/quest/[id]/ # Student UI: Monaco editor and execution UI
  │   │   ├── api/
  │   │   │   ├── assignments/        # CRUD for assignments
  │   │   │   └── execute/            # Bridge between Next.js and Judge0
  │   ├── components/                 # Reusable UI (Buttons, Navbar, EditorWrapper)
  │   └── lib/
  │       └── prisma.ts               # Prisma client singleton
  ├── .env                            # DB connection strings and Judge0 API URL
  ```
- **Attention Points:** - **Judge0 Networking:** The Next.js API must communicate with Judge0 via the internal Docker network or `localhost:2358` depending on how Next.js is executed (local dev vs. containerized).
  - **Authentication:** For Build 1, implement pseudo-authentication (hardcoded user ID or simple dropdown selection) to keep focus on the core execution loop. Real auth will be added in Build 2.

## 2. Execution Phases

#### Phase 1: Infrastructure & Database Scaffolding
- [x] **Step 1.1:** Initialize the Next.js project using `pnpm create next-app`.
- [x] **Step 1.2:** Create a `docker-compose.yml` in the root. Define 4 services: `postgres` (port 5432), `redis` (port 6379), `judge0-server` (port 2358, linked to redis/postgres), and `judge0-worker` (linked to redis/postgres). Configure Judge0 with strict resource limits (e.g., memory limits).
- [x] **Step 1.3:** Initialize Prisma using `pnpm prisma init`. In `prisma/schema.prisma`, define models: `Assignment` (id, title, description, language_id, expected_output) and `Submission` (id, assignmentId, code, status, stdout, stderr).
- [x] **Step 1.4:** Add `.env` variables for `DATABASE_URL="postgresql://user:pass@localhost:5432/lms"` and `JUDGE0_URL="http://localhost:2358"`. Run `pnpm prisma db push` to sync the schema.
- [x] **Verification:** Run `docker-compose up -d`. Verify the database is accessible by running `pnpm prisma studio` and confirming the tables exist. Execute `curl http://localhost:2358/languages` and ensure it returns a JSON array of supported languages.

#### Phase 2: Core API & Execution Bridge
- [x] **Step 2.1:** Create `src/lib/prisma.ts` to instantiate and export a global Prisma client.
- [x] **Step 2.2:** Create an API route `src/app/api/assignments/route.ts` implementing `GET` (fetch all) and `POST` (create new assignment).
- [x] **Step 2.3:** Create the execution bridge `src/app/api/execute/route.ts` (`POST`). Logic: Accept `code` and `assignmentId`. Send a POST request to `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true` payload: `{ source_code, language_id }`.
- [x] **Step 2.4:** In the same `execute` route, capture the response from Judge0 (`stdout`, `stderr`, `status.description`), create a `Submission` record via Prisma, and return the result to the client.
- [x] **Verification:** Use Postman or `curl` to POST a simple Python script (`print("hello")`) to `/api/execute`. Verify it returns the stdout "hello" and a new Submission row appears in Prisma Studio.

#### Phase 3: Admin Dashboard (Teacher View)
- [x] **Step 3.1:** Create `src/app/(admin)/admin/dashboard/page.tsx`. Implement a form to create a new Assignment (Title, Description, Dropdown for Language [e.g., 71 for Python, 62 for Java]).
- [x] **Step 3.2:** On form submit, `fetch('/api/assignments', { method: 'POST' })` and update a displayed list of current assignments.
- [x] **Step 3.3:** Render the list of assignments below the form. Include the specific Assignment ID so it can be shared with students.
- [x] **Verification:** Start `pnpm dev`. Navigate to `http://localhost:3000/admin/dashboard`. Fill out the form, submit it, and verify the new assignment appears in the list and in the database.

#### Phase 4: Student Workspace (Code Editor)
- [x] **Step 4.1:** Create `src/app/(student)/student/quest/[id]/page.tsx`. Fetch the Assignment details based on the `[id]` param.
- [x] **Step 4.2:** Import and mount `<Editor>` from `@monaco-editor/react`. Set its `language` prop dynamically based on the assignment's configuration.
- [x] **Step 4.3:** Add a "Run Code" button. On click, grab the editor's current value, send a POST to `/api/execute`, and set an `isLoading` state.
- [x] **Step 4.4:** Create a "Terminal/Output" UI section below the editor to display the returned `stdout`, `stderr`, or compilation errors after the API call completes.
- [x] **Verification:** Navigate to `http://localhost:3000/student/quest/1`. Write intentional syntax error code, click Run, and verify the compiler error shows in the Output window. Fix the code, run again, and verify the correct output is displayed.

## 3. Global Testing Strategy
- **End-to-End Loop:** Go to Admin panel -> Create a Java assignment asking to print "Hello World" -> Copy ID -> Go to Student panel -> Write the Java code -> Execute -> See "Hello World".
- **Timeout & Abuse Test:** As a student, write an infinite `while(true)` loop. Execute it. Ensure the Next.js UI doesn't crash, and Judge0 eventually returns a "Time Limit Exceeded" response.
- **Persistence Test:** Restart the Docker containers (`docker-compose down && docker-compose up -d`). Verify assignments and past submissions are still intact in Postgres.