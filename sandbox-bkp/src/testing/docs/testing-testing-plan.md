# Testing the Testing Module

This document outlines the plan for testing the Plugma testing module itself.

## Test Organization

Tests will be organized by module, with integration tests covering cross-module functionality:

```
tests/
  unit/
    assertion.test.ts
    registry.test.ts
    test-runner.test.ts
    ws-client.test.ts
  integration/
    test-execution.test.ts
    error-handling.test.ts
    timeout-handling.test.ts
```

## Unit Tests

### assertion.ts
1. **Expect Proxy**
   - Correctly generates code strings for different assertion types
   - Handles method chaining properly
   - Serializes different value types correctly
   - Properly collects assertions in test context

2. **Assertion Execution**
   - Executes generated code strings correctly
   - Handles errors in assertion execution
   - Maintains proper assertion order

### registry.ts
1. **Test Registration**
   - Registers tests with unique names
   - Prevents duplicate test names
   - Validates test function format

2. **Test Context**
   - Creates proper test context
   - Tracks test timing correctly
   - Manages assertion collection

### test-runner.ts
1. **Test Function**
   - Properly wraps Vitest's test function
   - Handles async test functions
   - Manages test timeouts correctly

2. **Error Handling**
   - Handles test timeouts properly
   - Provides detailed error messages
   - Preserves stack traces
   - Includes plugin state in errors

### ws-client.ts
1. **Connection Management**
   - Establishes WebSocket connection
   - Handles connection errors
   - Manages connection state

2. **Message Handling**
   - Sends messages correctly
   - Handles responses properly
   - Manages timeouts
   - Cleans up resources

## Integration Tests

### Test Execution Flow
1. **Basic Test Flow**
   - Test registration to completion
   - Assertion collection and execution
   - Result reporting

2. **Complex Scenarios**
   - Multiple tests in sequence
   - Tests with many assertions
   - Tests with async operations

### Error Handling
1. **Test Errors**
   - Plugin errors during test
   - Assertion failures
   - Timeout errors
   - WebSocket errors

2. **Error Propagation**
   - Error details preserved
   - Stack traces maintained
   - Plugin state captured

### Timeout Handling
1. **Test Timeouts**
   - Test execution timeout
   - Message response timeout
   - Cleanup after timeout

2. **Recovery**
   - State cleanup after timeout
   - Connection recovery
   - Queue management

## Test Environment

We'll need to mock:
1. Figma plugin environment
2. WebSocket server
3. Vitest test function

## Test Data

Create fixtures for:
1. Test functions with various scenarios
2. Plugin state snapshots
3. WebSocket messages
4. Error cases

## Test Utilities

Create helpers for:
1. Mock Figma environment
2. WebSocket server simulation
3. Test state inspection
4. Assertion verification

## Implementation Plan

1. **Phase 1: Setup**
   - Create test environment
   - Implement mocks
   - Create test utilities

2. **Phase 2: Unit Tests**
   - Write assertion tests
   - Write registry tests
   - Write test-runner tests
   - Write ws-client tests

3. **Phase 3: Integration Tests**
   - Write test execution tests
   - Write error handling tests
   - Write timeout handling tests

4. **Phase 4: Coverage & Cleanup**
   - Check test coverage
   - Add missing test cases
   - Clean up test code
   - Document test suite 

# Testing the Testing Framework

## Test Execution Checklist
- [x] `__tests__/unit/assertion.test.ts`: Test assertion proxy and code generation
- [ ] `__tests__/unit/registry.test.ts`: Test test registration and execution
- [ ] `__tests__/unit/test-runner.test.ts`: Test test runner functionality
- [ ] `__tests__/unit/ws-client.test.ts`: Test WebSocket client
- [ ] `__tests__/integration/test-flow.test.ts`: Test complete test flow

## Test Strategy

```
tests/
  unit/
    assertion.test.ts
    registry.test.ts
    test-runner.test.ts
    ws-client.test.ts
  integration/
    test-execution.test.ts
    error-handling.test.ts
    timeout-handling.test.ts
```
