/**
 * Generates .agents/workflows.yaml — single workflow shape, always parallel coders.
 */
import { stringify } from 'yaml';
import type { ProjectConfig } from '../generator';

export function buildWorkflowsYaml(config: ProjectConfig): string {
  const workflows: Record<string, unknown> = {};

  // --- IMPLEMENT workflow (always parallel backend + frontend coders) ---
  workflows['IMPLEMENT'] = {
    description: 'Full feature implementation pipeline: review → code → test → QA',
    requires_worktree: true,
    slash_command: {
      name: 'implement',
      description: 'Launch full implementation pipeline for a spec',
      argument_hint: '<spec-slug>',
      allowed_tools: ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit', 'Agent'],
    },
    steps: [
      {
        name: 'reviewer-pre',
        agent: 'reviewer',
        mode: 'pre-implementation',
        signal_on_success: 'reviewer: APPROVED',
        signal_on_failure: 'reviewer: BLOCKED',
      },
      {
        name: 'coder-backend',
        agent: 'coder-backend',
        after: ['reviewer: APPROVED'],
        parallel_with: ['coder-frontend'],
        signal_on_success: 'coder-backend: DONE',
      },
      {
        name: 'coder-frontend',
        agent: 'coder-frontend',
        after: ['reviewer: APPROVED'],
        parallel_with: ['coder-backend'],
        signal_on_success: 'coder-frontend: DONE',
      },
      {
        name: 'tester',
        agent: 'tester',
        after: ['coder-backend: DONE', 'coder-frontend: DONE'],
        signal_on_success: 'tester: DONE',
      },
      {
        name: 'reviewer-post',
        agent: 'reviewer',
        mode: 'post-change',
        after: ['tester: DONE'],
        signal_on_success: 'reviewer: APPROVED',
        signal_on_failure: 'reviewer: FEEDBACK → [agent]',
      },
      {
        name: 'qa-analyst',
        agent: 'qa-analyst',
        after: ['reviewer: APPROVED'],
        signal_on_success: 'qa-analyst: GREEN',
        signal_on_failure: 'qa-analyst: FEEDBACK → [agent]',
      },
    ],
  };

  // --- SPEC workflow ---
  workflows['SPEC'] = {
    description: 'Spec refinement through Q&A: draft → review → architect → ux',
    requires_worktree: false,
    slash_command: {
      name: 'spec',
      description: 'Launch spec refinement workflow',
      argument_hint: '<spec-slug>',
      allowed_tools: ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit'],
    },
    steps: [
      {
        name: 'spec-writer',
        agent: 'reviewer',
        mode: 'spec-review',
        signal_on_success: 'reviewer: APPROVED',
        signal_on_failure: 'reviewer: BLOCKED',
      },
      {
        name: 'architect',
        agent: 'architect',
        condition: 'has_architectural_questions',
        after: ['reviewer: APPROVED'],
        signal_on_success: 'architect: DONE',
      },
      {
        name: 'ux-expert',
        agent: 'ux-expert',
        condition: 'ui_in_scope',
        after: ['reviewer: APPROVED'],
        signal_on_success: 'ux-expert: APPROVED',
        signal_on_failure: 'ux-expert: FEEDBACK',
      },
    ],
  };

  // --- AD_HOC workflow ---
  workflows['AD_HOC'] = {
    description: 'Quick fix without formal spec: support → review → QA',
    requires_worktree: true,
    slash_command: {
      name: 'fix',
      description: 'Launch ad-hoc fix workflow',
      argument_hint: '<description>',
      allowed_tools: ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit', 'Agent'],
    },
    steps: [
      {
        name: 'support',
        agent: 'support',
        signal_on_success: 'support: DONE',
        signal_on_failure: 'support: NEEDS_ARCHITECT',
      },
      {
        name: 'reviewer-post',
        agent: 'reviewer',
        mode: 'post-change',
        after: ['support: DONE'],
        signal_on_success: 'reviewer: APPROVED',
        signal_on_failure: 'reviewer: FEEDBACK → [agent]',
      },
      {
        name: 'qa-analyst',
        agent: 'qa-analyst',
        after: ['reviewer: APPROVED'],
        signal_on_success: 'qa-analyst: GREEN',
        signal_on_failure: 'qa-analyst: FEEDBACK → [agent]',
      },
    ],
  };

  const header = `# Workflow Definitions — ${config.name}\n# Edit this file, then run: npx nx g tools:sync-all\n\n`;
  return header + stringify({ workflows }, { lineWidth: 0, blockQuote: 'literal' });
}
