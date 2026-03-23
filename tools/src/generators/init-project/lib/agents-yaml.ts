/**
 * Generates .agents/agents.yaml — always includes all 12 agents.
 */
import { stringify } from 'yaml';
import type { ProjectConfig } from '../generator';

interface AgentDef {
  description: string;
  model: string;
  tools: string[];
  permissionMode: string;
  spawned_by: string;
  spawned_after: string[];
  workflows: string[];
  files_modified: string[];
  signals: { emits: string[] };
}

const READ_ONLY_TOOLS = ['Read', 'Glob', 'Grep', 'Bash(read-only)'];
const CODE_TOOLS = ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit'];

function buildReviewer(): AgentDef {
  return {
    description:
      'Pre-implementation: validates spec completeness, scope coherence, and feasibility. Post-change: reviews diff against acceptance criteria, checks code logic and documentation consistency. Spawn: automatically in IMPLEMENT and AD_HOC workflows.',
    model: 'opus',
    tools: [...READ_ONLY_TOOLS, 'WebSearch'],
    permissionMode: 'default',
    spawned_by: 'lead',
    spawned_after: [],
    workflows: ['IMPLEMENT', 'SPEC', 'AD_HOC'],
    files_modified: [],
    signals: {
      emits: ['reviewer: APPROVED', 'reviewer: BLOCKED', 'reviewer: FEEDBACK → [agent]'],
    },
  };
}

function buildCoderBackend(config: ProjectConfig): AgentDef {
  const parts: string[] = [];
  if (config.backendFramework !== 'none') parts.push(config.backendFramework);
  if (config.orm !== 'none') parts.push(config.orm);
  if (config.hasMessageQueue) parts.push('message queue consumers/producers');
  const stack = parts.join(', ') || 'Node.js';

  return {
    description: `Backend specialist. Implements server-side features using ${stack}. Writes API routes, database schemas, business logic, and service code. Outputs API contract to tmp/agent-mailbox/coder-backend.md.`,
    model: 'opus',
    tools: CODE_TOOLS,
    permissionMode: 'acceptEdits',
    spawned_by: 'lead',
    spawned_after: ['reviewer: APPROVED'],
    workflows: ['IMPLEMENT'],
    files_modified: ['apps/**', 'libs/**'],
    signals: { emits: ['coder-backend: DONE'] },
  };
}

function buildCoderFrontend(config: ProjectConfig): AgentDef {
  const parts: string[] = [];
  if (config.frontendFramework !== 'none') parts.push(config.frontendFramework);
  if (config.cssFramework !== 'none') parts.push(config.cssFramework);
  const stack = parts.join(' + ') || 'HTML/CSS/JS';

  return {
    description: `Frontend specialist. Implements UI components and pages using ${stack}. Follows the project's design system and component library. Outputs component contract to tmp/agent-mailbox/coder-frontend.md.`,
    model: 'opus',
    tools: CODE_TOOLS,
    permissionMode: 'acceptEdits',
    spawned_by: 'lead',
    spawned_after: ['reviewer: APPROVED'],
    workflows: ['IMPLEMENT'],
    files_modified: ['apps/**', 'libs/**'],
    signals: { emits: ['coder-frontend: DONE'] },
  };
}

function buildTester(config: ProjectConfig): AgentDef {
  return {
    description: `Test specialist. Writes ${config.testFramework} unit/integration tests and ${config.e2eFramework} E2E tests. Target: >=80% line coverage on changed modules. Prefer real dependencies over mocks where practical.`,
    model: 'sonnet',
    tools: CODE_TOOLS,
    permissionMode: 'acceptEdits',
    spawned_by: 'lead',
    spawned_after: [],
    workflows: ['IMPLEMENT'],
    files_modified: ['**/*.spec.ts', '**/*.e2e.ts', '**/e2e/**'],
    signals: { emits: ['tester: DONE'] },
  };
}

function buildQaAnalyst(config: ProjectConfig): AgentDef {
  return {
    description: `Quality gate before user approval. Runs build, tests, and coverage checks. Validates acceptance criteria are met. Performs edge case analysis and architectural spot-checks. Uses ${config.testFramework} for coverage analysis.`,
    model: 'opus',
    tools: [...READ_ONLY_TOOLS, 'Bash'],
    permissionMode: 'default',
    spawned_by: 'lead',
    spawned_after: [],
    workflows: ['IMPLEMENT', 'AD_HOC'],
    files_modified: [],
    signals: {
      emits: ['qa-analyst: GREEN', 'qa-analyst: FEEDBACK → [agent]', 'qa-analyst: ESCALATE → lead'],
    },
  };
}

