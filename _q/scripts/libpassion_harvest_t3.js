function(ctx, a) {
	// This is for harvesting ALL addresses from a T2 corp.


	// Libraries.
	const LIB = #s._q.lib();
	const STATE = #s._q.libpassion_state();
	const LOCS = #s._q.libpassion_locs();


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

	let HARVEST_T3 = {
		get_user_pins: (s,t) => {
			s.ctx.pos_usernames = s.ctx.pos_usernames || get_t1_usernames();
			s.ctx.pos_usernames_i = s.ctx.pos_usernames_i || 0;
			s.ctx.cur_pin = s.ctx.cur_pin || [0,0,0,0];
			s.ctx.user_pins = s.ctx.user_pins || [];

			let iii = 0;

			let args = {};
			while (s.ctx.pos_usernames_i < s.ctx.pos_usernames.length) {
				const uname = s.ctx.pos_usernames[s.ctx.pos_usernames_i];
				args["username"] = uname;
				args["pin"] = s.ctx.cur_pin.join("");

				const corrupt_re = /`[a-zA-Z][¡¢£¤¥¦§¨©ª]`/g;
				let out = t.call(args);
				let os = out.split('\n');

				if (os.length > 6) {
					// Good combination
					s.ctx.user_pins.push({
						user: args["username"],
						pin: args["pin"]
					});

					s.ctx.cur_pin = [0,0,0,0];
					s.ctx.pos_usernames_i++;
					s.stage = "get_cal_ids";
					return;
				} else if (os[3].replace(corrupt_re,"$").length !== 14) {
					// This is to long to be correct?
					s.ctx.pos_usernames_i++;
				} else {
					// now update the pin.
					s.ctx.cur_pin[3]++;
					for (let i = 3; i > 0; i--) {
						if (s.ctx.cur_pin[i] == 10) {
							s.ctx.cur_pin[i-1]++;
							s.ctx.cur_pin[i] = 0;
						}
					}
					if (s.ctx.cur_pin[0] == 10) {
						throw new Error("We are at the end!");
					}
				}
				iii++;
				if (iii % 10 == 0) { STATE.store(s)};
			}
			s.stage = "done";	
		},

		get_cal_ids: (s, t) => {
			const parse_cal = (o) => {
				let os = o.split('\n');
				let head = os[0];
				let year = os[2];
				let b = os.slice(3).map(u => u.split(''));

				let days = [];
				// I assume it's always 3 x 4 grid.
				for (let i = 0; i < 3; i++) {
					for (let j = 0; j < 4; j++) {
						let day = b[i*5].slice(2+9*j,2+9*j+3).join('');
						let ids = b.slice(i*5 + 1, i*5 + 5).map(u => u.slice(2+9*j,2+9*j+6).join('')).filter(u => u != "      ");

						if (ids.length > 0) {
							days.push({
								day: day,
								ids: ids,
								x: j,
								y: i
							});
						}
					}
				}
				return {
					head: head,
					year: year,	
					days: days
				};
			};

			let cuser = s.ctx.user_pins[s.ctx.user_pins.length-1];
			// init
			cuser.cal_pages = cuser.cal_pages || [];
			cuser.cal_d = cuser.cal_d || -1860;
			
			// we are always solving for the last known user.
			let args = {
				username: cuser.user,
				pin: cuser.pin,
				perform: "flow"
			};

			while (cuser.cal_d < 120) {
				args["d"] = cuser.cal_d;

				let rawout = t.call(args);
				const color_re = /`[a-zA-Z](.*?)`/g;
				let cleanout = rawout.replace(color_re, "$1");

				let pc = parse_cal(cleanout);

				if (pc.days.length > 0) {
					cuser.cal_pages.push(pc);
					if(!cuser.first_view_page) {
						cuser.first_view_page = cuser.cal_d;
					}
				}
				
				cuser.cal_d += 12;
				STATE.store(s);
			}
		},

		get_cal_data: (s, t) => {
			let cuser = s.ctx.user_pins[s.ctx.user_pins.length-1];
			
			// init
			cuser.cal_pages_i = cuser.cal_pages_i || 0;

			cuser.cal_ids_data = cuser.cal_ids_data || [];
			
			cuser.cal_ids_arr = cuser.cal_ids_arr || [].concat(...cuser.cal_pages.map(u => [].concat(...u.days.map(v => v.ids))));
			cuser.cal_ids_arr_i = cuser.cal_ids_arr_i || 0;

			// we are always solving for the last known user.
			let args = {
				username: cuser.user,
				pin: cuser.pin,
				perform: "flow"
			};

			while (cuser.cal_ids_arr_i < cuser.cal_ids_arr.length) {
				// let page = cuser.cal_pages[cuser.cal_pages_i];

				args["i"] = cuser.cal_ids_arr[cuser.cal_ids_arr_i];

				let out = t.call(args);

				cuser.cal_ids_data.push({
					id: args["i"],
					out: out
				});


				cuser.cal_ids_arr_i++;
				STATE.store(s);
			}
		},

		harvest: (t) => {
			let s = STATE.create_or_load(t.name, 3);
			/*
			let cuser = s.ctx.user_pins[s.ctx.user_pins.length-1];
			return #s.ultrahacker25.base64({encrypt: true, msg: JSON.stringify(cuser.cal_ids_data)});
			*/
			let frst = true;
			// First we do is check on the stage of the harvest state.
			while (s.stage !== "done") {
				// Here we do the desicion.
				switch (s.stage) {
					case "init":
						s.stage = "get_user_pins";
						break;
					case "get_user_pins":
						HARVEST_T3.get_user_pins(s, t);
						break;
					case "get_cal_ids":
						HARVEST_T3.get_cal_ids(s, t);
						s.stage = "get_cal_data";
						break;
					case "get_cal_data":
						HARVEST_T3.get_cal_data(s, t);
						s.stage = "get_user_pins";
						break;
					default:
						return "THIS IS NOT A VALID STAGE!";
				}
				if (s.stage == "get_cal_data") {
					if (!frst) {
						break
					} else {
						frst = false;
					}
				}
				STATE.store(s);
			}

			return s;
		}
	};

	return HARVEST_T3;
}
