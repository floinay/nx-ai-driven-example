/**
 * sync-dashboard generator
 *
 * Reads all spec files from .agents/specs/ and generates INDEX.md —
 * a dashboard grouped by milestone with progress stats.
 *
 * INDEX.md is a derived file; do not edit it manually.
 */
import { Tree, logger } from '@nx/devkit';

import type { SyncDashboardSchema } from './types';
import { AGENTS_DIR, GENERATED_HEADER } from './utils';

const SPECS_DIR = `${AGENTS_DIR}/specs`;
const INDEX_PATH = `${SPECS_DIR}/INDEX.md`;

// Size → estimated hours midpoint (for milestone aggregation)
const SIZE_HOURS: Record<string, number> = {
  XS: 1.5,
  S: 4.5,
  M: 12,
  L: 24,
  XL: 40,
};

interface SpecMeta {
  slug: string;
  status: string;
  milestone: string | null;
  size: string | null;
  dependsOn: string[];
}

/**
 * Parse YAML frontmatter from a spec file.
 * Handles the --- delimited block at the top of the file.
 */
function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm: Record<string, unknown> = {};
  const lines = match[1].split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kvMatch = line.match(/^(\S+):\s*(.*)/);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    let value: unknown = kvMatch[2].trim();

    // Handle YAML arrays (inline [] or multi-line -)
    if (value === '[]') {
      fm[key] = [];
      continue;
    }

    // Multi-line array
    if (value === '' || value === undefined) {
      const arr: string[] = [];
      while (i + 1 < lines.length && lines[i + 1].match(/^\s+-\s+/)) {
        i++;
        const itemMatch = lines[i].match(/^\s+-\s+(.*)/);
        if (itemMatch) arr.push(itemMatch[1].trim());
      }
      if (arr.length > 0) {
        fm[key] = arr;
        continue;
      }
    }

    // Handle null
    if (value === 'null') {
      fm[key] = null;
      continue;
    }

    fm[key] = value;
  }

  return fm;
}

