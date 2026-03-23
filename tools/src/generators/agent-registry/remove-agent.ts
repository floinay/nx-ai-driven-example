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

  if (!name) throw new Error('Agent name is required.');

  const registry = readAgentsRegistry(tree);

  if (!registry.agents[name]) {
    throw new Error(`Agent "${name}" not found in registry.`);
  }

  delete registry.agents[name];
  writeYaml(tree, AGENTS_YAML, registry);
  logger.info(`remove-agent: removed "${name}" from agents.yaml.`);

  const templatePath = `${TEMPLATE_DIR}/${name}.md.tpl`;
  if (tree.exists(templatePath)) {
    tree.delete(templatePath);
    logger.info(`remove-agent: deleted ${templatePath}`);
  }

  await syncAll(tree, {});
}
