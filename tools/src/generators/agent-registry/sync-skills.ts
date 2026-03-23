import { Tree, logger } from '@nx/devkit';
import type { SyncSkillsSchema } from './types';
import {
  readWorkflowsRegistry,
  AGENTS_DIR,
  GENERATED_HEADER,
  listDirs,
} from './utils';

const SKILLS_SOURCE_DIR = `${AGENTS_DIR}/skills`;
const CLAUDE_SKILLS_DIR = '.claude/skills';

export default async function syncSkills(
  tree: Tree,
  _schema: SyncSkillsSchema
): Promise<void> {
  if (!tree.exists(SKILLS_SOURCE_DIR)) {
    logger.warn('No .agents/skills/ directory found. Skipping sync-skills.');
    return;
  }

  const sourceFiles = tree
    .children(SKILLS_SOURCE_DIR)
    .filter(
      (f) => f.endsWith('.md') && tree.isFile(`${SKILLS_SOURCE_DIR}/${f}`)
    );

  if (sourceFiles.length === 0) {
    logger.warn('No skill source files found in .agents/skills/. Skipping.');
    return;
  }

  const workflowsRegistry = readWorkflowsRegistry(tree);
  const commandNames = new Set(
    Object.values(workflowsRegistry.workflows)
      .filter((w) => w.slash_command)
      .map((w) => w.slash_command!.name)
  );

  const writtenSkills = new Set<string>();
  let count = 0;

  for (const file of sourceFiles) {
    const name = file.replace('.md', '');
    const sourcePath = `${SKILLS_SOURCE_DIR}/${file}`;
    const body = tree.read(sourcePath, 'utf-8');
    if (!body) continue;

    const content = `${body}\n\n${GENERATED_HEADER}\n`;
    tree.write(`${CLAUDE_SKILLS_DIR}/${name}/SKILL.md`, content);
    writtenSkills.add(name);
    count++;
  }

  // Orphan cleanup
  const existingDirs = listDirs(tree, CLAUDE_SKILLS_DIR);
  for (const dir of existingDirs) {
    if (writtenSkills.has(dir)) continue;
    if (commandNames.has(dir)) continue;

    const skillPath = `${CLAUDE_SKILLS_DIR}/${dir}/SKILL.md`;
    if (!tree.exists(skillPath)) continue;

    const fileContent = tree.read(skillPath, 'utf-8');
    if (fileContent && fileContent.includes(GENERATED_HEADER)) {
      logger.info(`Removing orphaned generated skill: ${skillPath}`);
      tree.delete(skillPath);
    }
  }

  logger.info(`sync-skills: wrote ${count} skill(s) to .claude/skills/.`);
}