/**
 * Extract the H1 title from the spec body (first # line).
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

export default async function syncDashboard(
  tree: Tree,
  _schema: SyncDashboardSchema
): Promise<void> {
  if (!tree.exists(SPECS_DIR)) {
    logger.warn('No .agents/specs/ directory found. Skipping sync-dashboard.');
    return;
  }

  const files = tree
    .children(SPECS_DIR)
    .filter(
      (f) =>
        f.endsWith('.md') &&
        f !== 'INDEX.md' &&
        f !== 'TEMPLATE.md' &&
        tree.isFile(`${SPECS_DIR}/${f}`)
    );

  // Parse all specs
  const specs: SpecMeta[] = [];
  for (const file of files) {
    const content = tree.read(`${SPECS_DIR}/${file}`, 'utf-8');
    if (!content) continue;

    const fm = parseFrontmatter(content);

    // Skip legacy specs
    if (fm['type'] === 'legacy') continue;

    const slug = file.replace('.md', '');
    specs.push({
      slug,
      status: (fm['status'] as string) ?? 'stub',
      milestone: (fm['milestone'] as string) ?? null,
      size: (fm['size'] as string) ?? null,
      dependsOn: Array.isArray(fm['depends-on'])
        ? (fm['depends-on'] as string[])
        : [],
    });
  }

  // Group by milestone
  const milestoneMap = new Map<string, SpecMeta[]>();
  const noMilestone: SpecMeta[] = [];

  for (const spec of specs) {
    if (spec.milestone && spec.milestone !== 'backlog') {
      const key = spec.milestone;
      if (!milestoneMap.has(key)) milestoneMap.set(key, []);
      milestoneMap.get(key)!.push(spec);
    } else {
      noMilestone.push(spec);
    }
  }

  // Sort milestones naturally (M0, M1, M2, ...)
  const sortedMilestones = [...milestoneMap.keys()].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;
    return numA - numB;
  });

  // Compute totals
  const total = specs.length;
  const statusCounts: Record<string, number> = {};
  for (const spec of specs) {
    statusCounts[spec.status] = (statusCounts[spec.status] ?? 0) + 1;
  }

  // Find focus specs (in-progress)
  const focusSpecs = specs.filter((s) => s.status === 'in-progress');

  // Build dashboard
  const lines: string[] = [];
  lines.push(GENERATED_HEADER);
  lines.push('');
  lines.push('# Spec Dashboard');
  lines.push('');

  // Summary line
  const parts = [`Specs: ${total}`];
  for (const status of ['done', 'in-progress', 'ready', 'draft', 'stub']) {
    if (statusCounts[status]) {
      parts.push(`${status}: ${statusCounts[status]}`);
    }
  }
  lines.push(parts.join(' | '));
  lines.push('');

  // Focus section
  if (focusSpecs.length > 0) {
    lines.push('## Focus (in-progress)');
    lines.push('');
    lines.push('| Spec | Milestone | Size | Status |');
    lines.push('| ---- | --------- | ---- | ------ |');
    for (const spec of focusSpecs) {
      lines.push(
        `| [${spec.slug}](${spec.slug}.md) | ${spec.milestone ?? '—'} | ${
          spec.size ?? '—'
        } | ${spec.status} |`
      );
    }
    lines.push('');
  }

  // Per-milestone sections
  for (const milestone of sortedMilestones) {
    const msSpecs = milestoneMap.get(milestone)!;
    const done = msSpecs.filter((s) => s.status === 'done').length;
    const estHours = msSpecs.reduce((sum, s) => {
      if (s.status === 'done' || !s.size) return sum;
      return sum + (SIZE_HOURS[s.size.toUpperCase()] ?? 0);
    }, 0);

    let heading = `## ${milestone} (${done}/${msSpecs.length} done`;
    if (estHours > 0) heading += `, ~${Math.round(estHours)}h remaining`;
    heading += ')';
    lines.push(heading);
    lines.push('');
    lines.push('| Spec | Size | Status | Depends-on |');
    lines.push('| ---- | ---- | ------ | ---------- |');

    // Sort: in-progress first, then ready, draft, stub, done last
    const statusOrder: Record<string, number> = {
      'in-progress': 0,
      ready: 1,
      draft: 2,
      stub: 3,
      done: 4,
    };
    msSpecs.sort(
      (a, b) =>
        (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3) ||
        a.slug.localeCompare(b.slug)
    );

    for (const spec of msSpecs) {
      const deps = spec.dependsOn.length > 0 ? spec.dependsOn.join(', ') : '—';
      lines.push(
        `| [${spec.slug}](${spec.slug}.md) | ${spec.size ?? '—'} | ${
          spec.status
        } | ${deps} |`
      );
    }
    lines.push('');
  }

  // Backlog section (specs with milestone: backlog or null)
  if (noMilestone.length > 0) {
    const done = noMilestone.filter((s) => s.status === 'done').length;
    lines.push(`## Backlog (${done}/${noMilestone.length} done)`);
    lines.push('');
    lines.push('| Spec | Size | Status | Depends-on |');
    lines.push('| ---- | ---- | ------ | ---------- |');

    const statusOrder: Record<string, number> = {
      'in-progress': 0,
      ready: 1,
      draft: 2,
      stub: 3,
      done: 4,
    };
    noMilestone.sort(
      (a, b) =>
        (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3) ||
        a.slug.localeCompare(b.slug)
    );

    for (const spec of noMilestone) {
      const deps = spec.dependsOn.length > 0 ? spec.dependsOn.join(', ') : '—';
      lines.push(
        `| [${spec.slug}](${spec.slug}.md) | ${spec.size ?? '—'} | ${
          spec.status
        } | ${deps} |`
      );
    }
    lines.push('');
  }

  tree.write(INDEX_PATH, lines.join('\n'));
  logger.info(`sync-dashboard: wrote ${INDEX_PATH} (${specs.length} specs).`);
}
