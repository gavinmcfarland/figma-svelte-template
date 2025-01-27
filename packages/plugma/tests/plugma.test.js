import { execSync } from 'child_process';

describe('create plugma CLI', () => {
	test('should run plugma dev without errors', () => {
		// Set up process.argv as if we're running "plugma dev"
		process.argv = ['node', 'create-plugma', 'dev'];

		// Execute the command and capture output
		const output = execSync('node ../create-plugma/create-plugma.js', { encoding: 'utf-8' });

		console.log(output)

		// Assert the expected output
		expect(output).toContain('Expected output from plugma dev');
	});
});
