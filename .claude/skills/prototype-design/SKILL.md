---
name: prototype-design
description: Generate UI screen prototypes using Tailwind + shadcn/ui. Creates visual mockups with real components and mock data in apps/prototype/.
argument-hint: [screen description or Figma URL]
allowed-tools: Read, Glob, Grep, Agent
---

# Prototype Design

Generate a visual UI prototype screen using Tailwind CSS and shadcn/ui components.

## Steps

1. **Parse input.** `$ARGUMENTS` is either:

   - A text description of the screen (e.g. "Dashboard with stats cards and activity table")
   - A Figma URL (contains `figma.com/design/`)

2. **Spawn prototype-designer agent.** Pass the full description/URL.

   ```
   Agent(subagent_type="prototype-designer", prompt=<description>)
   ```

3. **Report result.** When the agent emits `prototype-designer: DONE`, show the user:
   - The screen file path
   - The preview URL (http://localhost:4500/<route>)
   - Screenshot if available

## Notes

- The prototype app must be running on port 4500 for preview.
  If not running, start it via the `prototype` launch config.
- Multiple screens can be generated in sequence — each gets its own route.
- Screens use only components from `apps/prototype/src/components/ui/`.
- No API calls, no business logic — pure visual layout with hardcoded mock data.
