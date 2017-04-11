function(ctx, a) {
	// This module is in charge of navigating the lock interfaces. This is what
	// most libraries will want to use.

	// IMPORT libraries.
	const STATE = #s._q.liblove_state();
	const T1 = #s._q.liblove_t1();


	let NAV = {
		// === UTIL ===
		is_done: (s) => {
			let prt = STATE.lm(s).split('\n');
		
			return (prt.length > 0 ) && (prt[0] === "`NLOCK_UNLOCKED`" && prt[prt.length-1] === "Connection terminated.");
		},

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

			// TODO(rhermes): Check here if ended !== null. If it isn't,
			// then we have already solved this.

			while (!STATE.is_done(s)) {
				// We check if the last lock is solved or not. If it is, then we have to
				// make a call.

				
				const lock_name = NAV.identify(s);
				const solve_func = T1["solve_" + lock_name] || T2["solve_" + lock_name];

				if (solve_func === undefined) {
					throw new Error("Lock " + lock_name + " not implemented yet!");
				}

				// Check if the lock is open or not.

				// Apply solve func. This is where timing would be added.
				solve_func(s, t);

			}

			while (!_S.is_done()) {
				var lock_name = _S.identify();
				var solve_func = _S["solve_" + lock_name];
				
				if (solve_func === undefined) {
					throw new Error("Lock " + lock_name + " not implemented yet!");
				}
				_S

				// Here we update. This ensures that we can use the lm check to ensure that
				// everthing is clean.
				_S.update_db(t);

				var ts_s_lock = Date.now();
				solve_func(t);
				var ts_e_lock = Date.now();
				_S.locks.push(lock_name);
				_S.ts_locks.push(ts_e_lock-ts_s_lock);
			}

			_S.ts_end = Date.now();

			return {
				locks: _S.locks, 
				args: _S.args, 
				loc_calls: _S.msgs.length, 
				ts_total: _S.ts_end - _S.ts_start,
				ts_loc_calls: _S.ts_calls.reduce((a,c) => a+c),
				ts_locks: _S.ts_locks
			};
		},
	};
	};
	return NAV;
}
