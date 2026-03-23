/**
 * Generates .agents/hooks.yaml — always includes all hooks.
 */
import { stringify } from 'yaml';
import type { ProjectConfig } from '../generator';

export function buildHooksYaml(config: ProjectConfig): string {
  const hooks: Record<string, unknown> = {};

  hooks['worktree-guard'] = {
    trigger: 'PreToolUse',
    tool_pattern: 'Write|Edit',
    command: 'bash .agents/hooks/worktree-guard.sh',
    description: 'Blocks writes to main checkout on main branch. Allowlist: .agents/specs/*, .claude/*, tmp/*',
    template: null,
  };

  hooks['spec-ready-gate'] = {
    trigger: 'PostToolUse',
    tool_pattern: 'Write|Edit',
    command: 'bash .agents/hooks/spec-ready-gate.sh',
    description: 'When a spec status changes to ready, validates required sections and frontmatter',
    template: null,
  };

  hooks['dx-auditor-trigger'] = {
    trigger: 'PostToolUse',
    tool_pattern: 'Write|Edit',
    command: 'bash .agents/hooks/dx-auditor-trigger.sh',
    description: 'Detects changes to .agents/, AGENTS.md, CLAUDE.md and reminds Lead to spawn dx-auditor',
    template: null,
  };

  const header = `# Hooks Registry — ${config.name}\n# Edit this file, then run: npx nx g tools:sync-all\n\n`;
  return header + stringify({ hooks }, { lineWidth: 0, blockQuote: 'literal' });
}
