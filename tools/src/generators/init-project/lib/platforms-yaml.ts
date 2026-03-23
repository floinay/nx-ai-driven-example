/**
 * Generates .agents/platforms.yaml — cross-platform model mappings.
 */

export function buildPlatformsYaml(): string {
  return `# Platforms Registry — Cross-platform model mappings
# Edit this file, then run: npx nx g tools:sync-all

codex:
  models:
    opus:
      model: gpt-5.4
      reasoning_effort: high
    sonnet:
      model: gpt-5.4
      reasoning_effort: medium
    haiku:
      model: gpt-5.4
      reasoning_effort: low
  permissions:
    default: workspace-read
    acceptEdits: workspace-write
  max_depth: 3
`;
}
