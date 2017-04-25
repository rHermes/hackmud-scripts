function(ctx, a) {
	// This is for harvesting ALL addresses from a T2 corp.


	// Libraries.
	const LIB = #s._q.lib();
	const STATE = #s._q.libpassion_state();
	const LOCS = #s._q.libpassion_locs();
	const QR = #s._q.qrv2();


	// TEMP SOLUTION TILL WE GET THIS ALL UNDER WRAPS:
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
		
		return merged_users_list;
	};

	let HARVEST_T2 = {
		// TODO(rHermes): make a better system for this
		// TODO(rHermes): Figure out if the same corps have the same nav commands
		// all the time.
		get_main_cmd: (s,t) => {
			s.ctx.pos_usernames = s.ctx.pos_usernames || get_t1_usernames();
			s.ctx.pos_usernames_i = s.ctx.pos_usernames_i || 0;

			// This saves us at most one call, but the science behind it might
			// lead to bigger gains in other application.
			const pos_nav_commands = [
				"navigation", "process", "command", "action", "entry", "open", "show", "cmd", "nav", "get", "see"
			];
			
			while (s.ctx.pos_usernames_i < s.ctx.pos_usernames.length) {
				// If it's less than 4 lines, then it's not a valid username.
				const uname = s.ctx.pos_usernames[s.ctx.pos_usernames_i];
				let out = t.call({username: uname});
					if (out.split('\n').length > 3) {
						// A good one.
						const corrupt_re = /`[a-zA-Z][¡¢£¤¥¦§¨©ª]`/g;
						let navr = out.split('\n')[2].replace(corrupt_re,"$").slice(2,-1);
						
						const pos_cmds = pos_nav_commands.filter(u => 
							(u.length == navr.length) && (navr.split('').every((v,i) => v == "$" || v == u[i]))
						);

						if (pos_cmds.length !== 1) {
							throw new Error("No possible command for: " + navr);
						}

						s.ctx.cmd_main = pos_cmds[0];
						break;
					}
					s.ctx.pos_usernames_i++;
			}
		},

		get_qr_codes: (s,t) => {
			s.ctx.order_ids = s.ctx.order_ids || [];
			
			let args = {};
			args[s.ctx.cmd_main] = "order_qrs";

			while (s.ctx.pos_usernames_i < s.ctx.pos_usernames.length) {
				// If it's less than 4 lines, then it's not a valid username.
				const uname = s.ctx.pos_usernames[s.ctx.pos_usernames_i];
				args["username"] = uname;

				let out = t.call(args);

				// If it's not array, its a valid username.
				if (out.constructor !== Array) {
					s.ctx.pos_usernames_i++;
					continue;
				}

				let oids = [];

				for (let raw_qr of out) {
				// Cut out anything that is short.
					if (raw_qr.length < 20) {
						continue;
					}
					let qra = QR.str_to_arr(raw_qr.split('\n').filter(u => u).join('\n'));
					let payloads = QR.get_data(qra);
					for (let payload of payloads) {
						let idm = payload.match(/"id":"([0-9a-z]+?)"/);
						if (idm !== null) {
							oids.push(idm[1]);
						}
					}
				}
				s.ctx.order_ids.push({user: uname, ids: oids});

				s.ctx.pos_usernames_i++;
				if (s.ctx.pos_usernames_i % 3 == 0) { STATE.store(s); }
			}
		},

		get_locs: (s,t) => {
			s.ctx.locs = s.ctx.locs || [];
			s.ctx.order_ids_i = s.ctx.order_ids_i || 0;
			s.ctx.wip_locs = s.ctx.wip_locs || [];

			let args = {};
			args[s.ctx.cmd_main] = "cust_service";
			
			while (s.ctx.order_ids_i < s.ctx.order_ids.length) {
				let oid = s.ctx.order_ids[s.ctx.order_ids_i];
				s.ctx.order_ids_j = 	s.ctx.order_ids_j || 0;

				args["username"] = oid.user;
				
				while (	s.ctx.order_ids_j < oid.ids.length) {
						args["order_id"] = oid.ids[s.ctx.order_ids_j];

						let f = () => [t.call(args).split('\n')[1]]
						let out = t.call(args);

						if (out.split('\n').length !== 3) {
							throw new Error("There was not 3 lines!");
						}
						let locs = LIB.decorrupt(f).join("").split(":")[1].split(" ").filter(u => u);
						s.ctx.wip_locs.push(...locs);
					
						s.ctx.order_ids_j++;
				}

				s.ctx.order_ids_j = 0;
				s.ctx.order_ids_i++;
				STATE.store(s);	
			}
			let locs = Array.from(new Set(s.ctx.wip_locs)).sort();
			delete s.ctx.wip_locs;
			s.ctx.locs_n = s.ctx.locs_n || locs.length;
			LOCS.add_t2_locs(locs);
		},

		harvest: (t) => {
			let s = STATE.create_or_load(t.name, 2);
			
			// First we do is check on the stage of the harvest state.
			while (s.stage !== "done") {
				// Here we do the desicion.
				switch (s.stage) {
					case "init":
						s.stage = "get_main_cmd";
						break;
					case "get_main_cmd":
						HARVEST_T2.get_main_cmd(s, t);
						s.stage = "get_qr_codes";
						break;
					case "get_qr_codes":
						HARVEST_T2.get_qr_codes(s, t);
						s.stage = "get_locs";
						break;
					case "get_locs":
						HARVEST_T2.get_locs(s, t);
						s.stage = "done";
						break;
					default:
						return "THIS IS NOT A VALID STAGE!";
				}
				
				STATE.store(s);
			}
			return s;
		}
	};

	return HARVEST_T2;
}
