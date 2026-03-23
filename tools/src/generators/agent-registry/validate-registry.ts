import { Tree, logger } from '@nx/devkit';
import type { ValidateRegistrySchema, AgentEntry } from './types';
import {
  readAgentsRegistry,
  readHooksRegistry,
  readSettingsRegistry,
  readAgentTemplate,
  buildAgentFrontmatter,
  resolveTemplateVars,
  toTitleCase,
  CLAUDE_AGENTS_DIR,
  AGENTS_DIR,
  SETTINGS_JSON,
  GENERATED_HEADER,
  listMdFiles,
} from './utils';

interface ValidationError {
  file: string;
  message: string;
}

function expectedAgentContent(
  name: string,
  agent: AgentEntry,
  body: string | null
): string {
  const displayName = toTitleCase(name);
  const frontmatter = buildAgentFrontmatter(name, agent);
  const resolvedBody = body
    ? resolveTemplateVars(body, { AGENT_NAME: displayName })
    : `\n# ${displayName}\n\nNo body template found. Create one at .agents/templates/${name}.md.tpl\n`;
  return `---\n${frontmatter}---\n\n${GENERATED_HEADER}\n${resolvedBody}`;
}

function normalizeContent(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .trimEnd();
}

export default async function validateRegistry(
  tree: Tree,
  _schema: ValidateRegistrySchema
): Promise<void> {
  const errors: ValidationError[] = [];

  // 1. Validate agent files
  const registry = readAgentsRegistry(tree);
  const agents = registry.agents ?? {};

  for (const [name, agent] of Object.entries(agents)) {
    const filePath = `${CLAUDE_AGENTS_DIR}/${name}.md`;
    const templateBody = readAgentTemplate(tree, name);
    const expected = expectedAgentContent(name, agent, templateBody);

    if (!tree.exists(filePath)) {
      errors.push({ file: filePath, message: 'File missing (expected from registry).' });
      continue;
    }

    const actual = tree.read(filePath, 'utf-8') ?? '';
    if (normalizeContent(actual) !== normalizeContent(expected)) {
      errors.push({
        file: filePath,
        message: 'Content does not match registry. Run: nx g tools:sync-agents',
      });
    }
  }

  // Check for orphaned agent files
  const existingAgentFiles = listMdFiles(tree, CLAUDE_AGENTS_DIR);
  for (const file of existingAgentFiles) {
    const agentName = file.replace('.md', '');
    if (!agents[agentName]) {
      errors.push({
        file: `${CLAUDE_AGENTS_DIR}/${file}`,
        message: 'Orphaned agent file (not in registry). Run: nx g tools:sync-agents',
      });
    }
  }

  // 2. Validate skill source files
  const SKILLS_SOURCE_DIR = `${AGENTS_DIR}/skills`;
  const CLAUDE_SKILLS_DIR = '.claude/skills';

  if (tree.exists(SKILLS_SOURCE_DIR)) {
    const sourceFiles = tree
      .children(SKILLS_SOURCE_DIR)
      .filter(
        (f) => f.endsWith('.md') && tree.isFile(`${SKILLS_SOURCE_DIR}/${f}`)
      );

    for (const file of sourceFiles) {
      const name = file.replace('.md', '');
      const sourceContent = tree.read(`${SKILLS_SOURCE_DIR}/${file}`, 'utf-8');
      if (!sourceContent) continue;

      const expected = normalizeContent(`${sourceContent}\n\n${GENERATED_HEADER}`);
      const outputPath = `${CLAUDE_SKILLS_DIR}/${name}/SKILL.md`;
      if (!tree.exists(outputPath)) {
        errors.push({
          file: outputPath,
          message: `Generated skill file missing. Run: nx g tools:sync-skills`,
        });
        continue;
      }
      const actual = normalizeContent(tree.read(outputPath, 'utf-8') ?? '');
      if (actual !== expected) {
        errors.push({
          file: outputPath,
          message: `Content out of sync. Run: nx g tools:sync-skills`,
        });
      }
    }
  }

  // 3. Validate settings.json
  if (tree.exists(SETTINGS_JSON)) {
    try {
      const settingsRegistry = readSettingsRegistry(tree);
      const hooksRegistry = readHooksRegistry(tree);
      const settingsContent = tree.read(SETTINGS_JSON, 'utf-8');
      if (settingsContent) {
        const settings = JSON.parse(settingsContent);
        const expected: Record<string, unknown> = {};

        if (settingsRegistry.permissions) {
          expected.permissions = {};
          if (settingsRegistry.permissions.allow?.length) {
            (expected.permissions as Record<string, unknown>).allow =
              settingsRegistry.permissions.allow;
          }
          if (settingsRegistry.permissions.deny?.length) {
            (expected.permissions as Record<string, unknown>).deny =
              settingsRegistry.permissions.deny;
          }
        }

        if (settingsRegistry.env && Object.keys(settingsRegistry.env).length > 0) {
          expected.env = settingsRegistry.env;
        }

        const expectedHooks: Record<string, unknown[]> = {};
        for (const [_name, hook] of Object.entries(hooksRegistry.hooks)) {
          const trigger = hook.trigger;
          if (!expectedHooks[trigger]) expectedHooks[trigger] = [];
          const entry: Record<string, unknown> = {
            hooks: [{ type: 'command', command: hook.command }],
          };
          if (hook.tool_pattern) entry.matcher = hook.tool_pattern;
          expectedHooks[trigger].push(entry);
        }
        if (Object.keys(expectedHooks).length > 0) {
          expected.hooks = expectedHooks;
        }

        if (JSON.stringify(settings) !== JSON.stringify(expected)) {
          errors.push({
            file: SETTINGS_JSON,
            message: 'Content does not match registry. Run: nx g tools:sync-settings',
          });
        }
      }
    } catch (e) {
      errors.push({
        file: SETTINGS_JSON,
        message: `Failed to validate: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  // Report
  if (errors.length === 0) {
    logger.info('validate-registry: all derived files match the registry.');
    return;
  }

  logger.error(`validate-registry: found ${errors.length} mismatch(es):\n`);
  for (const err of errors) {
    logger.error(`  ${err.file}: ${err.message}`);
  }

  throw new Error(
    `Registry validation failed with ${errors.length} error(s). Run "nx g tools:sync-all" to fix.`
  );
}
