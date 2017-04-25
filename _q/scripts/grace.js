function(ctx, a) {
	const st_time = Date.now();

	const STATE = #s._q.libpassion_state();
	const LOCS = #s._q.libpassion_locs();

	const create_t1_harvest_stats = () => {
		// Get t1
		const t1_corps = #db.f({_type: STATE.DB_PREFIX,
			stage: "done",
			tier: 1
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

		// Now we convert those value to [{key: "ss", val: "ss"}]format
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

	// Create a list of t1_user names
	const get_t1_usernames = () => {
		let stats = #db.f({_type: "__libpassion_t1_harvest_stats", _version: 2}).array();

		let merged_users = stats.reduce((a,c) => {
			for (let p of c.scraped_users) {
				a[p.key] = a[p.key] || 0;
				a[p.key] += p.val;
			}
			return a;
		}, {});
		
		let merged_users_list = [];
		for (let k1 in merged_users) {
			if (merged_users.hasOwnProperty(k1)) {
				merged_users_list.push(k1);
			}
		}

		merged_users_list.sort((a,b) => merged_users[b] - merged_users[a]);
		
		return {
			mu: merged_users,
			mul: merged_users_list
		};
	};
	


	const analyze_t1_harvest_stats = () => {
		let stats = #db.f({_type: "__libpassion_t1_harvest_stats", _version: 2}).array();

		let merged_users = stats.reduce((a,c) => {
			for (let p of c.scraped_users) {
				a[p.key] = a[p.key] || 0;
				a[p.key] += p.val;
			}
			return a;
		}, {});
		
		let merged_users_list = [];
		for (let k1 in merged_users) {
			if (merged_users.hasOwnProperty(k1)) {
				merged_users_list.push(k1);
			}
		}

		merged_users_list.sort((a,b) => merged_users[b] - merged_users[a]);
		
		return {
			mu: merged_users,
			mul: merged_users_list
		};
		return merged_users;

		return stats.map(u => u._id);
	};
	
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
				#db.u1({_id: sn._id},sn);
				return "Still got " + sn.check.length + " to go! (" + sn.prune.length + " pruned so far)";
			}
			// we do this 100 at a time.
			sn.prune.push(...sn.check.splice(0,100).filter(LOCS.is_dead));
			#db.u1({_id: sn._id},sn);
		}
		// Now we just prune
		while (sn.prune.length > 0) {
			if (Date.now() - st_time > 4000) {
				#db.u1({_id: sn._id},sn);
				return "Still got " + sn.prune.length + " to remove from db!";
			}
			#db.u1({_id: "t1_locs"}, {$pullAll: {locs: sn.prune.splice(0,100)}});
			#db.u1({_id: sn._id},sn);
		}
		
		// Remove the state
		#db.r({_id: sn._id});
	};

	/*
	let stats = create_t1_harvest_stats();
	#db.i(stats);
	return stats.spec_members;
	*/
	/*
	let ret = analyze_t1_harvest_stats();
	return ret;
*/
	// return t1_prune_total();
	/*
	#db.i(stats);
	return stats.good_specs;
	*/
}