/**
 * Sets up event listeners for the Figma plugin's main thread.
 * Only active in development or server environments.
 */
export function mainListeners(): void {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'server'
  ) {
    figma.ui.on(
      'message',
      async (msg: {
        event: string;
        data?: unknown;
        pluginMessage?: unknown;
      }) => {
        if (msg.event === 'plugma-delete-file-storage') {
          const pluginDataKeys = figma.root.getPluginDataKeys();
          for (const key of pluginDataKeys) {
            figma.root.setPluginData(key, '');
            console.log(`[plugma] ${key} deleted from root pluginData`);
          }
          figma.notify('Root pluginData deleted');
        }

        if (msg.event === 'plugma-delete-client-storage') {
          const clientStorageKeys = await figma.clientStorage.keysAsync();
          for (const key of clientStorageKeys) {
            if (key !== 'figma-stylesheet') {
              await figma.clientStorage.deleteAsync(key);
              console.log(`[plugma] ${key} deleted from clientStorage`);
            }
          }
          figma.notify('ClientStorage deleted');
        }

        if (msg.event === 'plugma-save-on-run-messages') {
          await figma.clientStorage.setAsync(
            'plugma-on-run-messages',
            msg.data,
          );
        }

        if (msg.event === 'plugma-get-on-run-messages') {
          const data = (await figma.clientStorage.getAsync(
            'plugma-on-run-messages',
          )) as Array<{
            pluginMessage: unknown;
          }>;

          for (const msg of data) {
            figma.ui.postMessage(msg.pluginMessage);
          }
        }
      },
    );
  }
}
