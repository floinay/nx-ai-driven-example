# Claude Code — Project Entry Point

Read `AGENTS.md` for project rules and conventions.

## Workflows (on-demand, via slash commands)

- `/implement [spec-slug]` — full implementation pipeline with review, code, test, QA
- `/spec [spec-slug]` — spec refinement through Q&A
- `/plan [milestone]` — milestone planning: decomposition, gap analysis, spec creation
- `/fix [description]` — structured fix with review + QA

## Default mode

Work directly. Use sub-agents when the task benefits from parallelism or
specialisation (e.g. parallel backend + frontend coders). Follow project
conventions from AGENTS.md. Use worktrees for multi-file changes on main.
