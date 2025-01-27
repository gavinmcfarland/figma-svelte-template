/**
 * Creates a proxy-based chain recorder that mimics Chai's expect API structure.
 * Each method call in the chain is recorded as a tuple of [methodName, ...args].
 * The proxy automatically converts to the chain array when serialized.
 *
 * @param {unknown} value - The initial value to start the expectation chain
 * @returns {ExpectProxy} A proxy object that records the chain of method calls
 *
 * @example
 * ```ts
 * const A = "aaa";
 * const B = "bbb";
 * expect(A).to.equals(B)
 * // Returns: [['expect', ['aaa']], ['to'], ['equals', ['bbb']]]
 * ```
 */

type ChainEntry = [string, unknown[]?];
type ChainArray = ChainEntry[];

// Base type for callable objects
type CallableObject = {
  (...args: unknown[]): unknown;
  [key: string]: unknown;
};

interface ExpectProxy extends CallableObject {
  [Symbol.toStringTag]: string;
  [Symbol.toPrimitive]: () => ChainArray;
  [Symbol.iterator]: () => Iterator<ChainEntry>;
  toJSON: () => ChainArray;
}

export const expect = (value: unknown): ExpectProxy => {
  const chain: ChainArray = [['expect', [value]]];

  const handler: ProxyHandler<CallableObject> = {
    get: (_target, prop: string | symbol): unknown => {
      if (typeof prop === 'symbol') {
        if (prop === Symbol.toStringTag) {
          return 'Assertion';
        }
        if (prop === Symbol.toPrimitive) {
          return () => chain;
        }
        if (prop === Symbol.iterator) {
          return () => chain[Symbol.iterator]();
        }
      }
      if (typeof prop === 'string') {
        if (prop === 'toJSON') {
          return () => chain;
        }

        chain.push([prop]);
        return proxy;
      }
      return undefined;
    },
    apply: (_target, _thisArg, args: unknown[]): ExpectProxy => {
      const lastEntry = chain[chain.length - 1];
      lastEntry[1] = args;
      return proxy;
    }
  };

  const proxy = new Proxy((() => {}) as CallableObject, handler) as ExpectProxy;
  return proxy;
};
