
# IMPLEMENTATION.md - Build 2.5: Enterprise UI/UX Overhaul

## 1. Project Context & Architecture
- **Goal:** Overhaul the existing barebones UI into a modern, industry-standard Enterprise Learning Management System (LMS). Implement a robust design system using `shadcn/ui`, distinct Sidebar layouts for Students and Admins, dynamic assignment rendering (Code/Quiz/Upload), comprehensive statistics dashboards, and a highly efficient split-screen grading interface for tutors.
- **Tech Stack & Dependencies:**
  - **Framework:** Next.js 14+ (App Router) with Tailwind CSS.
  - **Design System:** `shadcn/ui` (Radix UI primitives).
  - **Icons:** `lucide-react`.
  - **Commands to run FIRST:**
    - `pnpm dlx shadcn@latest init` (Use default Style, Slate color, CSS variables: yes).
    - `pnpm dlx shadcn@latest add sidebar button card table form input textarea tabs dialog badge separator avatar dropdown-menu progress scroll-area label radio-group`
- **File Structure Additions/Modifications:**
  ```text
  ├── src/
  │   ├── app/
  │   │   ├── (admin)/
  │   │   │   ├── layout.tsx                  # Admin Shell (Sidebar + Header)
  │   │   │   ├── admin/dashboard/            # Teacher Stats (Pending grades, active students)
  │   │   │   ├── admin/assignments/          # List/Create Assignments (Tabs: Active, Drafts)
  │   │   │   ├── admin/grading/              # Submissions Table
  │   │   │   │   └── [submissionId]/         # Split-screen Grading UI
  │   │   │   └── admin/settings/             # Admin Account Settings
  │   │   ├── (student)/
  │   │   │   ├── layout.tsx                  # Student Shell (Sidebar + Header)
  │   │   │   ├── student/dashboard/          # Student Stats (XP, Open Quests)
  │   │   │   ├── student/quest/[id]/         # Dynamic Quest Wrapper
  │   │   │   └── student/settings/           # Student Account Settings
  │   ├── components/
  │   │   ├── layout/                         # AppSidebar, TopNav, UserNav
  │   │   └── assignments/                    # Dynamic renderers
  │   │       ├── CodeWorkspace.tsx           # Monaco Editor + Output
  │   │       ├── QuizWorkspace.tsx           # RadioGroups/Checkboxes
  │   │       └── UploadWorkspace.tsx         # Drag & Drop File Input
  ```
- **Attention Points:** - **Component Composition:** Keep pages clean. Extract logic into specific components (e.g., `QuizWorkspace` handles its own state before submitting).
  - **Layout Segregation:** Admin and Student routes must have completely separate navigation sidebars to prevent UI bleeding and security confusion.

## 2. Execution Phases

#### Phase 1: Design System & Layout Shells
- [x] **Step 1.1:** Initialize `shadcn/ui` and install the required components listed in the Tech Stack section.
- [x] **Step 1.2:** Create `src/components/layout/AdminSidebar.tsx` and `StudentSidebar.tsx` using the `shadcn` Sidebar components. Include links for Dashboard, Assignments/Quests, Grading (Admin only), and Settings.
- [x] **Step 1.3:** Create a Top Header component containing breadcrumbs and a `UserNav` (Avatar dropdown with "Profile" and "Log out" calling NextAuth `signOut`).
- [x] **Step 1.4:** Update `src/app/(admin)/layout.tsx` and `src/app/(student)/layout.tsx` to wrap their children in the new SidebarProvider, Sidebar, and Header structure.
- [x] **Verification:** Run `pnpm dev`. Log in as a TEACHER, verify the Admin Sidebar renders. Log out, log in as a STUDENT, verify the Student Sidebar renders.

