function(ctx, a) {
	// This library deals with any kind state used during the solving.
	// It also includes some vanity functions, to make life easier.
	
	let _K = {
		DB_PREFIX: "__liblove_state_",
		create: (loc_name) => {
			// Name is the location name.
			return {
				_id: _K.DB_PREFIX + loc_name,
				name: loc_name,
				started: Date.now(),
				ended: null,

				// External call related.
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
			return #db.f({_id: _K.DB_PREFIX + loc_name}).first();
		},

		// This either creates and inserts or loads from db.
		create_or_load: (loc_name) => {
			let s = _K.load(loc_name);
			if (s === null) {
				s = _K.create(loc_name);
				_K.store(s);
			}
			return s;
		},

		// FUNCTIONS ON STATE

		// Last message.
		lm: (s) => s.loc_calls[s.loc_calls.length-1],

		// Calls the external location.
		call_loc: (s, t) => {
			// Build the call arguments.
			let args = {};
			for (let l of locks) {
				for (let arg of l.args) {
					args[arg.key] = arg.value;
				}
			}

			// Now add it to the location calls.
			s.loc_calls.push(t.call(args));
		},
	};

	return _K;
}

