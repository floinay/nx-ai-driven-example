# AI-Driven Development Scaffold

A starter template that gives any project a complete AI-driven development system — 12 specialized agents, workflow pipelines, quality gates, and a prototype playground.

## What you get

- **12 AI Agents** — reviewer, coder-backend, coder-frontend, tester, qa-analyst, architect, support, devops, ux-expert, prototype-designer, dx-auditor
- **3 Workflows** — IMPLEMENT (full pipeline), SPEC (planning), AD_HOC (quick fixes)
- **Signal Contracts** — agents communicate through typed signals (APPROVED, DONE, FEEDBACK)
- **Quality Gates** — automated review, testing, and QA before every merge
- **Spec System** — structured task specs with acceptance criteria and lifecycle
- **Prototype App** — Vite + React + Tailwind + shadcn/ui playground for rapid UI prototyping
- **Worktree Isolation** — parallel implementation in git worktrees
- **Cross-Platform** — generates configs for both Claude Code and OpenAI Codex

## Quick Start

```bash
# 1. Clone and install
git clone <this-repo> my-project
cd my-project
npm install

# 2. Run the setup wizard
npx nx g tools:init-project

# 3. Answer the prompts:
#    - Project name
#    - Description
#    - Business domain
#    - Architecture style (monolith / modular-monolith / microservices)
#    - Frontend framework (react / vue / svelte / angular / none)
#    - CSS framework (tailwind / css-modules / styled-components / none)
```

Defaults (override via CLI flags): backend=koa, orm=drizzle, tests=vitest, e2e=playwright.

## Slash Commands

### `/implement [spec-slug]` — Full Implementation Pipeline

Runs in a git worktree. Requires a spec with status `ready`.

```
reviewer-pre → [coder-backend + coder-frontend] parallel → tester → reviewer-post → qa-analyst → gate
```

**What happens:**
1. Reviewer validates the spec (completeness, scope, feasibility)
2. Backend and frontend coders implement in parallel, writing mailbox contracts
3. Tester writes unit/integration + E2E tests (≥80% coverage)
4. Reviewer reviews the diff against acceptance criteria
5. QA-analyst runs build, tests, coverage, and merge gate
6. You review and merge

**Example:**
```bash
npx nx g tools:create-spec --slug=user-auth --goal="Add JWT authentication"
# ... refine the spec ...
/implement user-auth
```

### `/spec [spec-slug]` — Spec Refinement

Interactive Q&A to fill out a spec. Guides you through goal, scope, criteria, and UX.

**Lifecycle:** `stub → draft → ready → in-progress → done`

**Example:**
```bash
/spec user-auth
# Answer questions about scope, acceptance criteria, etc.
```

### `/plan [milestone]` — Milestone Planning

Decomposes features into spec-sized chunks, creates spec stubs, maps dependencies.

**Example:**
```bash
/plan mvp
# Creates spec stubs for all MVP features
```

### `/fix [description]` — Quick Fix

Ad-hoc fix without a formal spec. Runs in a git worktree.

```
support → reviewer-post → qa-analyst → gate
```

**Example:**
```bash
/fix "Login button doesn't redirect after auth"
```

## Prototype App

A built-in Vite + React + Tailwind + shadcn/ui playground for rapid UI prototyping.

```bash
npx nx serve prototype   # starts on http://localhost:4500
```

The `prototype-designer` agent creates screens here with mock data only — no API calls, no business logic. Great for:
- Exploring UI ideas before implementing
- Design reviews with stakeholders
- Testing component compositions

## Managing Agents

```bash
# Add a custom agent
npx nx g tools:add-agent --name=data-engineer --model=sonnet \
  --tools="Read,Write,Edit,Bash" --description="Data pipeline specialist"

# Remove an agent
npx nx g tools:remove-agent --name=data-engineer

# Sync all derived files after manual edits
npx nx g tools:sync-all

# Validate registry consistency
npx nx g tools:validate-registry
```

## Project Structure

```
.agents/                    # Single Source of Truth (edit here)
  agents.yaml               # Agent catalog (12 agents)
  workflows.yaml             # Workflow definitions (IMPLEMENT, SPEC, AD_HOC)
  hooks.yaml                 # Pre/post tool hooks
  settings.yaml              # Permissions, env vars, launch configs
  platforms.yaml             # Cross-platform model mappings
  templates/                 # Agent body templates (*.md.tpl)
  skills/                    # Skill definitions
  specs/                     # Task specifications
  hooks/                     # Hook shell scripts
  context/                   # Project glossary

apps/prototype/             # UI prototype playground
  src/screens/              # Prototype screens (mock data only)
  src/components/ui/        # shadcn/ui components

.claude/                    # Generated (don't edit)
  agents/                   # Agent markdown files
  skills/                   # Skill files
  settings.json             # Permissions and hooks

.codex/                     # Generated (don't edit)
  agents/                   # Codex agent files
  config.toml               # Codex configuration

tools/                      # Nx generators
  generators.json           # Generator registry
  src/generators/
    init-project/           # Setup wizard
    agent-registry/         # Sync, CRUD, validation generators

scripts/ci/                 # CI scripts
  gate.sh                   # Merge gate (lint, build, test)
  verify-spec-ready.sh      # Spec validation
```

## How It Works

The system follows a **Single Source of Truth** pattern:

1. **Source files** in `.agents/` (YAML + templates) are the canonical definitions
2. **Nx generators** read the sources and produce platform-specific output
3. **Generated files** in `.claude/` and `.codex/` are consumed by AI tools
4. **`npx nx g tools:sync-all`** regenerates everything — runs automatically on `npm install`

Never edit files in `.claude/` or `.codex/` directly — they'll be overwritten.

## Customization

### Edit agent templates
Templates live in `.agents/templates/*.md.tpl`. Add project-specific rules, patterns, or constraints. Then:
```bash
npx nx g tools:sync-all
```

### Edit workflows
Modify `.agents/workflows.yaml` to change pipeline steps, add conditions, or adjust parallel execution.

### Edit skills
Add or modify skills in `.agents/skills/`. They're copied to `.claude/skills/` on sync.

## Prerequisites

- Node.js 20+
- npm
- Claude Code CLI and/or OpenAI Codex CLI
