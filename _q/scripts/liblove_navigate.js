function(ctx, a) {
	// This module is in charge of navigating the lock interfaces. This is what
	// most libraries will want to use.

	// IMPORT libraries.
	const STATE = #s._q.liblove_state();
	const T1 = #s._q.liblove_t1();
	const T2 = #s._q.liblove_t2();


	let NAV = {
		// === UTIL ===
		identify: (s) => {
			let lines = STATE.lm(s).split('\n');
			if (lines[lines.length-2] !== "`VLOCK_ERROR`")
				throw new Error("Couldn't find lock error and we are not done!");

			return lines[lines.length-1].match(/`N([a-zA-Z0-9_]+)`/)[1];
		},

		// === MAIN ENTRY POINT ===
		solve: (t) => {
			// Set states to what we need them to be.
			let s = STATE.create_or_load(t.name);

			// Here we need to do some kind of invalidation check,
			// but for now we just check against a tag.
			if (s.invalid) {
				s = STATE.create(t.name);
			}

			// Check to see if we need to call the loc once.
			if (s.loc_calls.length === 0) {
				STATE.call_loc(s, t);
			}
			
			while (!STATE.is_done(s)) {
				// If we have no locks or we the last one was solved, we need to
				// identify.
				if ((s.locks.length === 0) || STATE.ll(s).solved) {
					const lock_name = NAV.identify(s);
					let lck = {
						name: lock_name,
						args: {},
						ctx: {},
						solved: false,
					};
					s.locks.push(lck);
				}

				let l = STATE.ll(s);

				// Now we find the solve function and go ahead.
				let solve_func = T1["solve_" + l.name] || T2["solve_" + l.name];
			
				if (solve_func === undefined) {
					return "Lock " + l.name + " not implemented yet!";
				}
				// Apply solve func. This is where timing would be added.
				solve_func(s,l,t)
				l.solved = true;

				// We store here too, just to be nice.
				STATE.store(s);
			}
			s.ended = s.ended || Date.now();

			STATE.store(s);
			return s;
		},
	};
	return NAV;
}
