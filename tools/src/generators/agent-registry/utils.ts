/**
 * Shared utilities for agent-registry generators.
 * Claude-only version.
 */
import { Tree, logger } from '@nx/devkit';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import type {
  AgentsRegistry,
  AgentEntry,
  HooksRegistry,
  WorkflowsRegistry,
  SettingsRegistry,
} from './types';

// Constants
export const AGENTS_DIR = '.agents';
export const AGENTS_YAML = `${AGENTS_DIR}/agents.yaml`;
export const WORKFLOWS_YAML = `${AGENTS_DIR}/workflows.yaml`;
export const HOOKS_YAML = `${AGENTS_DIR}/hooks.yaml`;
export const SETTINGS_YAML = `${AGENTS_DIR}/settings.yaml`;
export const TEMPLATE_DIR = `${AGENTS_DIR}/templates`;
export const CLAUDE_AGENTS_DIR = '.claude/agents';
export const SETTINGS_JSON = '.claude/settings.json';
export const LAUNCH_JSON = '.claude/launch.json';
export const AGENTS_MD = 'AGENTS.md';
export const GENERATED_HEADER =
  '<!-- GENERATED FROM .agents/ — DO NOT EDIT MANUALLY -->';

// YAML helpers
export function readYaml<T>(tree: Tree, path: string): T {
  const content = tree.read(path, 'utf-8');
  if (!content) {
    throw new Error(`Cannot read YAML file: ${path}`);
  }
  return parseYaml(content) as T;
}

export function writeYaml(tree: Tree, path: string, data: unknown): void {
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
    lineWidth: 0,
    blockQuote: 'literal',
  });
  tree.write(path, header + yamlContent);
}

// Registry readers
export function readAgentsRegistry(tree: Tree): AgentsRegistry {
  return readYaml<AgentsRegistry>(tree, AGENTS_YAML);
}

export function readWorkflowsRegistry(tree: Tree): WorkflowsRegistry {
  return readYaml<WorkflowsRegistry>(tree, WORKFLOWS_YAML);
}

export function readHooksRegistry(tree: Tree): HooksRegistry {
  return readYaml<HooksRegistry>(tree, HOOKS_YAML);
}

export function readSettingsRegistry(tree: Tree): SettingsRegistry {
  return readYaml<SettingsRegistry>(tree, SETTINGS_YAML);
}

// Template readers
export function readAgentTemplate(tree: Tree, name: string): string | null {
  const path = `${TEMPLATE_DIR}/${name}.md.tpl`;
  if (!tree.exists(path)) {
    logger.warn(`Agent template not found: ${path}`);
    return null;
  }
  return tree.read(path, 'utf-8') ?? null;
}

// Frontmatter builder
export function buildAgentFrontmatter(name: string, agent: AgentEntry): string {
  const lines: string[] = [];
  lines.push(`name: ${name}`);

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

// Template variable replacement
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

export function toTitleCase(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// File listing helpers
export function listMdFiles(tree: Tree, dir: string): string[] {
  if (!tree.exists(dir)) {
    return [];
  }
  return tree.children(dir).filter((f) => f.endsWith('.md'));
}

export function listDirs(tree: Tree, dir: string): string[] {
  if (!tree.exists(dir)) {
    return [];
  }
  return tree.children(dir).filter((f) => tree.isFile(`${dir}/${f}`) === false);
}
