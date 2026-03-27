---
description: Apply the exact minimal fix for a terminal error and re-verify.
agent: Engineer
tools: [read, edit, execute]
---
Read the latest terminal error and identify the failing file and failing command.

Workflow:
1. Isolate the root cause from the stack trace or error output.
2. Apply the exact minimal code/config fix required.
3. Re-run the same failing command first.
4. If fixed, run any immediate adjacent validation command.
5. Report root cause, changed files, and verification output.

Constraints:
- No broad refactors.
- No unrelated cleanup.
- Keep patch size as small as possible.
