function(ctx, a) {
	let LIST = {
		DB_PREFIX: "__libpassion_list_",

		T1_CORP_NAMES: [
			"amal_robo","archaic","bluebun","bunnybat_hut","context","core","cyberdine",
			"empty_nest","futuretech","halperyon","kill_9_1","kill_bio","legion_bible",
			"legion_intl","light","lowell_extermination","marco_polo","merrymoor_pharma",
			"nation_of_wales","nuutec","protein_prevention","ros13","ros_13_update_checker",
			"setec_gas","sn_w","soylentbean","suborbital_airlines","tandoori",
			"the_holy_checksum","tyrell","turing_testing","vacuum_rescue","welsh_measles_info",
			"weyland","world_pop"
		],

		T2_CORP_NAMES: [
			"bunnybat_hut", "cyberdine", "setec_gas", "soylentbean", "suborbital_airlines",
			"tandoori", "tyrell", "weyland"
		],

		T3_CORP_NAMES: [
			"archaic", "context", "core", "futuretech", "halperyon", "light", "nuutec", "sn_w"
		],

		get_npcs: () => {
			return #db.f({_id: LIST.DB_PREFIX + "current"}).first();
		},

		update_db: () => {
			const FS = #s.scripts.fullsec();
			const HS = #s.scripts.highsec();
			const MS = #s.scripts.midsec();
			const LS = #s.scripts.lowsec();

			// This is for T1, T2 and T3. The lookup is ugly, but sue me.
			let corp_names = [FS, [].concat(HS,MS), LS].map((c,i) => {
				const LST = LIST["T"+(i+1)+"_CORP_NAMES"];
				return c.filter(u => LST.indexOf(u.split(".")[0]) !== -1);
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
