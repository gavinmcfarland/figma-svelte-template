/**
 * Generates a random port number between 3000 and 6999.
 * This function is useful for assigning a port for local development servers.
 *
 * @returns {number} A random port number between 3000 and 6999.
 */
export function getRandomPort(): number {
	return Math.floor(Math.random() * (6999 - 3000 + 1)) + 3000;
}
