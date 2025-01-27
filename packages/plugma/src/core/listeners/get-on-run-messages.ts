import type { PluginMessage } from './types.js';

/**
 * Retrieves and posts all saved on-run messages to the UI.
 */
export async function handleGetOnRunMessages(
  _msg: PluginMessage,
): Promise<void> {
  const data = (await figma.clientStorage.getAsync(
    'plugma-on-run-messages',
  )) as Array<{
    pluginMessage: unknown;
  }>;

  for (const msg of data) {
    figma.ui.postMessage(msg.pluginMessage);
  }
}

handleGetOnRunMessages.EVENT_NAME = 'plugma-get-on-run-messages' as const;
