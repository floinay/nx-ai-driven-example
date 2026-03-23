import { Tree, logger } from '@nx/devkit';
import type { SyncSettingsSchema, HookEntry } from './types';
import {
  readHooksRegistry,
  readSettingsRegistry,
  SETTINGS_JSON,
  LAUNCH_JSON,
} from './utils';

interface SettingsHookCommand {
  type: 'command';
  command: string;
}

interface SettingsHookMatcher {
  matcher?: string;
  hooks: SettingsHookCommand[];
}

type SettingsHooks = Record<string, SettingsHookMatcher[]>;

interface ClaudeSettings {
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  env?: Record<string, string>;
  hooks?: SettingsHooks;
}

function buildHooksSection(hooks: Record<string, HookEntry>): SettingsHooks {
  const result: SettingsHooks = {};
  for (const [_name, hook] of Object.entries(hooks)) {
    const trigger = hook.trigger;
    if (!result[trigger]) {
      result[trigger] = [];
    }
    const entry: SettingsHookMatcher = {
      hooks: [{ type: 'command', command: hook.command }],
    };
    if (hook.tool_pattern) {
      entry.matcher = hook.tool_pattern;
    }
    result[trigger].push(entry);
  }
  return result;
}

export default async function syncSettings(
  tree: Tree,
  _schema: SyncSettingsSchema
): Promise<void> {
  const settings = readSettingsRegistry(tree);
  const hooksRegistry = readHooksRegistry(tree);

  const output: ClaudeSettings = {};

  if (settings.permissions) {
    output.permissions = {};
    if (settings.permissions.allow?.length) {
      output.permissions.allow = settings.permissions.allow;
    }
    if (settings.permissions.deny?.length) {
      output.permissions.deny = settings.permissions.deny;
    }
  }

  if (settings.env && Object.keys(settings.env).length > 0) {
    output.env = settings.env;
  }

  const hooks = buildHooksSection(hooksRegistry.hooks);
  if (Object.keys(hooks).length > 0) {
    output.hooks = hooks;
  }

  tree.write(SETTINGS_JSON, JSON.stringify(output, null, 2) + '\n');

  if (settings.launch?.length) {
    const launch = {
      version: '0.0.1',
      configurations: settings.launch.map((c) => ({
        name: c.name,
        runtimeExecutable: c.runtimeExecutable,
        runtimeArgs: c.runtimeArgs,
        port: c.port,
      })),
    };
    tree.write(LAUNCH_JSON, JSON.stringify(launch, null, 2) + '\n');
  }

  logger.info(
    `sync-settings: wrote ${SETTINGS_JSON} (permissions, env, ${
      Object.keys(hooksRegistry.hooks).length
    } hook(s))${settings.launch?.length ? ` + ${LAUNCH_JSON}` : ''}.`
  );
}
