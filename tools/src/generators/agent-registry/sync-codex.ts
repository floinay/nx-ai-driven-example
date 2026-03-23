/**
 * sync-codex generator
 *
 * Generates Codex CLI configuration from the agent registry:
 * 1. `.codex/config.toml` — agent definitions in Codex TOML format
 * 2. `.codex/agents/*.md` — instruction files (plain markdown from templates)
 *
 * Reads agents.yaml for agent definitions and platforms.yaml for model mapping.
 */
import { Tree, logger } from '@nx/devkit';

import type { SyncCodexSchema } from './types';
import {
  readAgentsRegistry,
  readPlatformsRegistry,
  readAgentTemplate,
  resolveTemplateVars,
  stripClaudeSections,
  toTitleCase,
  CODEX_AGENTS_DIR,
  CODEX_CONFIG,
  GENERATED_HEADER,
  listMdFiles,
} from './utils';

/**
 * Escape a string for TOML: wrap in triple-quoted string if it contains
 * newlines or quotes, otherwise use basic quoted string.
 */
function tomlString(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.includes('"') || trimmed.includes('\n')) {
    return `"""\n${trimmed}\n"""`;
  }
  return `"${trimmed}"`;
}

/**
 * Build the .codex/config.toml content from the agent registry and platform config.
 */
function buildConfigToml(
  agents: Record<
    string,
    {
      description: string;
      model: string;
      tools: string[];
      permissionMode: string;
    }
  >,
  platforms: {
    codex: {
      models: Record<string, { model: string; reasoning_effort: string }>;
      permissions: Record<string, string>;
      max_depth: number;
    };
  }
): string {
  const lines: string[] = [];
  lines.push('# GENERATED FROM .agents/ — DO NOT EDIT MANUALLY');
  lines.push('');
  lines.push('[agents]');
  lines.push(`max_depth = ${platforms.codex.max_depth}`);
  lines.push('');

  for (const [name, agent] of Object.entries(agents)) {
    const modelConfig = platforms.codex.models[agent.model] ?? {
      model: 'gpt-4.1',
      reasoning_effort: 'medium',
    };
    const sandboxMode =
      platforms.codex.permissions[agent.permissionMode] ?? 'workspace-read';

    lines.push('[[agents.custom]]');
    lines.push(`name = "${name}"`);
    lines.push(`description = ${tomlString(agent.description)}`);
    lines.push(`model = "${modelConfig.model}"`);
    lines.push(`model_reasoning_effort = "${modelConfig.reasoning_effort}"`);
    lines.push(`sandbox_mode = "${sandboxMode}"`);
    lines.push(`developer_instructions = "${CODEX_AGENTS_DIR}/${name}.md"`);
    lines.push('');
  }

  return lines.join('\n');
}

export default async function syncCodex(
  tree: Tree,
  _schema: SyncCodexSchema
): Promise<void> {
  const registry = readAgentsRegistry(tree);
  const agents = registry.agents;

  if (!agents || Object.keys(agents).length === 0) {
    logger.warn('No agents found in registry. Skipping sync-codex.');
    return;
  }

  let platforms;
  try {
    platforms = readPlatformsRegistry(tree);
  } catch {
    logger.warn('platforms.yaml not found or invalid. Skipping sync-codex.');
    return;
  }

  // Ensure output directories exist
  if (!tree.exists(CODEX_AGENTS_DIR)) {
    tree.write(`${CODEX_AGENTS_DIR}/.gitkeep`, '');
  }

  // 1. Generate .codex/config.toml
  const configContent = buildConfigToml(agents, platforms);
  tree.write(CODEX_CONFIG, configContent);

  // 2. Generate .codex/agents/*.md from templates
  const agentNames = new Set<string>();
  let count = 0;

  for (const name of Object.keys(agents)) {
    agentNames.add(name);

    const templateBody = readAgentTemplate(tree, name);
    if (!templateBody) {
      logger.warn(
        `No template found for agent "${name}". Skipping Codex instruction file.`
      );
      continue;
    }

    const displayName = toTitleCase(name);
    let body = resolveTemplateVars(templateBody, { AGENT_NAME: displayName });
    body = stripClaudeSections(body);

    const content = `${GENERATED_HEADER}\n${body}`;
    tree.write(`${CODEX_AGENTS_DIR}/${name}.md`, content);
    count++;
  }

  // Clean up orphaned Codex agent files
  const existingFiles = listMdFiles(tree, CODEX_AGENTS_DIR);
  for (const file of existingFiles) {
    const agentName = file.replace('.md', '');
    if (!agentNames.has(agentName)) {
      logger.info(
        `Removing orphaned Codex agent file: ${CODEX_AGENTS_DIR}/${file}`
      );
      tree.delete(`${CODEX_AGENTS_DIR}/${file}`);
    }
  }

  logger.info(
    `sync-codex: wrote config.toml and ${count} instruction file(s).`
  );
}
