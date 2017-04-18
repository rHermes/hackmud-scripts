function(ctx, a) {
	// This library deals with any kind state used during harvesting.
	// It also includes some vanity functions, to make life easier.
	
	let STATE = {
		DB_PREFIX: "__libpassion_state_",

		gen_id: (loc_name, tier) => STATE.DB_PREFIX + loc_name.split(".")[0] + "_T"+tier,

		create: (loc_name, tier) => {
			// Name is the location name.
			return {
				_id: STATE.gen_id(loc_name, tier),
				_type: STATE.DB_PREFIX,
				name: loc_name,
				tier: tier,
				started: Date.now(),
				ended: null,

				// Has the run been invalidated since the last time we ran it.
				invalid: false,

				stage: "init",
				ctx: {},
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
		load: (loc_name, tier) => {
			return #db.f({_id: STATE.gen_id(loc_name, tier)}).first();
		},

		// This either creates and inserts or loads from db. If the record
		// is invalid, then we recreate it.
		create_or_load: (loc_name, tier) => {
			let s = STATE.load(loc_name, tier);
			if (s === null || s.invalid) {
				s = STATE.create(loc_name, tier);
				STATE.store(s);
			}
			return s;
		},

		// FUNCTIONS ON STATE
	};

	return STATE;
}

