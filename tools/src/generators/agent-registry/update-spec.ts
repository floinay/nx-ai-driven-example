import { Tree, logger } from '@nx/devkit';
import type { UpdateSpecSchema } from './types';
const SPECS_DIR = '.claude/specs';

const VALID_STATUSES = [
  'stub', 'draft', 'ready', 'in-progress', 'done',
] as const;

function normalizeStatus(status: string): string {
  const legacyMap: Record<string, string> = {
    DRAFT: 'draft',
    APPROVED: 'ready',
    IN_PROGRESS: 'in-progress',
    COMPLETE: 'done',
  };
  return legacyMap[status] ?? status;
}

export default async function updateSpec(
  tree: Tree,
  schema: UpdateSpecSchema
): Promise<void> {
  const { slug } = schema;

  if (!slug) throw new Error('Spec slug is required.');

  const specPath = `${SPECS_DIR}/${slug}.md`;
  if (!tree.exists(specPath)) throw new Error(`Spec not found at ${specPath}.`);

  let content = tree.read(specPath, 'utf-8');
  if (!content) throw new Error(`Spec at ${specPath} is empty.`);

  const updates: string[] = [];

  if (schema.status) {
    const status = normalizeStatus(schema.status);
    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      throw new Error(
        `Invalid status "${schema.status}". Must be one of: ${VALID_STATUSES.join(', ')}`
      );
    }
    content = content.replace(/^status:\s*.+$/m, `status: ${status}`);
    updates.push(`status: ${status}`);
  }

  if ((schema as Record<string, unknown>).milestone !== undefined) {
    const milestone = (schema as Record<string, unknown>).milestone as string;
    content = content.replace(/^milestone:\s*.+$/m, `milestone: ${milestone}`);
    updates.push(`milestone: ${milestone}`);
  }

  if ((schema as Record<string, unknown>).size !== undefined) {
    const size = (schema as Record<string, unknown>).size as string;
    content = content.replace(/^size:\s*.+$/m, `size: ${size}`);
    updates.push(`size: ${size}`);
  }

  if (updates.length === 0) {
    logger.warn(`update-spec: no fields to update for "${slug}".`);
    return;
  }

  tree.write(specPath, content);
  logger.info(`update-spec: "${slug}" → ${updates.join(', ')}`);
}
