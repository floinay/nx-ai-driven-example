import { Tree, logger } from '@nx/devkit';
import type { SyncAgentsSchema } from './types';
import {
  readAgentsRegistry,
  readAgentTemplate,
  buildAgentFrontmatter,
  resolveTemplateVars,
  toTitleCase,
  CLAUDE_AGENTS_DIR,
  GENERATED_HEADER,
  listMdFiles,
} from './utils';

export default async function syncAgents(
  tree: Tree,
  _schema: SyncAgentsSchema
): Promise<void> {
  const registry = readAgentsRegistry(tree);
  const agents = registry.agents;

  if (!agents || Object.keys(agents).length === 0) {
    logger.warn('No agents found in registry. Skipping sync-agents.');
    return;
  }

  if (!tree.exists(CLAUDE_AGENTS_DIR)) {
    tree.write(`${CLAUDE_AGENTS_DIR}/.gitkeep`, '');
  }

  const agentNames = new Set<string>();

  for (const [name, agent] of Object.entries(agents)) {
    agentNames.add(name);

    const templateBody = readAgentTemplate(tree, name);
    if (!templateBody) {
      logger.warn(
        `No template found for agent "${name}". Creating agent file with frontmatter only.`
      );
    }

    const frontmatter = buildAgentFrontmatter(name, agent);
    const displayName = toTitleCase(name);
    const body = templateBody
      ? resolveTemplateVars(templateBody, { AGENT_NAME: displayName })
      : `\n# ${displayName}\n\nNo body template found. Create one at .agents/templates/${name}.md.tpl\n`;

    const content = `---\n${frontmatter}---\n\n${GENERATED_HEADER}\n${body}`;
    tree.write(`${CLAUDE_AGENTS_DIR}/${name}.md`, content);
  }

  const existingFiles = listMdFiles(tree, CLAUDE_AGENTS_DIR);
  for (const file of existingFiles) {
    const agentName = file.replace('.md', '');
    if (!agentNames.has(agentName)) {
      logger.info(`Removing orphaned agent file: ${CLAUDE_AGENTS_DIR}/${file}`);
      tree.delete(`${CLAUDE_AGENTS_DIR}/${file}`);
    }
  }

  logger.info(`sync-agents: wrote ${agentNames.size} agent file(s).`);
}
