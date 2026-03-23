import { Tree, logger } from '@nx/devkit';
import type { UpdateAgentSchema } from './types';
import { readAgentsRegistry, writeYaml, AGENTS_YAML } from './utils';
import syncAll from './sync-all';

export default async function updateAgent(
  tree: Tree,
  schema: UpdateAgentSchema
): Promise<void> {
  const { name, model, tools, description, permissionMode } = schema;

  if (!name) throw new Error('Agent name is required.');

  const registry = readAgentsRegistry(tree);

  if (!registry.agents[name]) {
    throw new Error(`Agent "${name}" not found. Use add-agent to create it.`);
  }

  const agent = registry.agents[name];

  if (model !== undefined) agent.model = model;
  if (tools !== undefined) {
    agent.tools = tools.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (description !== undefined) agent.description = description;
  if (permissionMode !== undefined) agent.permissionMode = permissionMode;

  writeYaml(tree, AGENTS_YAML, registry);
  logger.info(`update-agent: updated "${name}" in agents.yaml.`);

  await syncAll(tree, {});
}
