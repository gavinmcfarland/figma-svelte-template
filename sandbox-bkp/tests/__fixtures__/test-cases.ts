/**
 * Test fixtures for various test scenarios
 */

export const testCases = {
  basic: {
    name: 'creates a rectangle',
    fn: `(context, plugmaExpect) => {
      const rect = figma.createRectangle();
      plugmaExpect(rect.type).to.equal('RECTANGLE');
    }`,
  },
  async: {
    name: 'async test',
    fn: `async (context, plugmaExpect) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      plugmaExpect(true).to.be.true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }`,
  },
  error: {
    name: 'throws error',
    fn: `(context, plugmaExpect) => {
      throw new Error('Test error');
    }`,
  },
  timeout: {
    name: 'times out',
    fn: `async (context, plugmaExpect) => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    }`,
  },
  manyAssertions: {
    name: 'multiple assertions',
    fn: `(context, plugmaExpect) => {
      const rect = figma.createRectangle();
      plugmaExpect(rect.type).to.equal('RECTANGLE');
      plugmaExpect(rect.id).to.be.a('string');
      plugmaExpect(rect.parent).to.be.null;
      plugmaExpect(rect.children).to.be.an('array').that.is.empty;
    }`,
  },
};

export const pluginStates = {
  clean: {
    nodes: [],
    selection: [],
    viewport: { center: { x: 0, y: 0 }, zoom: 1 },
  },
  withNodes: {
    nodes: [
      { id: 'rect1', type: 'RECTANGLE' },
      { id: 'frame1', type: 'FRAME', children: [] },
    ],
    selection: ['rect1'],
    viewport: { center: { x: 100, y: 100 }, zoom: 2 },
  },
};

export const wsMessages = {
  register: {
    type: "REGISTER_TEST",
    testName: "test1",
    fnString: "() => { expect(true).to.be.true; }",
  },
  run: {
    type: "RUN_TEST",
    testName: "test1",
  },
  assertions: {
    type: "TEST_ASSERTIONS",
    assertionCode: "expect(true).to.be.true;",
  },
  error: {
    type: "TEST_ERROR",
    error: "Test failed",
    pluginState: pluginStates.withNodes,
    originalError: {
      name: "Error",
      message: "Test failed",
      stack: "Error: Test failed\n    at test.ts:1:1",
    },
  },
} as const;
