function(ctx, a) {
	// First we do is parameter checks.
	if (a.t === undefined || a.action === undefined) {
		return "We need a target and an action, ma'am!";
	}

	// Import libs
	const _QR = #s._q.qrv2();

	// Utility function, since I use the same code multiple places.
	var timeF = f => {
		var starttime = Date.now();
		var ret = f();
		return [ret, Date.now()-starttime];
	}




	// good old decoorupt.
	const re_color_strip = /`[a-zA-Z]([^`]*?)`/g;
	const corrupt_chars = ['¡','¢','£','¤','¥','¦','§','¨','©','ª'];
	const corrupt_chars_set = new Set(corrupt_chars);
	const corrupt_chars_re = /[¡¢£¤¥¦§¨©ª]/g;
	const re_loc_addr = /^[a-zA-Z_][a-zA-Z_0-9]*\.[a-zA-Z_][a-zA-Z_0-9]*$/;

	var decorrupt = function(f, cur_msg=null) {
		// This is our starting version.
		// If cur_msg wasn't passed in, we have to get it.
		if (cur_msg === null) {
			cur_msg = f();
		}

		// get rid of the colors.
		cur_msg = cur_msg.replace(re_color_strip, "$1");

		// Build index of corrupted chars.
		var corrupt_idxs = new Set();
		var tmp_res;
		while ((tmp_res = corrupt_chars_re.exec(cur_msg)) !== null) {
			corrupt_idxs.add(tmp_res.index);
		}
		
		// This is to make it into an array so that 
		cur_msg = cur_msg.split('');
		
		// Now we call the difference.
		while (corrupt_idxs.size) {
			var new_msg = f().replace(re_color_strip, "$1");

			var cleaned_idx = new Set();
			for (var idx of corrupt_idxs) {
				if (!corrupt_chars_set.has(new_msg[idx])) {
					cleaned_idx.add(idx);
					cur_msg[idx] = new_msg[idx];
				}
			}

			for (var idx of cleaned_idx) {
				corrupt_idxs.delete(idx);
			}
		}
		
		return cur_msg.join('');
	}


	var scrape_t2_corp = (t) => {
		const corp_name = t.name.split('.')[0];

		// First we need to find out if it's in our db.
		var rets = #db.f({_k: "t1_corp", name: corp_name}, {usernames: 1}).first();

		if (!rets) {
			return "Did not find this corp in the T1 db.";
		}

		// Make sure we have more than 1 username, before we continue.
		if (rets.usernames.length === 0) {
			return "Couldn't find any usernames for this corp."
		}

		
		var ll = Date.now();
		var outs = [];

		// We only need to figure out the CMD once and after that we can reduce the
		// number of calls to seans code by just calling straing to the QR codes.
		
		// A smart trick is to check if there is more than 2 "\n" in the output.
		// The end of lines are never corrupted, as far as I know.

		var t2_locs = new Set();
		var script_args = {};
		var working_usernames = new Set();
		var k_cmd = null;
		for (var username of rets.usernames) {
			// Set the username for this 
			script_args["username"] = username;
			var output = t.call(script_args);

			// Just a quick check here to check that we aren't calling an invalid
			// address.
			if (output.ok !== undefined && !output.ok) {
				return output.msg;
			}

			// We now check if the username is valid or not. We also need to check to see
			// if the output is an array, as that is what the correct output from orders_qrs
			// is going to be.
			if (!Array.isArray(output) && output.split('\n').length -1 < 3) {
				continue;
			}
			working_usernames.add(username);

			// Now we get the cmd.
			if (k_cmd === null) {
				k_cmd = decorrupt(() => t.call(script_args).split('\n')[2], output.split('\n')[2]);
				script_args[k_cmd] = "order_qrs";
				
				// Since this will be the first user who is valid, we have to call once more.
				output = t.call(script_args);
			}

			// From here on we have the output and we have command, eazy pz.
			// outs.push("USER: " + username);
			var order_ids = [];

			for (var raw_qr of output) {
				// Cut out anything that is short.
				if (raw_qr.length < 20) {
					continue;
				}

				var qra = _QR.str_to_arr(raw_qr.split('\n').filter(u => u).join('\n'));
				var payloads = _QR.get_data(qra);
				for (var payload of payloads) {
					var idm = payload.match(/"id":"([0-9a-z]+?)"/);
					if (idm !== null) {
						order_ids.push(idm[1]);
					}
				}
			}

			// Now we have all order ids. we now only need to locs.

			// TODO(rhermes): Figure out a smart way to isolate the part I want to
			// de corrupt.
			
			script_args[k_cmd] = "cust_service";
			for (var order_id of order_ids) {
				script_args["order_id"] = order_id;
				var clean_msg = decorrupt(() =>  t.call(script_args));
				var locs = clean_msg.match(/[_a-z0-9]+\.[_a-z0-9]+/g);
				if (locs !== null) {
					t2_locs.add(...locs);
				}
			}
			script_args[k_cmd] = "order_qrs";
		}
		var kk = Date.now();


		// Insert the npc locs.
		var t2_loc_idx = #db.f({_k: "t2_loc_idx"}, {new_locs: 0}).first();
		if (!t2_loc_idx) {
			// We don't have the index, so we create it.
			#db.i({_k: "t2_loc_idx", _ts: Date.now(), new_locs: Array.from(t2_locs), breached_locs: []});
		} else {
			// Remove all the already breached locs from the new_locs
			for (var bl of t2_loc_idx.breached_locs) {
				t2_locs.delete(bl);
			}
			// We update the t1_loc_idx, but then we need 
			#db.u({_id: t2_loc_idx._id}, {$addToSet: {new_locs: {$each: Array.from(t2_locs)}}});
		}

		return "Added " + t2_locs.size + " T2 locs to db.";
	}

	var get_corp_cmds = function() {
		var corps = #s.dtr.ls({ npcs:true, nosnipe:true, porcelain: true });
		var buff = "";
		for (var corp of corps.t2) {
			// shine through other list to find matching t1_corp.
			var t1_corp = corps.t1.find(u => corp.split('.')[0] == u.split('.')[0]);
			if (t1_corp === undefined) {
				return "Couldn't really find any match anything!";
			}
			buff += 't1_harvest {t: #s.' + t1_corp + ', action: "scrape_corp"}\n';
			buff += 't2_harvest {t: #s.' + corp + ', action: "scrape_corp"}\n';
		}
		return buff;
	}
	
	
	
	// Prune the db.
	var prune_locs = function() {
			var t2_loc_idx = #db.f({_k: "t2_loc_idx"}, {breached_locs: 0}).first();
			if (!t2_loc_idx) {
				return "ERROR: No T2 npc locs is present in the db.";
			}
			// we don't do any filtering here.
			var buff = "";

			var dead_locs = new Set();
			var limit = 0;
			for (var loc of t2_loc_idx.new_locs) {
				var level_msg = #s.scripts.get_level({name: loc});
				if (level_msg.hasOwnProperty("ok") && !level_msg.ok) {
					dead_locs.add(loc);
				}

				limit++;
				if (limit > 200) {
					break;
				}
			}

			#db.u({_id: t2_loc_idx._id}, {$pullAll: {new_locs: Array.from(dead_locs)}});
		
		buff += "THere was " + dead_locs.size + " dead locs";
		return buff;
	}

	var output_msg = "";
	switch (a.action) {
		case "scrape_corp":
			output_msg = scrape_t2_corp(a.t);
			break;
		
		case "get_corp_cmds":
			output_msg = get_corp_cmds();
			break;
		
		case "prune_locs":
			output_msg = prune_locs();
			break;
	}
	return output_msg; 
}
