# Plugma Testing

A testing framework for Figma plugins that provides a familiar testing experience using Vitest's API. Write tests that look and feel like regular Vitest tests, but execute directly in Figma.

## Overview

The testing framework bridges the gap between Node.js and Figma environments:

1. **Test Registration**: Tests are registered in Figma when the plugin loads
2. **Test Execution**: Tests run in Figma but are controlled from Node
3. **Assertion Collection**: Assertions are collected in Figma and replayed in Node
4. **Result Reporting**: Results are reported through Vitest's native reporting

## For Plugin Developers

### Writing Tests

Write tests using the familiar Vitest/Jest syntax:

~~~ts
import { expect, test } from "plugma";

test("creates a rectangle", async () => {
  const rect = figma.createRectangle();
  rect.resize(100, 100);
  
  expect(rect.type).to.equal("RECTANGLE");
  expect(rect.width).to.equal(100);
});
~~~

### Running Tests

Run tests using Vitest's CLI:

~~~bash
vitest run                 # Run all tests
vitest run rectangle.test  # Run specific test file
vitest watch              # Watch mode
~~~

### Test Environment

- Tests execute in the Figma plugin environment
- Full access to `figma` API
- Async/await support
- TypeScript support
- Chai-style assertions

## For Framework Developers

### Architecture

The framework operates in two environments simultaneously:

#### Node Environment
- Test discovery and registration
- WebSocket communication with Figma
- Assertion reconstruction and verification
- Test result reporting

#### Figma Environment
- Test execution
- Assertion collection
- Plugin API access
- Result serialization

### Implementation Details

1. **Test Registration**
   - Tests are automatically registered in Figma when imported
   - Each test is stored with a unique name in the test registry
   - No test code is sent over WebSocket

2. **Test Execution**
   - Node sends test name to Figma
   - Figma executes the corresponding test
   - Assertions are collected during execution
   - Results are sent back to Node

3. **Assertion Handling**
   - Figma uses a proxy-based expect implementation
   - Assertions are recorded as method call chains
   - Chains are serialized and sent to Node
   - Node reconstructs and executes assertions

4. **Communication**
   - WebSocket connection between Node and Figma
   - Simple message protocol for test execution
   - Serializable assertion format
   - Error handling and timeout support

### Core Components

1. **Test Registry**
   - Stores test functions
   - Handles test lookup and execution
   - Environment-aware behavior

2. **Assertion Collector**
   - Records assertions in Figma
   - Converts assertions to transportable format
   - Handles cleanup between tests

3. **Test Runner**
   - Manages test execution flow
   - Handles communication between environments
   - Integrates with Vitest

4. **Expect Implementation**
   - Chai-compatible API
   - Proxy-based chain recording
   - Automatic serialization support

## Best Practices

1. **Test Organization**
   - Group related tests in files
   - Use descriptive test names
   - Keep tests focused and isolated

2. **Assertions**
   - Use expressive assertions
   - Check relevant properties
   - Handle async operations properly

3. **Plugin State**
   - Clean up after tests
   - Don't rely on global state
   - Reset plugin state between tests

4. **Error Handling**
   - Handle expected errors
   - Test error conditions
   - Use try/catch appropriately

## Limitations

1. **Environment**
   - Tests must be compatible with Figma environment
   - Limited access to Node.js APIs
   - No direct file system access

2. **Async Operations**
   - All tests are inherently async
   - Must handle promises correctly
   - Watch for timing issues

3. **State Management**
   - No built-in test isolation
   - Manual cleanup required
   - Shared plugin environment

## Future Improvements

1. **Test Isolation & State Management**
   - Automatic plugin state reset between tests
   - Resource tracking and cleanup (nodes, event listeners)
   - Restore initial selection after tests
   - Better test separation and context management
   - Proper cleanup mechanisms

2. **Error Handling & Debugging**
   - Better error messages with stack traces
   - Plugin state capture on failures
   - Improved error propagation across environments
   - Better debugging tools and logging
   - IDE integration for debugging
   - Runtime type validation for messages

3. **WebSocket Communication**
   - Connection recovery and auto-reconnect
   - Message queuing for better throughput
   - Proper request/response matching
   - Better connection state management
   - Improved error recovery

4. **Performance & Scalability**
   - Parallel test execution support
   - Smarter test scheduling
   - Reduced communication overhead
   - Better handling of test file dependencies
   - Message batching and optimization

5. **Developer Experience**
   - Configuration system with smart defaults
   - Comprehensive API documentation
   - Helper utility functions
   - Visual test results and reporting
   - Better TypeScript integration
   - Lifecycle hooks (before/after)
   - Plugin-specific type extensions

6. **Code Quality & Maintenance**
   - Configurable debug logging
   - Better module organization
   - Clear initialization sequence
   - Proper error boundaries
   - Robust object serialization
   - Elimination of any types 