#### Phase 2: Analytics Dashboards
- [x] **Step 2.1:** Overhaul `src/app/(student)/student/dashboard/page.tsx`. Use `shadcn` `<Card>` components to display: Total XP (sum of points from GRADED submissions), Completed Quests count, and a list of Pending Quests. Use `<Progress>` to show level progress.
- [x] **Step 2.2:** Overhaul `src/app/(admin)/admin/dashboard/page.tsx`. Create metric cards using Prisma aggregates: Total Students (count users where role=STUDENT), Total Assignments, and Submissions requiring Grading (count submissions where status=PENDING or AUTO_GRADED).
- [x] **Step 2.3:** Add a "Recent Activity" table on the Admin dashboard showing the last 5 submissions across all students.
- [x] **Verification:** Seed the database with mock submissions. Navigate to both dashboards and verify the aggregated numbers display correctly within the Card UI.

#### Phase 3: Dynamic Assignment Engine (Student View)
- [ ] **Step 3.1:** Create `src/components/assignments/CodeWorkspace.tsx` (migrating the existing Monaco logic here), `QuizWorkspace.tsx` (rendering a form based on `config.questions` using `RadioGroup`), and `UploadWorkspace.tsx` (rendering an `<Input type="file">`).
- [ ] **Step 3.2:** Refactor `src/app/(student)/student/quest/[id]/page.tsx`. Fetch the Assignment. Based on `assignment.type`, render the corresponding Workspace component, passing the assignment config and ID as props.
- [ ] **Step 3.3:** Standardize the submission API. Update `src/app/api/submissions/[id]/route.ts` or create a new POST route to handle saving the JSON content (Code string, Quiz answers array, or File path) based on the assignment type.
- [ ] **Verification:** Create three mock assignments in the DB (one CODE, one QUIZ, one FILE_UPLOAD). Navigate to their respective URLs as a student and verify the UI dynamically shifts from a code editor to a quiz form to an upload dropzone.

#### Phase 4: Advanced Grading UI (Admin View)
- [ ] **Step 4.1:** Overhaul `src/app/(admin)/admin/grading/page.tsx`. Use the `shadcn` `<Table>` component to list all Submissions. Add columns for Student Name, Assignment Title, Status (Badge: Pending/Graded), and an "Action" button linking to the specific submission.
- [ ] **Step 4.2:** Create `src/app/(admin)/admin/grading/[submissionId]/page.tsx`. Implement a CSS Grid/Flexbox split-screen layout (`grid-cols-3` or `grid-cols-4`).
- [ ] **Step 4.3:** Left side (Content View): Dynamically render the submission content. If CODE, show a read-only Monaco editor. If QUIZ, render the questions and the student's selected answers. If UPLOAD, provide a button to download/view the file via the `/api/files/` route.
- [ ] **Step 4.4:** Right side (Grading Panel): Implement a sticky `<Card>` with an `<Input type="number">` for Points, a `<Textarea>` for Tutor Feedback, and a "Save & Mark as Graded" button that updates the submission via a server action or API call. Display `aiFeedback` here if it exists.
- [ ] **Verification:** Log in as an EDITOR. Navigate to `/admin/grading`. Click on a pending submission. Verify the split-screen layout renders the correct content on the left and successfully saves points/feedback on the right.

#### Phase 5: Settings & Profile Management
- [ ] **Step 5.1:** Create `src/app/(admin)/admin/settings/page.tsx` and `src/app/(student)/student/settings/page.tsx` (or share a common component).
- [ ] **Step 5.2:** Implement a form using `shadcn` `<Form>` to update the user's `name` (Display Name).
- [ ] **Step 5.3:** Implement a "Change Password" section requiring the current password, new password, and confirmation, utilizing `bcryptjs` for verification in a protected API route.
- [ ] **Verification:** Navigate to the Settings page. Change the display name and verify the Sidebar UserNav immediately reflects the new name. Attempt a password change and re-login to confirm it works.

## 3. Global Testing Strategy
- **Responsive Layout Test:** Shrink the browser window to mobile size. Ensure the `shadcn` Sidebar collapses into a hamburger menu and the split-screen grading UI stacks vertically instead of horizontally.
- **Role Routing Test:** Attempt to type `/admin/grading` into the URL bar while logged in as a STUDENT. Verify the middleware immediately kicks the user back to `/student/dashboard`.
- **The "Full Loop" Visual Check:** Create a Quiz assignment -> Log in as Student -> Solve Quiz -> Log in as Editor -> See it in pending table -> Grade it on the split screen -> Log back in as Student -> See the XP increase on the Dashboard.
