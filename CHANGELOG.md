# CHANGELOG

## 0.2.0 - 2026-03-27

- Completed Phase 4 Student Workspace with dynamic assignment loading at `/student/quest/[id]`.
- Added Monaco editor integration with language mapping based on assignment `language_id`.
- Implemented "Run Code" execution flow calling `/api/execute` with loading state handling.
- Added terminal/output panel to display status, `stdout`, `stderr`, and execution errors.
- Verified execution flow with both intentional syntax error output and successful "hello" output.
