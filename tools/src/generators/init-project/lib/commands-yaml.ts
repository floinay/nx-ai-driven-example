/**
 * Generates .agents/commands.yaml — NX generator command registry.
 * This is the same for all tiers.
 */

export function buildCommandsYaml(): string {
  return `# NX Generator Commands
# These commands are registered in tools/generators.json

sync:
  sync-all:
    description: Run all sync generators (agents, skills, commands, settings, codex)
  sync-agents:
    description: Regenerate .claude/agents/*.md from agents.yaml + templates
  sync-skills:
    description: Regenerate .claude/skills/*/SKILL.md from skill sources
  sync-commands:
    description: Regenerate workflow command skills from workflows.yaml
  sync-settings:
    description: Regenerate .claude/settings.json from settings.yaml + hooks.yaml
  sync-codex:
    description: Regenerate .codex/ from the agent registry
  sync-dashboard:
    description: Regenerate .agents/specs/INDEX.md from spec frontmatter

agent-crud:
  add-agent:
    description: Add a new agent to the registry and sync
  update-agent:
    description: Update an existing agent and sync
  remove-agent:
    description: Remove an agent from the registry and sync

spec:
  create-spec:
    description: Create a new spec from template
  update-spec:
    description: Update spec frontmatter fields

validation:
  validate-registry:
    description: Check that all derived files match the registry
`;
}
