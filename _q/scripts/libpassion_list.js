function(ctx, a) {
	let LIST = {
		DB_PREFIX: "__libpassion_list_",

		CORP_NAMES: [
			"amal_robo","archaic","bluebun","bunnybat_hut","context","core","cyberdine",
			"empty_nest","futuretech","halperyon","kill_9_1","kill_bio","legion_bible",
			"legion_intl","light","lowell_extermination","marco_polo","merrymoor_pharma",
			"nation_of_wales","nuutec","protein_prevention","ros13","ros_13_update_checker",
			"setec_gas","sn_w","soylentbean","suborbital_airlines","tandoori",
			"the_holy_checksum","tyrell","turing_testing","vacuum_rescue","welsh_measles_info",
			"weyland","world_pop"
		],

		get_npcs: () => {
			return #db.f({_id: LIST.DB_PREFIX + "current"}).first();
		},

		update_db: () => {
			const FS = #s.scripts.fullsec();
			const HS = #s.scripts.highsec();
			const MS = #s.scripts.midsec();
			const LS = #s.scripts.lowsec();

			// This is for T1, T2 and T3

			let corp_names = [FS, [].concat(HS,MS), LS].map(c => {
				return c.filter(u => LIST.CORP_NAMES.indexOf(u.split(".")[0]) !== -1);
			});

			const c_state = {
				_id: LIST.DB_PREFIX + "current",
				_type: LIST.DB_PREFIX,
				ts: Date.now(),
				t1: corp_names[0],
				t2: corp_names[1],
				t3: corp_names[2],
			};

			let sn = #db.u1({_id: c_state._id}, c_state)[0];
			// If we don't get anything back, then we must insert.
			if (!sn.n) { 
				sn = #db.i(c_state);
			}

			return c_state;
		}
	};
	
	return LIST;
}
