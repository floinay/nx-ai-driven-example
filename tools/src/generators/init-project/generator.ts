/**
 * init-project generator
 *
 * Interactive wizard that scaffolds the complete AI-driven development system.
 * Generates .agents/ SSOT structure, templates, skills, hooks, prototype app,
 * and root documents based on project config, then runs sync-all.
 */
import { Tree, logger } from '@nx/devkit';

import syncAll from '../agent-registry/sync-all';
import { buildAgentsYaml } from './lib/agents-yaml';
import { buildWorkflowsYaml } from './lib/workflows-yaml';
import { buildCommandsYaml } from './lib/commands-yaml';
import { buildHooksYaml } from './lib/hooks-yaml';
import { buildSettingsYaml } from './lib/settings-yaml';
import { buildPlatformsYaml } from './lib/platforms-yaml';
import { writeAgentTemplates } from './lib/agent-templates';
import { writeSkills } from './lib/skills';
import { writeHookScripts } from './lib/hook-scripts';
import { writeSpecTemplate } from './lib/spec-template';
import { writeRootDocuments } from './lib/root-documents';
import { writeCiScripts } from './lib/ci-scripts';
import { writePrototypeApp } from './lib/prototype-app';

export interface InitProjectSchema {
  name: string;
  description: string;
  domain: string;
  architectureStyle: 'monolith' | 'modular-monolith' | 'microservices';
  frontendFramework: string;
  cssFramework?: string;
  backendFramework?: string;
  testFramework?: string;
  e2eFramework?: string;
  orm?: string;
  hasMessageQueue?: boolean;
}

export interface ProjectConfig {
  name: string;
  description: string;
  domain: string;
  architectureStyle: 'monolith' | 'modular-monolith' | 'microservices';
  frontendFramework: string;
  backendFramework: string;
  cssFramework: string;
  testFramework: string;
  e2eFramework: string;
  orm: string;
  hasMessageQueue: boolean;
}

function normalizeConfig(schema: InitProjectSchema): ProjectConfig {
  return {
    name: schema.name,
    description: schema.description,
    domain: schema.domain,
    architectureStyle: schema.architectureStyle,
    frontendFramework: schema.frontendFramework || 'react',
    backendFramework: schema.backendFramework || 'koa',
    cssFramework: schema.cssFramework || 'tailwind',
    testFramework: schema.testFramework || 'vitest',
    e2eFramework: schema.e2eFramework || 'playwright',
    orm: schema.orm || 'drizzle',
    hasMessageQueue: schema.hasMessageQueue || false,
  };
}

export default async function initProject(
  tree: Tree,
  schema: InitProjectSchema
): Promise<void> {
  const config = normalizeConfig(schema);

  logger.info(`\n🚀 Initializing AI-driven development system for "${config.name}"...`);
  logger.info(`   Domain: ${config.domain}`);
  logger.info(`   Architecture: ${config.architectureStyle}`);
  logger.info(`   Stack: ${config.frontendFramework} + ${config.backendFramework}`);
  logger.info('');

  // 1. Generate .agents/ YAML registry files
  tree.write('.agents/agents.yaml', buildAgentsYaml(config));
  tree.write('.agents/workflows.yaml', buildWorkflowsYaml(config));
  tree.write('.agents/commands.yaml', buildCommandsYaml());
  tree.write('.agents/hooks.yaml', buildHooksYaml(config));
  tree.write('.agents/settings.yaml', buildSettingsYaml());
  tree.write('.agents/platforms.yaml', buildPlatformsYaml());

  // 2. Generate agent templates
  writeAgentTemplates(tree, config);

  // 3. Generate skills
  writeSkills(tree, config);

  // 4. Generate hook scripts
  writeHookScripts(tree, config);

  // 5. Generate spec template
  writeSpecTemplate(tree, config);

  // 6. Generate root documents (CLAUDE.md, AGENTS.md)
  writeRootDocuments(tree, config);

  // 7. Generate CI scripts
  writeCiScripts(tree, config);

  // 8. Generate prototype app
  writePrototypeApp(tree, config);

  // 9. Create empty context files
  tree.write('.agents/context/glossary.yaml', '# Project glossary — define domain terms here\nterms: {}\n');
  tree.write('.agents/specs/.gitkeep', '');
  tree.write('tmp/.gitkeep', '');

  // 10. Run sync-all to generate derived files
  logger.info('Running sync-all to generate derived files...');
  await syncAll(tree, {});

  logger.info(`\n✅ AI-driven development system initialized for "${config.name}"!`);
  logger.info('');
  logger.info('Next steps:');
  logger.info('  1. Review generated files in .agents/');
  logger.info('  2. Customize agent templates in .agents/templates/');
  logger.info('  3. Create your first spec:  npx nx g tools:create-spec --slug=my-feature --goal="..."');
  logger.info('  4. Refine the spec:         /spec my-feature');
  logger.info('  5. Implement it:            /implement my-feature');
  logger.info('  6. Quick fix:               /fix "description of issue"');
  logger.info('  7. Start prototype server:   npx nx serve prototype');
  logger.info('');
}
