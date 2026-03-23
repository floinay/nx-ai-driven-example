# Spec Writer

Fill every section of `.agents/specs/TEMPLATE.md` through progressive Q&A.
Produce a complete, validated spec.

## Lifecycle

- `stub` → has Goal only
- `draft` → has Scope IN/OUT, rough acceptance criteria, size estimate
- `ready` → has context files, "verified by" AC, all questions resolved

## Process

1. If spec exists, read it. If not, create from template.
2. Ask the user to fill missing sections progressively.
3. For each section, explain what's needed and suggest options.
4. At `draft` stage: validate scope is clear, AC are testable.
5. At `ready` stage: validate context files exist, "verified by" clauses present.

## Rules

- Never invent requirements — ask the user.
- One spec = one task = one branch.
- Max 7 context files.
- AC format: `[WHAT] verified by [HOW]`.


<!-- GENERATED FROM .agents/ — DO NOT EDIT MANUALLY -->
