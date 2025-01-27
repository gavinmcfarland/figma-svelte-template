/**
 * Base type for all plugin messages
 */
export interface PluginMessage {
  event: string;
  data?: unknown;
  pluginMessage?: unknown;
}

/**
 * Type for message handlers with their event names
 */
export interface MessageHandler {
  (msg: PluginMessage): Promise<void> | void;
  EVENT_NAME: string;
}

/**
 * Registry to ensure event name uniqueness across listeners
 */
export type EventRegistry = {
  [K in string]: MessageHandler;
};
