/**
 * remove-agent generator
 *
 * Removes an agent from agents.yaml, deletes its templates, and runs sync-all
 * (which will delete the derived agent file and skill file).
 */
import { Tree, logger } from '@nx/devkit';

import type { RemoveAgentSchema } from './types';
import {
  readAgentsRegistry,
  writeYaml,
  AGENTS_YAML,
  TEMPLATE_DIR,
} from './utils';
import syncAll from './sync-all';

export default async function removeAgent(
  tree: Tree,
  schema: RemoveAgentSchema
): Promise<void> {
  const { name } = schema;

  if (!name) {
    throw new Error('Agent name is required.');
  }

  const registry = readAgentsRegistry(tree);

  if (!registry.agents[name]) {
    throw new Error(`Agent "${name}" not found in registry.`);
  }

  // Remove from registry
  delete registry.agents[name];
  writeYaml(tree, AGENTS_YAML, registry);
  logger.info(`remove-agent: removed "${name}" from agents.yaml.`);

  // Delete unified template
  const templatePath = `${TEMPLATE_DIR}/${name}.md.tpl`;
  if (tree.exists(templatePath)) {
    tree.delete(templatePath);
    logger.info(`remove-agent: deleted ${templatePath}`);
  }

  // Run full sync (will remove derived .claude/agents/<name>.md)
  await syncAll(tree, {});
}
