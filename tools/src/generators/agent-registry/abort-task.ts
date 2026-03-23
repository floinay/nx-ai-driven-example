import { execSync } from 'child_process';
import { Tree, logger } from '@nx/devkit';
import type { AbortTaskSchema } from './types';

export default async function abortTask(
  tree: Tree,
  schema: AbortTaskSchema
): Promise<void> {
  const { slug } = schema;

  if (!slug) {
    throw new Error('Task slug is required.');
  }

  const worktreePath = `.claude/worktrees/${slug}`;
  const branchName = `task/${slug}`;

  try {
    logger.info(`abort-task: removing worktree at "${worktreePath}".`);
    execSync(`git worktree remove ${worktreePath} --force`, { stdio: 'inherit' });
  } catch (e) {
    logger.warn(
      `abort-task: worktree removal failed: ${
        e instanceof Error ? e.message : String(e)
      }. It may not exist or was already removed.`
    );
  }

  try {
    logger.info(`abort-task: deleting branch "${branchName}".`);
    execSync(`git branch -D ${branchName}`, { stdio: 'inherit' });
  } catch (e) {
    logger.warn(
      `abort-task: branch deletion failed: ${
        e instanceof Error ? e.message : String(e)
      }. Branch may not exist.`
    );
  }

  logger.info(`abort-task: task "${slug}" aborted and cleaned up.`);
}
