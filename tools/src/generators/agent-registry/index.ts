/**
 * Agent Registry NX Generators — barrel exports.
 *
 * All generators regenerate derived files from the canonical YAML registry
 * at .agents/. Run "nx g tools:sync-all" after any registry change.
 */

export { default as syncAgents } from './sync-agents';
export { default as syncSkills } from './sync-skills';
export { default as syncSettings } from './sync-settings';
export { default as syncAll } from './sync-all';
export { default as addAgent } from './add-agent';
export { default as updateAgent } from './update-agent';
export { default as removeAgent } from './remove-agent';
export { default as createSpec } from './create-spec';
export { default as updateSpec } from './update-spec';
export { default as syncCodex } from './sync-codex';
export { default as syncDashboard } from './sync-dashboard';
export { default as validateRegistry } from './validate-registry';
