function(ctx, a) {
	let LOCS = {
		// TODO(rHermes): Implement this
		is_loc: (l) => {

		},

		// TODO(rHermes): Implement this
		is_npc_loc: (l) => {

		},

		is_dead: (l) => {
			const level_msg = #s.scripts.get_level({name: l});
			return level_msg.hasOwnProperty("ok") && !level_msg.ok;
		},

		prune: (id) => {
			const locs = #db.f({_id: id}).first();
			if (!locs) {
				return 0;
			}
			
			const limit = 200;
			let dead_locs = new Set();
			let i = 0;
			for (let loc of locs.locs) {
				if (LOCS.is_dead(loc)) {
					dead_locs.add(loc);
				}

				i++;
				if (i > limit) {
					break;
				}
			}
			
			#db.u1({_id: id}, {$pullAll: {locs: Array.from(dead_locs)}});
			return dead_locs.size;
		},

		prune_t1: () => {
			return LOCS.prune("t1_locs");
		},

		add_t1_locs: (l) => {
			// Insert locs into db.
			let sn = #db.u1({_id: "t1_locs"}, {	$addToSet: {locs: {$each: l}}})[0];
			if (!sn.n) {
				#db.i({_id: "t1_locs", _k: "__locs", locs: l});
			}
		},

		t1_locs: () => {
			const locs = #db.f({_id: "t1_locs"}).first();
			if (!locs) {
				return [];
			}
			return locs.locs;
		},
	};

	return LOCS;
}
