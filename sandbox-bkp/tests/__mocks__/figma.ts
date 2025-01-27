/**
 * Mock Figma environment for testing
 */

export class MockNode {
  private static idCounter = 0;
  id = `test-id-${MockNode.idCounter++}`;
  type = "RECTANGLE";
  name = "";
  parent: MockNode | null = null;
  children: MockNode[] = [];

  static resetIdCounter() {
    MockNode.idCounter = 0;
  }

  appendChild(node: MockNode) {
    node.parent = this;
    this.children.push(node);
  }

  remove() {
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index > -1) {
        this.parent.children.splice(index, 1);
      }
      this.parent = null;
    }
  }

  getPluginData(key: string): string {
    return '';
  }
}

export const mockFigma = {
  createRectangle: () => new MockNode(),
  createFrame: () => new MockNode(),
  currentPage: new MockNode(),
  viewport: {
    center: { x: 0, y: 0 },
    zoom: 1
  },
  notify: (message: string) => console.log('[Figma]', message),
  closePlugin: () => console.log('[Figma] Plugin closed'),
  root: new MockNode('DOCUMENT'),
  getNodeById: (id: string) => null,
  getStyleById: (id: string) => null,
  currentUser: { id: '123', name: 'Test User' },
  editorType: 'figma' as const,
  command: 'test',
};
