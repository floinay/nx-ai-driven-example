import { Tree, logger } from '@nx/devkit';
import type { CreateSpecSchema } from './types';
import { toTitleCase } from './utils';
import syncDashboard from './sync-dashboard';

const SPECS_DIR = '.agents/specs';
const TEMPLATE_PATH = `${SPECS_DIR}/TEMPLATE.md`;

const VALID_STATUSES = ['stub', 'draft'] as const;

export default async function createSpec(
  tree: Tree,
  schema: CreateSpecSchema
): Promise<void> {
  const { slug, goal } = schema;
  const status =
    ((schema as Record<string, unknown>).status as string) ?? 'stub';
  const milestone =
    ((schema as Record<string, unknown>).milestone as string) ?? 'backlog';

  if (!slug) throw new Error('Spec slug is required.');
  if (!goal) throw new Error('Spec goal is required.');
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    throw new Error(
      `Invalid status "${status}". New specs must be one of: ${VALID_STATUSES.join(', ')}`
    );
  }

  const specPath = `${SPECS_DIR}/${slug}.md`;
  if (tree.exists(specPath)) {
    throw new Error(`Spec "${slug}" already exists at ${specPath}.`);
  }

  const template = tree.read(TEMPLATE_PATH, 'utf-8');
  if (!template) throw new Error(`Template not found at ${TEMPLATE_PATH}.`);

  const title = toTitleCase(slug);
  let content = template;

  content = content.replace(/^status: stub$/m, `status: ${status}`);
  content = content.replace(/^milestone: backlog$/m, `milestone: ${milestone}`);
  content = content.replace(/^# Title$/m, `# ${title}`);
  content = content.replace(
    /^One sentence: what does "done" look like\?$/m,
    goal
  );
  content = content.replace(/^<!-- .+ -->\n?/gm, '');

  tree.write(specPath, content);
  logger.info(`create-spec: created ${specPath} (status: ${status})`);

  await syncDashboard(tree, {});
}