function buildArchitect(config: ProjectConfig): AgentDef {
  const boundaryType =
    config.architectureStyle === 'microservices'
      ? 'service boundaries and inter-service contracts'
      : config.architectureStyle === 'modular-monolith'
      ? 'module boundaries and internal contracts'
      : 'component boundaries and code organization';

  return {
    description: `Design conscience for ${config.domain} domain. Produces ADRs, defines ${boundaryType}, and resolves architectural questions. Spawned when boundary violations are detected, new domains emerge, or architectural open questions exist.`,
    model: 'opus',
    tools: [...CODE_TOOLS, 'WebSearch'],
    permissionMode: 'acceptEdits',
    spawned_by: 'lead',
    spawned_after: [],
    workflows: ['SPEC', 'IMPLEMENT'],
    files_modified: ['docs/adr/**', '.agents/specs/**'],
    signals: { emits: ['architect: DONE'] },
  };
}

function buildSupport(config: ProjectConfig): AgentDef {
  const parts: string[] = [];
  if (config.frontendFramework !== 'none') parts.push(config.frontendFramework);
  if (config.backendFramework !== 'none') parts.push(config.backendFramework);
  const stack = parts.join(' and ') || 'the codebase';

  return {
    description: `General-purpose debugger and fixer for AD_HOC workflow. Diagnoses and fixes issues in ${stack} without requiring a full spec cycle. Escalates to architect when design decisions are needed.`,
    model: 'opus',
    tools: CODE_TOOLS,
    permissionMode: 'acceptEdits',
    spawned_by: 'lead',
    spawned_after: [],
    workflows: ['AD_HOC'],
    files_modified: ['apps/**', 'libs/**', 'src/**'],
    signals: { emits: ['support: DONE', 'support: NEEDS_ARCHITECT'] },
  };
}

function buildDevops(): AgentDef {
  return {
    description:
      'Infrastructure and deployment specialist. Manages Docker Compose, CI/CD configs, environment files, and deployment configurations. Spawned for infra-related tasks.',
    model: 'opus',
    tools: CODE_TOOLS,
    permissionMode: 'acceptEdits',
    spawned_by: 'lead',
    spawned_after: [],
    workflows: ['IMPLEMENT', 'AD_HOC'],
    files_modified: ['docker-compose*.yml', '.github/**', 'ops/**', '.env*'],
    signals: { emits: ['devops: DONE'] },
  };
}

function buildUxExpert(): AgentDef {
  return {
    description:
      'UX/UI quality expert. Evaluates UI proposals in specs against design system, user personas, and accessibility standards. Spawned during SPEC workflow when UI is in scope.',
    model: 'sonnet',
    tools: READ_ONLY_TOOLS,
    permissionMode: 'default',
    spawned_by: 'lead',
    spawned_after: [],
    workflows: ['SPEC'],
    files_modified: [],
    signals: { emits: ['ux-expert: APPROVED', 'ux-expert: FEEDBACK'] },
  };
}

function buildPrototypeDesigner(): AgentDef {
  return {
    description:
      'UI prototyping specialist. Generates screen prototypes in apps/prototype/ using Tailwind CSS and shadcn/ui components. Takes a screen description (text or Figma URL) and produces a working visual prototype with hardcoded mock data. No business logic, no API calls — pure visual layout. Emits "prototype-designer: DONE" with preview screenshot.',
    model: 'sonnet',
    tools: CODE_TOOLS,
    permissionMode: 'acceptEdits',
    spawned_by: 'lead',
    spawned_after: ['user request'],
    workflows: ['AD_HOC'],
    files_modified: ['apps/prototype/src/screens/*', 'apps/prototype/src/router.tsx'],
    signals: { emits: ['prototype-designer: DONE'] },
  };
}

function buildDxAuditor(): AgentDef {
  return {
    description:
      'Read-only validator of agent registry infrastructure. Checks that registry YAML, templates, generated files, workflows, skills, and hooks are consistent. Auto-spawned after changes to .agents/, AGENTS.md, or CLAUDE.md.',
    model: 'sonnet',
    tools: READ_ONLY_TOOLS,
    permissionMode: 'default',
    spawned_by: 'lead',
    spawned_after: [],
    workflows: [],
    files_modified: [],
    signals: { emits: ['dx-auditor: PASS', 'dx-auditor: FAIL'] },
  };
}

export function buildAgentsYaml(config: ProjectConfig): string {
  const agents: Record<string, AgentDef> = {};

  // All 12 agents — always included
  agents['reviewer'] = buildReviewer();
  agents['coder-backend'] = buildCoderBackend(config);
  agents['coder-frontend'] = buildCoderFrontend(config);
  agents['tester'] = buildTester(config);
  agents['qa-analyst'] = buildQaAnalyst(config);
  agents['architect'] = buildArchitect(config);
  agents['support'] = buildSupport(config);
  agents['devops'] = buildDevops();
  agents['ux-expert'] = buildUxExpert();
  agents['prototype-designer'] = buildPrototypeDesigner();
  agents['dx-auditor'] = buildDxAuditor();

  const header = `# Agent Registry — ${config.name}\n# Domain: ${config.domain} | Architecture: ${config.architectureStyle}\n# Edit this file, then run: npx nx g tools:sync-all\n\n`;
  return header + stringify({ agents }, { lineWidth: 0, blockQuote: 'literal' });
}
