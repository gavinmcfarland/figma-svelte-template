export const logger = console;

logger.debug = console.log;

export const disableLoggger = {
	log: (...args: unknown[]) => {},
	info: (...args: unknown[]) => {},
	debug: (...args: unknown[]) => {},
	warn: (...args: unknown[]) => {},
	error: (...args: unknown[]) => {},
};
