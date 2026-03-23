/**
 * add-agent generator
 *
 * Adds a new agent entry to agents.yaml, creates template files, and runs sync-all.
 */
import { Tree, logger } from '@nx/devkit';

import type { AddAgentSchema } from './types';
import {
  readAgentsRegistry,
  writeYaml,
  AGENTS_YAML,
  TEMPLATE_DIR,
} from './utils';
import syncAll from './sync-all';

export default async function addAgent(
  tree: Tree,
  schema: AddAgentSchema
): Promise<void> {
  const {
    name,
    model,
    tools,
    description,
    permissionMode = 'default',
  } = schema;

  if (!name) {
    throw new Error('Agent name is required.');
  }

  const registry = readAgentsRegistry(tree);

  if (registry.agents[name]) {
    throw new Error(
      `Agent "${name}" already exists in the registry. Use update-agent to modify it.`
    );
  }

  // Parse tools from comma-separated string to array
  const toolsArray = tools
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // Add agent with provided metadata and sensible defaults
  registry.agents[name] = {
    description,
    model,
    tools: toolsArray,
    permissionMode,
    spawned_by: 'lead',
    spawned_after: [],
    workflows: ['AD_HOC'],
    files_modified: [],
    signals: {
      emits: [`${name}: DONE`],
    },
  };

  writeYaml(tree, AGENTS_YAML, registry);
  logger.info(`add-agent: added "${name}" to agents.yaml.`);

  // Create unified template if it does not exist
  const templatePath = `${TEMPLATE_DIR}/${name}.md.tpl`;
  if (!tree.exists(templatePath)) {
    const displayName = name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    tree.write(
      templatePath,
      `\n# {{AGENT_NAME}}\n\n## Role\n\nDescribe the role of ${displayName} here.\n\n## First action — verify worktree\n\nBefore anything else, \`cd\` into the worktree path provided by the Lead and verify:\n\n\`\`\`bash\ncd <worktree-path> && pwd && git branch --show-current\n\`\`\`\n\nIf the CWD or branch doesn't match, stop and report to the Lead.\n\n## Inputs\n\n- List inputs.\n\n## Output\n\n- List expected outputs.\n\n## Boundaries\n\n- List boundaries.\n`
    );
    logger.info(`add-agent: created template at ${templatePath}`);
  }

  // Run full sync
  await syncAll(tree, {});
}
