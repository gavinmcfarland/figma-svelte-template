/**
 * Sets up a global reference to ensure consistent access to global scope across different JavaScript environments.
 * This is particularly useful for ensuring compatibility across Node.js, browser, and other JavaScript runtimes.
 */
(() => {
  type GlobalRef = typeof globalThis & {
    global?: typeof globalThis;
  };

  // Cast each potential global object to GlobalRef to satisfy TypeScript
  const globalRef: GlobalRef = (
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
        ? self
        : typeof window !== 'undefined'
          ? window
          : {}
  ) as GlobalRef;

  if (typeof globalRef.global === 'undefined') {
    globalRef.global = globalRef;
    console.log('global is now defined globally:', globalRef.global);
  }
})();
