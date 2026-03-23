/**
 * Shared utilities for agent-registry generators.
 * Reads YAML registry files and templates from the Nx virtual Tree.
 */
import { Tree, logger } from '@nx/devkit';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import type {
  AgentsRegistry,
  AgentEntry,
  HooksRegistry,
  WorkflowsRegistry,
  SkillsRegistry,
  PlatformsRegistry,
  SettingsRegistry,
} from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AGENTS_DIR = '.agents';
export const AGENTS_YAML = `${AGENTS_DIR}/agents.yaml`;
export const SKILLS_YAML = `${AGENTS_DIR}/skills.yaml`;
export const WORKFLOWS_YAML = `${AGENTS_DIR}/workflows.yaml`;
export const HOOKS_YAML = `${AGENTS_DIR}/hooks.yaml`;
export const PLATFORMS_YAML = `${AGENTS_DIR}/platforms.yaml`;
export const SETTINGS_YAML = `${AGENTS_DIR}/settings.yaml`;
export const TEMPLATE_DIR = `${AGENTS_DIR}/templates`;
export const CLAUDE_AGENTS_DIR = '.claude/agents';
export const CODEX_AGENTS_DIR = '.codex/agents';
export const CODEX_CONFIG = '.codex/config.toml';
export const SETTINGS_JSON = '.claude/settings.json';
export const LAUNCH_JSON = '.claude/launch.json';
export const AGENTS_MD = 'AGENTS.md';
export const GENERATED_HEADER =
  '<!-- GENERATED FROM .agents/ — DO NOT EDIT MANUALLY -->';

// ---------------------------------------------------------------------------
// YAML helpers
// ---------------------------------------------------------------------------

export function readYaml<T>(tree: Tree, path: string): T {
  const content = tree.read(path, 'utf-8');
  if (!content) {
    throw new Error(`Cannot read YAML file: ${path}`);
  }
  return parseYaml(content) as T;
}

export function writeYaml(tree: Tree, path: string, data: unknown): void {
  // Preserve the comment header if the file already exists
  const existing = tree.read(path, 'utf-8');
  let header = '';
  if (existing) {
    const lines = existing.split('\n');
    const headerLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('#') || line.trim() === '') {
        headerLines.push(line);
      } else {
        break;
      }
    }
    if (headerLines.length > 0) {
      header = headerLines.join('\n') + '\n';
    }
  }
  const yamlContent = stringifyYaml(data, {
    lineWidth: 0, // no wrapping
    blockQuote: 'literal',
  });
  tree.write(path, header + yamlContent);
}

// ---------------------------------------------------------------------------
// Registry readers
// ---------------------------------------------------------------------------

export function readAgentsRegistry(tree: Tree): AgentsRegistry {
  return readYaml<AgentsRegistry>(tree, AGENTS_YAML);
}

export function readWorkflowsRegistry(tree: Tree): WorkflowsRegistry {
  return readYaml<WorkflowsRegistry>(tree, WORKFLOWS_YAML);
}

export function readHooksRegistry(tree: Tree): HooksRegistry {
  return readYaml<HooksRegistry>(tree, HOOKS_YAML);
}

export function readSkillsRegistry(tree: Tree): SkillsRegistry {
  return readYaml<SkillsRegistry>(tree, SKILLS_YAML);
}

export function readPlatformsRegistry(tree: Tree): PlatformsRegistry {
  return readYaml<PlatformsRegistry>(tree, PLATFORMS_YAML);
}

export function readSettingsRegistry(tree: Tree): SettingsRegistry {
  return readYaml<SettingsRegistry>(tree, SETTINGS_YAML);
}

// ---------------------------------------------------------------------------
// Template readers
// ---------------------------------------------------------------------------

export function readAgentTemplate(tree: Tree, name: string): string | null {
  const path = `${TEMPLATE_DIR}/${name}.md.tpl`;
  if (!tree.exists(path)) {
    logger.warn(`Agent template not found: ${path}`);
    return null;
  }
  return tree.read(path, 'utf-8') ?? null;
}

export function readSkillTemplate(tree: Tree, name: string): string | null {
  const path = `${TEMPLATE_DIR}/${name}.md.tpl`;
  if (!tree.exists(path)) {
    return null;
  }
  return tree.read(path, 'utf-8') ?? null;
}

// ---------------------------------------------------------------------------
// Claude-specific section stripping
// ---------------------------------------------------------------------------

/**
 * Strip Claude-agent-specific sections from a template body.
 * Removes the "## First action — verify worktree" section (from that heading
 * up to — but not including — the next ## heading).
 */
export function stripClaudeSections(body: string): string {
  // Remove "## First action — verify worktree" section
  // Match from that heading to just before the next ## heading (or end of string)
  const pattern = /## First action — verify worktree[\s\S]*?(?=\n## |\n# |$)/;
  let result = body.replace(pattern, '');
  // Clean up double blank lines left behind
  result = result.replace(/\n{3,}/g, '\n\n');
  return result;
}

// ---------------------------------------------------------------------------
// Frontmatter builder
// ---------------------------------------------------------------------------

/**
 * Build YAML frontmatter string for an agent markdown file.
 * Matches the existing format: tools as comma-separated string, description
 * as YAML block scalar (>).
 */
export function buildAgentFrontmatter(name: string, agent: AgentEntry): string {
  const lines: string[] = [];
  lines.push(`name: ${name}`);

  // Description uses YAML block scalar (>)
  const descriptionLines = agent.description
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  lines.push('description: >');
  for (const line of descriptionLines) {
    lines.push(`  ${line}`);
  }

  lines.push(`model: ${agent.model}`);

  // Tools as comma-separated string
  const toolsStr = Array.isArray(agent.tools)
    ? agent.tools.join(', ')
    : String(agent.tools);
  lines.push(`tools: ${toolsStr}`);

  lines.push(`permissionMode: ${agent.permissionMode}`);

  if (agent.maxTurns !== undefined && agent.maxTurns !== null) {
    lines.push(`maxTurns: ${agent.maxTurns}`);
  }

  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Template variable replacement
// ---------------------------------------------------------------------------

/**
 * Replace {{AGENT_NAME}} placeholder in template body with the display name.
 */
export function resolveTemplateVars(
  body: string,
  vars: Record<string, string>
): string {
  let result = body;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Convert kebab-case slug to Title Case display name.
 */
export function toTitleCase(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert kebab-case slug to PascalCase (no spaces).
 */
export function toPascalCase(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// ---------------------------------------------------------------------------
// File listing helpers
// ---------------------------------------------------------------------------

/**
 * List all .md files in a tree directory (non-recursive).
 */
export function listMdFiles(tree: Tree, dir: string): string[] {
  if (!tree.exists(dir)) {
    return [];
  }
  return tree.children(dir).filter((f) => f.endsWith('.md'));
}

/**
 * List all subdirectories in a tree directory (non-recursive).
 */
export function listDirs(tree: Tree, dir: string): string[] {
  if (!tree.exists(dir)) {
    return [];
  }
  return tree.children(dir).filter((f) => tree.isFile(`${dir}/${f}`) === false);
}

/**
 * List all .md.tpl files in a tree directory (non-recursive).
 */
export function listTemplateFiles(tree: Tree, dir: string): string[] {
  if (!tree.exists(dir)) {
    return [];
  }
  return tree.children(dir).filter((f) => f.endsWith('.md.tpl'));
}
