function(ctx, a) {
	// This module is in charge of navigating the lock interfaces. This is what
	// most libraries will want to use.

	// IMPORT libraries.
	const STATE = #s._q.liblove_state();
	const T1 = #s._q.liblove_t1();


	let _K = {
		// === UTIL ===
		is_done: (s) => {
			let prt = STATE.lm(s).split('\n');
			return (prt[0] === "`NLOCK_UNLOCKED`" && prt[prt.length-1] === "Connection terminated.");
		},
	};
	return _K;
}
