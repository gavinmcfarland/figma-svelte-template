(function () {
	const globalRef = typeof globalThis !== 'undefined' ? globalThis :
		typeof self !== 'undefined' ? self :
			typeof window !== 'undefined' ? window :
				typeof this !== 'undefined' ? this : {};

	if (typeof globalRef.global === 'undefined') {
		globalRef.global = globalRef;  // Ensure global is set
		console.log("global is now defined globally:", globalRef.global);
	}
})();
