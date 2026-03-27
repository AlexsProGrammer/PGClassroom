---
description: Execute the first unchecked IMPLEMENTATION.md step, verify, and iterate.
agent: Engineer
tools: [read, edit, execute]
---
Read `IMPLEMENTATION.md` and locate the first unchecked step (`- [ ]`).

Execution loop:
1. Implement only that first unchecked step.
2. Run the required tests/verification commands for that step.
3. If verification passes, update the step to checked (`- [x]`).
4. Summarize files changed and command outputs.
5. Continue to the next unchecked step until completion or blocker.

Mandatory directive:
Upon completing the final phase of any plan, you MUST automatically bump the semantic version in the relevant configuration file (e.g., package.json) and add a bulleted summary of changes to `CHANGELOG.md`.
