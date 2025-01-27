# Testing Module Implementation Diagnostics

## Files in Testing Module

1. `assertion.ts` - Handles assertion creation and reconstruction
2. `registry.ts` - Test registry implementation (moved from figma/)
3. `test-runner.ts` - Node-side test execution
4. `types.ts` - Type definitions
5. `ws-client.ts` - WebSocket communication
6. `index.ts` - Main module exports
7. `how-it-works.md` - Module design document

## Analysis Progress

- [x] assertion.ts
- [x] figma.ts (removed)
- [x] figma/expect.ts (removed)
- [x] figma/index.ts (removed)
- [x] figma/registry.ts (moved to root)
- [x] figma/runner.ts (removed)
- [x] index.ts
- [x] test-runner.ts
- [x] types.ts
- [x] ws-client.ts

## Fixing Progress

Current file: registry.ts

### Status
- [x] assertion.ts
  - [x] Fix type safety issues with Assertion type indexing
  - [x] Add proper typing to proxy implementation
  - [x] Fix assertion chain to match sequence diagram
  - [x] Move debug logging behind flag
  - [x] Improve error handling
  - [x] Clean up template literals
- [x] test-runner.ts
  - [x] Consolidate runner functionality
  - [x] Add proper timeout handling
    - [x] Basic timeout config
    - [x] Timeout error handling
    - [x] Cleanup on timeout
  - [x] Improve error handling
    - [x] Basic error catching
    - [x] Error logging
    - [x] Add detailed error messages
    - [x] Add stack traces
    - [x] Add plugin state in errors
- [x] figma/runner.ts (Removed - functionality consolidated)
- [x] registry.ts
  - [x] Move to root level
  - [x] Add lifecycle hooks
  - [x] Add test context
  - [x] Add validation for test names
  - [x] Fix type errors in TestContext
- [x] ws-client.ts
  - [x] Add timeout handling
- [x] types.ts
  - [x] Update message types
  - [x] Add configuration types
  - [x] Add lifecycle hook types
  - [x] Fix TestContext type
- [x] index.ts
  - [x] Update exports
  - [x] Add configuration exports
  - [x] Improve documentation

## Future Improvements

1. **Connection Recovery**
   - Auto reconnect on disconnect
   - Resume test execution

2. **WebSocket Client**
   - Message queuing for better throughput
   - Proper request/response matching
   - Better connection state management
   - Improved error recovery

3. **Parallel Test Support**
   - Coordinate parallel execution
   - Handle test file dependencies

4. **Test Isolation**
   - Reset plugin state between tests
   - Clean up created nodes
   - Restore initial selection
   - Track and clean up event listeners

## Next Steps

1. Complete timeout handling in test-runner.ts
2. Add detailed error messages and stack traces
3. Add timeout handling in ws-client.ts
4. Update message types and configuration
5. Update exports and documentation

## File Analysis

### assertion.ts

Issues:
1. **Type Safety**: Multiple TypeScript errors around indexing Assertion type with strings, suggesting the type definitions aren't properly handling Chai's dynamic nature.
2. **Proxy Implementation**: The proxy implementation lacks proper typing and has an implicit 'any' type.
3. **Assertion Chain**: The implementation differs from the design doc's sequence diagram - it directly executes assertions instead of collecting them for batch execution.
4. **Console Logging**: Excessive debug logging that should be behind a debug flag.
5. **Error Handling**: Try-catch blocks swallow some errors by only logging them, potentially masking issues.
6. **Template Literals**: Unnecessary use of template literals for simple string concatenation, as noted by linter.

#### Changes Made to assertion.ts

1. Simplified assertion handling:
   - Removed AssertionChain in favor of direct code string generation
   - Using Chai.ExpectStatic type for proper type hints
   - Simplified proxy implementation to generate code strings directly
   - Proper string serialization of values and arguments

2. Improved code organization:
   - Using plugma's Log class from "plugma/logger"
   - Added proper indentation for log readability
   - Clear separation between proxy creation, assertion generation, and execution

3. Fixed assertion execution:
   - Now directly generates code strings as designed
   - Proper execution using Function constructor with Vitest's expect
   - Clear error handling and propagation

4. Code quality improvements:
   - Proper logging through plugma's Log class
   - Clean and focused implementation
   - Improved code documentation
   - Better type safety with Chai.ExpectStatic

### test-runner.ts

The test runner is responsible for bridging Vitest and Figma, as per the design document.

#### Current Implementation Issues

1. **Split Responsibilities**:
   - Currently split between `test-runner.ts` and `figma/runner.ts` unnecessarily
   - Test execution logic is duplicated
   - Message handling is scattered

2. **Divergence from Design**:
   - Design shows a single TestRunner component that:
     1. Bridges Vitest and Figma
     2. Manages WebSocket communication
     3. Executes assertion code
   - Current split implementation adds unnecessary complexity

3. **Missing Features**:
   - Proper timeout handling
   - Test cancellation
   - Connection recovery
   - Parallel test file execution in Node

#### Required Changes

1. **Consolidate Runner Logic**:
   - Remove `figma/runner.ts`
   - Move message handling to `test-runner.ts`
   - Keep test execution in `figma/registry.ts`

