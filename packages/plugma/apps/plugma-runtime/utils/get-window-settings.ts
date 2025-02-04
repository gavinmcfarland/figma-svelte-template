import type { PlugmaCommand } from '#core/types.js';
import type {
  PlugmaRuntimeData,
  ShowUIOptions,
  WindowSettings,
} from '../types.js';

declare const runtimeData: PlugmaRuntimeData;

const defaultSettings: WindowSettings = {
  width: 300,
  height: 200,
  minimized: true,
  toolbarEnabled: true,
};

// Define default settings for both dev and preview commands
export const DEFAULT_WINDOW_SETTINGS: {
  [key in PlugmaCommand]: WindowSettings;
} = {
  dev: defaultSettings,
  preview: defaultSettings,
  build: defaultSettings,
  test: defaultSettings,
} as const;

/**
 * Retrieves window settings from client storage based on the current command mode.
 * @param options - Optional UI options that may override stored settings
 * @returns Promise<WindowSettings> The window settings to be applied
 */
export async function getWindowSettings(
  options?: Partial<ShowUIOptions>,
): Promise<WindowSettings> {
  const command = runtimeData.command;

  // Define storage keys for dev and preview settings
  const storageKeyDev = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_DEV';
  const storageKeyPreview = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_PREVIEW';
  let pluginWindowSettings: WindowSettings | undefined;

  if (command === 'dev') {
    pluginWindowSettings = (await figma.clientStorage.getAsync(
      storageKeyDev,
    )) as WindowSettings;

    if (!pluginWindowSettings) {
      await figma.clientStorage.setAsync(
        storageKeyDev,
        DEFAULT_WINDOW_SETTINGS.dev,
      );
      pluginWindowSettings = DEFAULT_WINDOW_SETTINGS.dev;
    }
  } else {
    pluginWindowSettings = (await figma.clientStorage.getAsync(
      storageKeyPreview,
    )) as WindowSettings;

    if (!pluginWindowSettings) {
      await figma.clientStorage.setAsync(
        storageKeyPreview,
        DEFAULT_WINDOW_SETTINGS.preview,
      );
      pluginWindowSettings = DEFAULT_WINDOW_SETTINGS.preview;
    }
  }

  if (options && (!options.width || !options.height)) {
    pluginWindowSettings.height = 300;
    pluginWindowSettings.width = 400;

    if (pluginWindowSettings?.toolbarEnabled) {
      pluginWindowSettings.height = 341; // 300 + 41 (toolbar height)
    }
  }

  // Maintain original validation
  if (!pluginWindowSettings || typeof pluginWindowSettings !== 'object') {
    return DEFAULT_WINDOW_SETTINGS[command as PlugmaCommand];
  }

  // Original position validation
  if (
    !Number.isInteger(pluginWindowSettings.x) ||
    !Number.isInteger(pluginWindowSettings.y) ||
    pluginWindowSettings.x < 0 ||
    pluginWindowSettings.y < 0
  ) {
    return {
      ...DEFAULT_WINDOW_SETTINGS[command as PlugmaCommand],
      ...pluginWindowSettings,
      x: 0,
      y: 0,
    };
  }

  return {
    ...DEFAULT_WINDOW_SETTINGS[command as PlugmaCommand],
    ...pluginWindowSettings,
  };
}
