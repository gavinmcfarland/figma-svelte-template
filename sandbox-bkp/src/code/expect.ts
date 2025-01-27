import type { expect as ChaiExpect } from "chai";

/**
 * Type representing a chain entry with method name and optional arguments
 */
export type ChainExpr = [methodName: string, args?: unknown[]];

/**
 * Type for the proxy object that records the chain
 */
// export interface ChainRecorder {
//   chain: ChainEntry[];
//   toString(): ChainEntry[];
//   to: ChainRecorder;
//   equal(expected: unknown): ChainRecorder;
//   equals(expected: unknown): ChainRecorder;
//   [key: string]: unknown;
// }

/**
 * Creates a proxy-based chain recorder that mimics Chai's expect API structure.
 * Each method call in the chain is recorded as a tuple of [methodName, ...args].
 *
 * @param value - The initial value to start the expectation chain
 * @returns A proxy object that records the chain of method calls
 *
 * @example
 * ```ts
 * const A = "aaa";
 * const B = "bbb";
 * expect(A).to.equals(B)
 * // Returns: [['expect', ['aaa']], ['to'], ['equals', ['bbb']]]
 * ```
 */
export const expect = ((value: unknown): ReturnType<typeof ChaiExpect> => {
  const chain: ChainExpr[] = [['expect', [value]]];

  const handler: ProxyHandler<object> = {
    get: (_target: object, prop: string | symbol) => {
      if (typeof prop !== 'string') return undefined;

      // Return a proxy for any property access
      return new Proxy(() => {}, {
        // Handle method calls
        apply: (_target: object, _thisArg: unknown, args: unknown[]) => {
          chain.push([prop, args]);
          return proxy;
        },
        // Handle property access
        get: (_target: object, nextProp: string | symbol) => {
          chain.push([prop]);
          // Return a new proxy for chaining
          return new Proxy(() => {}, handler);
        }
      });
    }
  };

  const proxy = new Proxy({}, handler) as ReturnType<typeof ChaiExpect>;

  // Override toString to return the chain when the proxy is coerced to a string
  Object.defineProperty(proxy, 'toString', {
    value: () => chain,
    writable: false,
    enumerable: false,
    configurable: true
  });

  // Also expose the chain directly
  Object.defineProperty(proxy, 'chain', {
    get: () => chain,
    enumerable: false,
    configurable: true
  });

  return proxy;
}) as unknown as typeof ChaiExpect;
