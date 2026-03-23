import { execSync } from 'child_process';
import { Tree, logger } from '@nx/devkit';
import type { StartTaskSchema } from './types';
import updateSpec from './update-spec';

const SPECS_DIR = '.agents/specs';

export default async function startTask(
  tree: Tree,
  schema: StartTaskSchema
): Promise<void> {
  const { slug } = schema;

  if (!slug) {
    throw new Error('Task slug is required.');
  }

  const specPath = `${SPECS_DIR}/${slug}.md`;
  if (!tree.exists(specPath)) {
    throw new Error(
      `Spec not found at ${specPath}. Create a spec first with: nx g tools:create-spec ${slug}`
    );
  }

  const branchName = `task/${slug}`;
  const worktreePath = `.claude/worktrees/${slug}`;

  try {
    execSync(`git rev-parse --verify ${branchName}`, { stdio: 'pipe' });
    logger.info(`start-task: branch "${branchName}" already exists.`);
  } catch {
    logger.info(`start-task: creating branch "${branchName}" from main.`);
    execSync(`git branch ${branchName} main`, { stdio: 'inherit' });
  }

  try {
    const worktreeList = execSync('git worktree list --porcelain', {
      encoding: 'utf-8',
    });
    if (worktreeList.includes(worktreePath)) {
      logger.warn(
        `start-task: worktree at "${worktreePath}" already exists. Skipping creation.`
      );
    } else {
      logger.info(
        `start-task: creating worktree at "${worktreePath}" on branch "${branchName}".`
      );
      execSync(`git worktree add ${worktreePath} ${branchName}`, {
        stdio: 'inherit',
      });
    }
  } catch (e) {
    throw new Error(
      `Failed to create worktree: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  await updateSpec(tree, { slug, status: 'in-progress' });

  logger.info(`start-task: task "${slug}" is ready.`);
  logger.info(`  Branch: ${branchName}`);
  logger.info(`  Worktree: ${worktreePath}`);
}
