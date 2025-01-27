import { expect, type Assertion } from "../testing";

/**
 * Creates a rectangle in Figma and returns both the rectangle and
 * an array of assertion chains that verify its properties
 *
 * @returns An array of assertion chains that verify the rectangle's properties
 */
export async function createRectangleTest(): Promise<Assertion[]> {
	const rect = await figma.createRectangle();

	rect.x = 0;
	rect.y = 0;
	rect.resize(100, 100);
	rect.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }]; // Red color for visibility

	return [
		expect(rect.type).to.equal("RECTANGLE"),
		expect(rect.width).to.equal(100),
		expect(rect.height).to.equal(100),
		expect(rect.x).to.equal(0),
		expect(rect.y).to.equal(0),
	];
}
