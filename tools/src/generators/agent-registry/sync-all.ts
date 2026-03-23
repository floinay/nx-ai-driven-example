/**
 * sync-all generator
 *
 * Runs all sync generators in sequence: agents, skills, commands, settings, codex.
 */
import { Tree, logger } from '@nx/devkit';

import type { SyncAllSchema } from './types';
import syncAgents from './sync-agents';
import syncSkills from './sync-skills';
import syncCommands from './sync-commands';
import syncSettings from './sync-settings';
import syncCodex from './sync-codex';
import syncDashboard from './sync-dashboard';

export default async function syncAll(
  tree: Tree,
  _schema: SyncAllSchema
): Promise<void> {
  logger.info('sync-all: starting full registry sync...');

  await syncAgents(tree, {});
  await syncSkills(tree, {});
  await syncCommands(tree, {});
  await syncSettings(tree, {});
  await syncCodex(tree, {});
  await syncDashboard(tree, {});

  logger.info('sync-all: complete.');
}
