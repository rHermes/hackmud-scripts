function(ctx, a) {
	// This library deals with any kind state used during the solving.
	// It also includes some vanity functions, to make life easier.
	
	let STATE = {
		DB_PREFIX: "__liblove_state_",
		create: (loc_name) => {
			// Name is the location name.
			return {
				_id: STATE.DB_PREFIX + loc_name,
				_type: STATE.DB_PREFIX,
				name: loc_name,
				started: Date.now(),
				ended: null,

				// Has the run been invalidated since the last time we ran it.
				invalid: false,

				// External call related.
				loc_calls_args: [],
				loc_calls: [],

				// Lock state related
				locks: [],
			}
		},

		// Store the state in the database. This will overwrite anything already
		// stored in the db.
		store: (s) => {
			let sn = #db.u1({_id: s._id}, s)[0];
			// If we don't get anything back, then we must insert.
			if (!sn.n) { 
				sn = #db.i(s);
			}
			return sn;
		},

		// Loads the state from the database, given the location name
		load: (loc_name) => {
			return #db.f({_id: STATE.DB_PREFIX + loc_name}).first();
		},

		// This either creates and inserts or loads from db.
		create_or_load: (loc_name) => {
			let s = STATE.load(loc_name);
			if (s === null) {
				s = STATE.create(loc_name);
				STATE.store(s);
			}
			return s;
		},

		// FUNCTIONS ON STATE

		is_done: (s) => {
			let prt = STATE.lm(s).split('\n');
			return (prt.length > 0 ) && (prt[0] === "`NLOCK_UNLOCKED`" && prt[prt.length-1] === "Connection terminated.");
		},

		// Last message.
		lm: (s) => (s.loc_calls.length === 0) ? "" : s.loc_calls[s.loc_calls.length-1],
		// Last lock
		ll: (s) => (s.locks.length === 0) ? null : s.locks[s.locks.length-1],

		// Calls the external location.
		call_loc: (s, t) => {
			// Build the call arguments.
			let args = {};
			for (let l of s.locks) {
				for (let key in l.args) {
					if (l.args.hasOwnProperty(key)) {
						args[key] = l.args[key];
					}
				}
			}

			// Now add it to the location calls.
			// THis is just for now
			s.loc_calls_args.push(args);
			s.loc_calls.push(t.call(args));

			// We save here every 2 calls.
			if (s.loc_calls.length % 2 == 0)  {
				STATE.store(s);
			}
		},
	};

	return STATE;
}

