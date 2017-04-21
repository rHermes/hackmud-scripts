function(ctx, a) {
	const st_time = Date.now();

	const STATE = #s._q.libpassion_state();
	const LOCS = #s._q.libpassion_locs();

	const create_t1_harvest_stats = () => {
		// Get t1
		const t1_corps = #db.f({_type: STATE.DB_PREFIX,
			stage: "done"
		}).array() || [];


		let inst = {
			"cmd_main": {},
			"opt_main": {},
			"opt_blog": {},
			"opt_pass_scrape": {},
			"opt_pass": {},
			"scraped_projects": {},
			"scraped_users": {},
			"scraped_special": {},
			"cmd_pass": {},
			"spec_lister": {},
			"spec_members": {},
		};
		for (let tc of t1_corps) {
			for (let k in inst) {
				if (inst.hasOwnProperty(k)) {
					for (let p of [].concat(tc.ctx[k] || [])) {
						inst[k][p] = inst[k][p] || 0;
						inst[k][p]++; 
					}
				}
			}
		}

		// Now we convert those value to [{k: "ss", v: "ss"}]format
		let inst_kv = {};
		for (let k1 in inst) {
			if (inst.hasOwnProperty(k1)) {
				inst_kv[k1] = [];
				for (let k2 in inst[k1]) {
					if (inst[k1].hasOwnProperty(k2)) {
						inst_kv[k1].push({key: k2, val: inst[k1][k2]});
					}
				}
			}
		}

		inst_kv["_type"] = "__libpassion_t1_harvest_stats";
		inst_kv["_ts"] = Date.now();
		inst_kv["_version"] = 2;
		return inst_kv;
	}
	
	const t1_prune_total = () => {
		// First, if we either find or create the sn
		let sn = #db.f({_id: "__grace_t1_prune"}).first();
		if (!sn) {
			let kn = #db.f({_id: "t1_locs"}).first();
			sn = {_id: "__grace_t1_prune", check: kn.locs, prune: []};
			#db.i(sn);
		}


		// Now we just keep on looping through check and save.
		while (sn.check.length > 0) {
			if (Date.now() - st_time > 4000) {
				return "Still got " + sn.check.length + " to go! (" + sn.prune.length + " pruned so far)";
			}
			// we do this 100 at a time.
			sn.prune.push(...sn.check.splice(0,100).filter(LOCS.is_dead));
			#db.u1({_id: sn._id},sn);
		}

		// Now we just prune
		#db.u1({_id: "t1_locs"}, {$pullAll: {locs: sn.prune}});

		// Remove the state
		#db.r({_id: sn._id});
	};

	/*
	let stats = create_t1_harvest_stats();
	#db.i(stats);
	return stats.spec_members;
	*/
	//return t1_prune_total();
	/*
	#db.i(stats);
	return stats.good_specs;
	*/
}