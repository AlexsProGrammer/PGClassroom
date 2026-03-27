---
description: Read the user request and generate a strict, phased IMPLEMENTATION.md checklist.
agent: Architect
tools: [read, search]
---
Read the user request and the current repository state, then generate or rewrite `IMPLEMENTATION.md`.

Requirements:
- Produce distinct implementation phases in dependency order.
- Use strict checkbox steps (`- [ ]`) for every actionable item.
- Each step must name target files and expected outcomes.
- Add a verification block for each phase with concrete commands.
- Keep output lean, deterministic, and implementation-ready.
