/**
 * Type definitions for the agent registry YAML structures.
 */

export interface AgentSignals {
  emits: string[];
}

export interface AgentEntry {
  description: string;
  model: 'opus' | 'sonnet' | 'haiku';
  tools: string[];
  permissionMode: 'default' | 'acceptEdits';
  maxTurns?: number;
  spawned_by: string;
  spawned_after: string[];
  workflows: string[];
  files_modified: string[];
  signals: AgentSignals;
}

export interface AgentsRegistry {
  agents: Record<string, AgentEntry>;
}

export interface WorkflowStep {
  name: string;
  agent: string;
  mode?: string;
  parallel_with?: string[];
  after?: string[];
  condition?: string;
  signal_on_success: string;
  signal_on_failure?: string;
}

export interface SlashCommand {
  name: string;
  description: string;
  argument_hint: string;
  allowed_tools: string[];
}

export interface WorkflowEntry {
  description: string;
  skill?: string;
  requires_worktree: boolean;
  slash_command?: SlashCommand;
  steps: WorkflowStep[];
}

export interface WorkflowsRegistry {
  workflows: Record<string, WorkflowEntry>;
}

export interface HookEntry {
  trigger: string;
  tool_pattern: string | null;
  command: string;
  description: string;
  template: string | null;
}

export interface HooksRegistry {
  hooks: Record<string, HookEntry>;
}

// ---------------------------------------------------------------------------
// Skills registry
// ---------------------------------------------------------------------------

export interface SkillEntry {
  description: string;
}

export interface SkillsRegistry {
  skills: Record<string, SkillEntry>;
}

// ---------------------------------------------------------------------------
// Platforms registry (cross-platform code generation)
// ---------------------------------------------------------------------------

export interface CodexModelConfig {
  model: string;
  reasoning_effort: 'low' | 'medium' | 'high';
}

export interface PlatformsRegistry {
  codex: {
    models: Record<string, CodexModelConfig>;
    permissions: Record<string, string>;
    max_depth: number;
  };
}

export interface SyncAgentsSchema {
  /** No options required */
}

export interface SyncSkillsSchema {
  /** No options required */
}

export interface SyncCommandsSchema {
  /** No options required */
}

export interface SyncHooksSchema {
  /** @deprecated Use SyncSettingsSchema instead */
}

// ---------------------------------------------------------------------------
// Settings registry
// ---------------------------------------------------------------------------

export interface LaunchConfiguration {
  name: string;
  runtimeExecutable: string;
  runtimeArgs: string[];
  port: number;
}

export interface SettingsRegistry {
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  env?: Record<string, string>;
  launch?: LaunchConfiguration[];
}

export interface SyncSettingsSchema {
  /** No options required */
}

export interface SyncCodexSchema {
  /** No options required */
}

export interface SyncDashboardSchema {
  /** No options required */
}

export interface SyncAllSchema {
  /** No options required */
}

export interface AddAgentSchema {
  name: string;
  model: 'opus' | 'sonnet' | 'haiku';
  tools: string;
  description: string;
  permissionMode?: 'default' | 'acceptEdits';
}

export interface UpdateAgentSchema {
  name: string;
  model?: 'opus' | 'sonnet' | 'haiku';
  tools?: string;
  description?: string;
  permissionMode?: 'default' | 'acceptEdits';
}

export interface RemoveAgentSchema {
  name: string;
}

export interface CreateSpecSchema {
  slug: string;
  goal: string;
}

export interface UpdateSpecSchema {
  slug: string;
  status: string;
}

export interface StartTaskSchema {
  slug: string;
}

export interface FinishTaskSchema {
  slug: string;
}

export interface AbortTaskSchema {
  slug: string;
}

export interface ValidateRegistrySchema {
  /** No options required */
}
