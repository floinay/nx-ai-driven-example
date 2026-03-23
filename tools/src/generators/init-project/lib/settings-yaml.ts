/**
 * Generates .agents/settings.yaml — permissions, env, and launch configs.
 */

export function buildSettingsYaml(): string {
  return `# Settings Registry
# Edit this file, then run: npx nx g tools:sync-all

permissions:
  allow:
    - Bash
    - Read
    - Edit
    - Write
    - Glob
    - Grep
    - NotebookEdit
    - WebSearch
  deny:
    - "Bash(rm -rf /)"
    - "Bash(sudo rm -rf *)"

env:
  CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"
  CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "60"

launch:
  - name: prototype
    runtimeExecutable: npx
    runtimeArgs:
      - nx
      - serve
      - prototype
    port: 4500
`;
}
