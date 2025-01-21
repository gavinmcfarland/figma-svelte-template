import type { PluginOptions } from './utils';

/**
 * This module handles Figma plugin window management, including window settings persistence,
 * command history tracking, and UI customization.
 */
interface CommandHistory {
  previousCommand: 'dev' | 'preview' | null;
  previousInstanceId: string | null;
}

interface WindowSettings {
  width: number;
  height: number;
  minimized: boolean;
  toolbarEnabled: boolean;
}

interface WindowPosition {
  x: number;
  y: number;
}

interface ShowUIOptions {
  width?: number;
  height?: number;
  visible?: boolean;
  position?: WindowPosition;
}

// Global runtime data
// Vite will inject the runtimeData object below
//>> PLACEHOLDER : runtimeData <<//
declare const runtimeData: PluginOptions;

/**
 * Retrieves and updates command history from client storage.
 * Used to track previous plugin instances and commands.
 * @returns Promise<CommandHistory> The previous command and instance information
 */
async function getCommandHistory(): Promise<CommandHistory> {
  let commandHistory = (await figma.clientStorage.getAsync(
    'PLUGMA_COMMAND_HISTORY',
  )) as CommandHistory;

  // If there's no history, initialize the commandHistory object
  if (!commandHistory) {
    commandHistory = {
      previousCommand: null,
      previousInstanceId: null,
    };
  }

  // Retrieve the previous command to return first
  const previousCommand = commandHistory.previousCommand;
  const previousInstanceId = commandHistory.previousInstanceId;

  // Set the current command as the new previous command for future retrievals
  commandHistory.previousCommand = runtimeData.command;
  commandHistory.previousInstanceId = runtimeData.instanceId;
  await figma.clientStorage.setAsync('PLUGMA_COMMAND_HISTORY', commandHistory);

  return { previousCommand, previousInstanceId };
}

/**
 * Retrieves window settings from client storage based on the current command mode.
 * @param options - Optional UI options that may override stored settings
 * @returns Promise<WindowSettings> The window settings to be applied
 */
async function getWindowSettings(
  options?: ShowUIOptions,
): Promise<WindowSettings> {
  const command = runtimeData.command;

  // Define default settings for both dev and preview commands
  const defaultDevSettings: WindowSettings = {
    width: 300,
    height: 200,
    minimized: false,
    toolbarEnabled: false,
  };

  const defaultPreviewSettings: WindowSettings = {
    width: 300,
    height: 200,
    minimized: true,
    toolbarEnabled: true,
  };

  // Define storage keys for dev and preview settings
  const storageKeyDev = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_DEV';
  const storageKeyPreview = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_PREVIEW';
  let pluginWindowSettings: WindowSettings;

  if (command === 'dev') {
    pluginWindowSettings = (await figma.clientStorage.getAsync(
      storageKeyDev,
    )) as WindowSettings;

    if (!pluginWindowSettings) {
      await figma.clientStorage.setAsync(storageKeyDev, defaultDevSettings);
      pluginWindowSettings = defaultDevSettings;
    }
  } else {
    pluginWindowSettings = (await figma.clientStorage.getAsync(
      storageKeyPreview,
    )) as WindowSettings;

    if (!pluginWindowSettings) {
      await figma.clientStorage.setAsync(
        storageKeyPreview,
        defaultPreviewSettings,
      );
      pluginWindowSettings = defaultPreviewSettings;
    }
  }

  if (options && (!options.width || !options.height)) {
    pluginWindowSettings.height = 300;
    pluginWindowSettings.width = 400;

    if (pluginWindowSettings.toolbarEnabled) {
      pluginWindowSettings.height = 341; // 300 + 41 (toolbar height)
    }
  }

  return pluginWindowSettings;
}

/**
 * Persists window settings to client storage based on the current command mode.
 * @param pluginWindowSettings - The window settings to be saved
 */
async function setWindowSettings(
  pluginWindowSettings: WindowSettings,
): Promise<void> {
  const command = runtimeData.command;
  const storageKey =
    command === 'dev'
      ? 'PLUGMA_PLUGIN_WINDOW_SETTINGS_DEV'
      : 'PLUGMA_PLUGIN_WINDOW_SETTINGS_PREVIEW';

  await figma.clientStorage.setAsync(storageKey, pluginWindowSettings);
}

