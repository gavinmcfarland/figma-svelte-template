import type { PluginMessage } from './types.js';

/**
 * Saves messages that should be replayed when the plugin runs.
 */
export async function handleSaveOnRunMessages(
  msg: PluginMessage,
): Promise<void> {
  await figma.clientStorage.setAsync('plugma-on-run-messages', msg.data);
}

handleSaveOnRunMessages.EVENT_NAME = 'plugma-save-on-run-messages' as const;
