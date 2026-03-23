import { execSync } from 'child_process';
import { Tree, logger } from '@nx/devkit';
import type { FinishTaskSchema } from './types';
import updateSpec from './update-spec';

export default async function finishTask(
  tree: Tree,
  schema: FinishTaskSchema
): Promise<void> {
  const { slug } = schema;

  if (!slug) {
    throw new Error('Task slug is required.');
  }

  const worktreePath = `.claude/worktrees/${slug}`;

  // Remove worktree
  try {
    logger.info(`finish-task: removing worktree at "${worktreePath}".`);
    execSync(`git worktree remove ${worktreePath}`, { stdio: 'inherit' });
  } catch (e) {
    logger.warn(
      `finish-task: worktree removal failed: ${
        e instanceof Error ? e.message : String(e)
      }. You may need to remove it manually.`
    );
  }

  await updateSpec(tree, { slug, status: 'done' });
  logger.info(`finish-task: task "${slug}" complete.`);
}
