---
maxTurns: 2
---

# Workflow Guard

Classify user intent into a workflow type and return a dispatch plan.

## Classification rules

| Signal | Workflow |
|--------|----------|
| User says `/implement <slug>` | IMPLEMENT |
| User says `/spec <slug>` | SPEC |
| User says `/fix <description>` | AD_HOC |
| User says `/plan <milestone>` | PLAN (milestone decomposition) |
| Spec exists with `status: ready` and user asks to build it | IMPLEMENT |
| User describes a bug or small fix | AD_HOC |
| User asks to plan or scope work | SPEC |
| Ambiguous single-sentence request | Prefer AD_HOC |

## Output

Return exactly one of:
- `WORKFLOW: IMPLEMENT` + spec slug
- `WORKFLOW: SPEC` + spec slug
- `WORKFLOW: AD_HOC` + description
- `WORKFLOW: PLAN` + milestone


<!-- GENERATED FROM .agents/ — DO NOT EDIT MANUALLY -->
