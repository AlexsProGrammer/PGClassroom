# IMPLEMENTATION.md - Build 1: Self-Hosted LMS Prototype

## 1. Project Context & Architecture
- **Goal:** Build the first functional prototype (Build 1) of a self-hosted, air-gapped capable Learning Management System (LMS) for programming tasks. It features a Next.js full-stack application (serving both Admin and Student interfaces) and relies on a local Piston instance for secure, multi-language code execution.
- **Tech Stack & Dependencies:**
  - **Framework:** Next.js 14+ (App Router) with TypeScript.
  - **Database & ORM:** PostgreSQL, Prisma ORM.
  - **Execution Engine:** Piston (Self-hosted via Docker Compose, `ghcr.io/engineer-man/piston`).
  - **Package Manager:** `pnpm`.
  - **UI/Editor:** Tailwind CSS, `lucide-react`, `@monaco-editor/react`.
  - **Initial Commands:** - `pnpm create next-app@latest lms-prototype --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
    - `pnpm add @prisma/client @monaco-editor/react lucide-react`
    - `pnpm add -D prisma`
- **File Structure:**
  ```text
  ├── docker-compose.yml              # Defines Postgres and Piston
  ├── prisma/
  │   └── schema.prisma               # Database schema (Models: Assignment, Submission)
  ├── src/
  │   ├── app/
  │   │   ├── (admin)/
  │   │   │   └── admin/dashboard/    # Admin UI: Create/List assignments
  │   │   ├── (student)/
  │   │   │   └── student/quest/[id]/ # Student UI: Monaco editor and execution UI
  │   │   ├── api/
  │   │   │   ├── assignments/        # CRUD for assignments
  │   │   │   ├── execute/            # Bridge between Next.js and Piston
  │   │   │   └── runtimes/           # Proxy for Piston runtimes list
  │   ├── components/                 # Reusable UI (Buttons, Navbar, EditorWrapper)
  │   └── lib/
  │       └── prisma.ts               # Prisma client singleton
  ├── .env                            # DB connection string and PISTON_URL
  ```
- **Attention Points:** - **Piston Networking:** The Next.js API must communicate with Piston via `localhost:2000` in local dev. Piston is a single container with no external dependencies (no Redis, no separate DB).
  - **Runtime Installation:** Language runtimes must be installed in Piston after first boot via `POST /api/v2/packages`. Installed packages persist via the `piston_packages` Docker volume.
  - **Authentication:** For Build 1, implement pseudo-authentication (hardcoded user ID or simple dropdown selection) to keep focus on the core execution loop. Real auth will be added in Build 2.

## 2. Execution Phases

#### Phase 1: Infrastructure & Database Scaffolding
- [x] **Step 1.1:** Initialize the Next.js project using `pnpm create next-app`.
- [x] **Step 1.2:** Create a `docker-compose.yml` in the root. Define 2 services: `postgres` (port 5433:5432) and `piston` (`ghcr.io/engineer-man/piston`, port 2000:2000, privileged, with `piston_packages` volume).
- [x] **Step 1.3:** Initialize Prisma using `pnpm prisma init`. In `prisma/schema.prisma`, define models: `Assignment` (id, title, description, language, languageVersion, expected_output) and `Submission` (id, assignmentId, code, status, stdout, stderr, compile_output, runCode).
- [x] **Step 1.4:** Add `.env` variables for `DATABASE_URL="postgresql://user:pass@localhost:5433/lms"` and `PISTON_URL="http://localhost:2000"`. Run `pnpm prisma db push` to sync the schema.
- [x] **Step 1.5:** Install language runtimes in Piston: `curl -X POST http://localhost:2000/api/v2/packages -d '{"language":"python","version":"3.12.0"}'` and `'{"language":"java","version":"15.0.2"}'`.
- [x] **Verification:** Run `docker compose up -d`. Verify the database is accessible by running `pnpm prisma studio` and confirming the tables exist. Execute `curl http://localhost:2000/api/v2/runtimes` and ensure it returns installed runtimes.

#### Phase 2: Core API & Execution Bridge
- [x] **Step 2.1:** Create `src/lib/prisma.ts` to instantiate and export a global Prisma client.
- [x] **Step 2.2:** Create an API route `src/app/api/assignments/route.ts` implementing `GET` (fetch all) and `POST` (create new assignment).
- [x] **Step 2.3:** Create the execution bridge `src/app/api/execute/route.ts` (`POST`). Logic: Accept `code` and `assignmentId`. Send a POST request to `${PISTON_URL}/api/v2/execute` payload: `{ language, version, files: [{ content }] }`.
- [x] **Step 2.4:** In the same `execute` route, capture the response from Piston (`run.stdout`, `run.stderr`, `run.code`, `compile.stderr`), derive a human-readable status, create a `Submission` record via Prisma, and return the result to the client.
- [x] **Step 2.5:** Create a runtimes proxy `src/app/api/runtimes/route.ts` (`GET`) that forwards `${PISTON_URL}/api/v2/runtimes` to the frontend.
- [x] **Verification:** Use `curl` to POST a simple Python script (`print("hello")`) to `/api/execute`. Verify it returns the stdout "hello" and a new Submission row appears in Prisma Studio.

#### Phase 3: Admin Dashboard (Teacher View)
- [x] **Step 3.1:** Create `src/app/(admin)/admin/dashboard/page.tsx`. Implement a form to create a new Assignment (Title, Description, Dropdown for Language populated dynamically from Piston runtimes).
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
- **Timeout & Abuse Test:** As a student, write an infinite `while(true)` loop. Execute it. Ensure the Next.js UI doesn't crash, and Piston eventually returns a "Time Limit Exceeded" response.
- **Persistence Test:** Restart the Docker containers (`docker compose down && docker compose up -d`). Verify assignments and past submissions are still intact in Postgres. Verify Piston runtimes persist via the `piston_packages` volume.