2. **Simplify Test Flow**:
   - Node: `test-runner.ts`
     - Integrates with Vitest
     - Manages WebSocket communication
     - Sends test commands to Figma
     - Executes assertions with Vitest's expect
   - Figma: `registry.ts`
     - Maintains test registry
     - Executes tests
     - Collects assertions via expect proxy

3. **Add Missing Features**:
   - Add proper timeout handling
   - Add test cancellation support
   - Add connection recovery
   - Add parallel test file support
   - Improve error reporting

#### Update Fixing Progress

Current files to fix:
- [ ] test-runner.ts
  - [ ] Consolidate runner functionality
  - [ ] Add proper timeout handling
  - [ ] Add test cancellation
  - [ ] Add connection recovery
  - [ ] Add parallel test support
- [ ] figma/registry.ts
  - [ ] Add proper test isolation
  - [ ] Add lifecycle hooks
  - [ ] Improve error handling
- [ ] ws-client.ts
  - [ ] Add timeout handling
  - [ ] Add connection recovery
  - [ ] Add message queuing
- [ ] types.ts
  - [ ] Update message types
  - [ ] Add configuration types
  - [ ] Add lifecycle hook types
- [ ] index.ts
  - [ ] Update exports
  - [ ] Add configuration exports
  - [ ] Improve documentation

### types.ts

Issues:
1. **Type Safety**: Union type with `void` is confusing and potentially problematic.
2. **Assertion Types**: Commented-out extensions to Chai.Assertion type that should be implemented.
3. **Message Types**: Missing several message types described in the sequence diagram.
4. **Test Context**: Test context type is overly simplified compared to design.
5. **Documentation**: Missing detailed type documentation as specified.
6. **Extensibility**: No support for plugin-specific type extensions.
7. **Error Types**: Missing dedicated error types for different failure scenarios.
8. **Configuration Types**: Missing types for test configuration as planned.

### ws-client.ts

Issues:
1. **Connection Management**: Basic reconnection logic that doesn't match the resilient design.
2. **Message Queue**: Simple array-based queue could lead to memory issues with many tests.
3. **Error Handling**: Missing several error scenarios described in the design.
4. **Timeout Handling**: No timeout implementation for message responses.
5. **State Management**: Global WebSocket instance could cause issues with parallel tests.
6. **Type Safety**: Missing runtime type validation for messages.
7. **Logging**: Debug logging should be configurable/removable in production.
8. **Resource Cleanup**: No automatic cleanup of queued messages on errors.

## Summary of Major Divergences

1. **Security Concerns**
   - Use of `eval()` and `new Function()` for code execution
   - Lack of proper sandboxing for test execution
   - Missing input validation in several places

2. **Architecture Deviations**
   - Simplified message protocol compared to design
   - Missing several planned features (hooks, parallel execution)
   - Incomplete error handling scenarios

3. **Type Safety Issues**
   - Multiple uses of `any` type
   - Incomplete type definitions
   - Missing runtime type checks

4. **State Management**
   - Global state in multiple components
   - Insufficient test isolation
   - Missing cleanup mechanisms

5. **Implementation Gaps**
   - Missing configuration system
   - Incomplete lifecycle hooks
   - Limited debugging capabilities
   - Missing planned utility functions

6. **Code Quality**
   - Duplicate code in multiple places
   - Inconsistent error handling
   - Excessive debug logging
   - String-based code manipulation

## Prioritized Fix List

### High Priority (Stability & Correctness)
- [ ] Fix duplicate TestRegistry implementation between figma.ts and figma/registry.ts
- [ ] Implement proper test isolation and state cleanup mechanisms as specified in design
- [ ] Add proper error handling and propagation across all modules
- [ ] Fix type safety issues and remove unnecessary `any` usage

### Medium Priority (Functionality)
- [ ] Implement missing message types and handlers according to sequence diagram
- [ ] Add configuration system and types
- [ ] Implement lifecycle hooks (before/after)
- [ ] Add proper test context management
- [ ] Implement proper WebSocket connection management with timeouts

### Low Priority (Quality & Maintenance)
- [ ] Move debug logging behind configuration flag
- [ ] Clean up template literal usage where not needed
- [ ] Improve documentation across all modules
- [ ] Add missing utility functions
- [ ] Implement proper debugging capabilities as specified in design

## Current Task
Working on: Reviewing implementation against design document

Notes on previous analysis:
1. Removed incorrect security concerns about eval/Function usage
   - Code strings are generated by our own code
   - Only used during development/testing
   - Not part of production plugin code
2. Current implementation actually follows the design well in terms of:
   - Code string generation in Figma
   - WebSocket communication
   - Assertion execution in Node
3. Real issues to focus on:
   - Duplicate code (TestRegistry)
   - Test isolation
   - Error handling
   - Type safety
   - Missing features from design

## Next Steps

1. Fix duplicate TestRegistry implementation
2. Add missing message types and handlers
3. Improve type safety where needed
4. Implement test isolation mechanisms
5. Add configuration system
6. Add lifecycle hooks
7. Improve error handling
8. Add debugging capabilities
9. Add missing utility functions
10. Improve documentation

## Implementation Notes

### Expect Proxy and Test Execution
1. The expect proxy in `assertion.ts` is correctly implemented:
   - Generates code strings as designed
   - Automatically collects assertions in `currentTest.assertions`
   - Uses proper typing with `Chai.ExpectStatic`