/**
 * Custom resize function that takes into account minimized state.
 * @param initialWidth - The desired window width
 * @param initialHeight - The desired window height
 */
function customResize(initialWidth: number, initialHeight: number): void {
  getWindowSettings().then((pluginWindowSettings) => {
    const dimensions = {
      width: initialWidth,
      height: initialHeight,
    };

    if (pluginWindowSettings.minimized) {
      dimensions.height = 40;
      dimensions.width = 200;
    }

    // Call the original figma.ui.resize method if it exists
    if (typeof figma?.ui?.resize === 'function') {
      // To avoid Vite replacing figma.ui.resize and causing an infinite loop
      const resizeMethod = 're' + 'size';
      (figma.ui as any)[resizeMethod](dimensions.width, dimensions.height);
    } else {
      console.warn('Figma UI resize method is not available.');
    }
  });
}

/**
 * Enhanced showUI function with support for window settings persistence and positioning.
 * @param htmlString - The HTML content to display in the plugin window
 * @param initialOptions - Configuration options for the plugin window
 */
function customShowUI(
  htmlString: string,
  initialOptions?: ShowUIOptions,
): void {
  const options = { ...initialOptions };

  // Show UI to receive messages
  const mergedOptions = { visible: false, ...options };
  // To avoid Vite replacing figma.showUI
  const showUIMethod = 'show' + 'UI';
  (figma as any)[showUIMethod](htmlString, mergedOptions);

  getCommandHistory().then((commandHistory) => {
    getWindowSettings(options).then((pluginWindowSettings) => {
      const hasCommandChanged =
        commandHistory.previousCommand !== runtimeData.command;
      const hasInstanceChanged =
        commandHistory.previousInstanceId !== runtimeData.instanceId;

      if (runtimeData.command === 'preview') {
        pluginWindowSettings.minimized = true;
        pluginWindowSettings.toolbarEnabled = true;

        const zoom = figma.viewport.zoom;
        options.position = {
          x: figma.viewport.bounds.x + 12 / zoom,
          y:
            figma.viewport.bounds.y +
            (figma.viewport.bounds.height - (80 + 12) / zoom),
        };
      }

      if (hasCommandChanged && runtimeData.command === 'dev') {
        const zoom = figma.viewport.zoom;

        if (!options.position) {
          options.position = {
            x: figma.viewport.center.x - (options.width || 300) / 2 / zoom,
            y:
              figma.viewport.center.y -
              ((options.height || 200) + 41) / 2 / zoom,
          };
        }
      }

      if (hasInstanceChanged && runtimeData.command === 'preview') {
        pluginWindowSettings.toolbarEnabled = true;
        pluginWindowSettings.minimized = true;
      }

      if (options.height) {
        pluginWindowSettings.height = options.height;
      }

      if (options.width) {
        pluginWindowSettings.width = options.width;
      }

      if (pluginWindowSettings.toolbarEnabled && options.height) {
        options.height += 41; // Add toolbar height
      }

      if (pluginWindowSettings.minimized) {
        options.height = 40;
        options.width = 200;
      }

      // Apply window dimensions
      const resizeMethod = 're' + 'size';
      if (options.width && options.height) {
        (figma.ui as any)[resizeMethod](options.width, options.height);
      } else if (pluginWindowSettings.toolbarEnabled) {
        (figma.ui as any)[resizeMethod](300, 241); // 200 + 41 for toolbar
      } else {
        (figma.ui as any)[resizeMethod](300, 200);
      }

      // Apply window position
      if (options.position?.x != null && options.position?.y != null) {
        figma.ui.reposition(options.position.x, options.position.y);
      }

      // Notify UI of window settings
      figma.ui.postMessage({
        event: 'PLUGMA_PLUGIN_WINDOW_SETTINGS',
        data: pluginWindowSettings,
      });

      // Show UI unless explicitly set to false
      if (options.visible !== false) {
        figma.ui.show();
      }
    });
  });
}

export {
  customResize,
  customShowUI,
  getCommandHistory,
  getWindowSettings,
  setWindowSettings,
};
