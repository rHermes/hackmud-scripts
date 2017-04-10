function(ctx, a) { // t: #s.target.corp, action: ""
	// This scripts harvests t1 npc locs. These can then be cracked with can a
	// T1 cracker.

	// If it called without any arguments it returns a random corp address
	// that we have not yet scanned.

	// TODO(rhermes): match on people names, 6th regex, people.

	// TODO(rhermes): add giant_spider and friends word_eater is antoher

	// TODO(rhermes): t1 corp listings changes <nil> and <ERROR> when they are run.
	// This makes decoruppt unreliable. Need to fix this.


	// Does it want us to return a corp?
	if (!a.t) {
		return "Not implement corp yet!";
	}

	var outs = [];


	// This is taken from #s.scripts.lib().corruption_chars
	//
	const corrupt_chars = ['¡','¢','£','¤','¥','¦','§','¨','©','ª'];
	const corrupt_chars_set = new Set(corrupt_chars);
	const corrupt_chars_re = /[¡¢£¤¥¦§¨©ª]/g;
	const re_loc_addr = /^[a-zA-Z_][a-zA-Z_0-9]*\.[a-zA-Z_][a-zA-Z_0-9]*$/;

	// Time this and watch how long this takes!
	// F is a function which takes no parameters
	function decorrupt(f) {
		// Account if the output is an array.
		if (false) {
			return "Not implemented."
		}

		// This is our starting version.
		var cur_msg = f().replace(re_color_strip, "$1");

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

		//outs.push(cur_msg.join());
		
		return cur_msg.join('');
	}

	// TODO(rhermes): Implement retries for when corruption hits the parts we want.
	const re_color_strip = /`[a-zA-Z]([^`]*?)`/g;

	// we need to make sure there is no curruption there
	// var only_ascii = /^[\x00-\x7F]+/;

	// TODO(rhermes): Refine this.
	var only_ascii = /^[a-zA-Z0-9_\-#,\/\|.,\(\) ]*$/;
	
	//var re_key_pairs = /([a-z_]+):("([a-zA-Z0-9]+?)"|[0-9]+)/;

	// Maybe all npc just have small letters.
	// var re_key_pairs = /([a-z_]+):"([a-zA-Z0-9]+?)"/;

	// This might be most restrictive one. The reason for it is that we only
	// want it to match very speific thigns. Note the space before the first
	// group.
	var re_key_pairs = / ([a-z_]+):"([a-z]+?)"/;


	var f_scrape_corp_info = function(tr) {
		// === GET THE CMD AND GOAL ===
		var out_msg = decorrupt(() => tr.call({}));


		var kv = out_msg.match(re_key_pairs);
		if (!kv || kv.length != 3) {
			return {ok: false, msg: "We had problems with:\n" + out_msg};
		}


		// Now we have the overall cmd and goal command.
		var cmd = kv[1];
		var goal = kv[2];

		outs.push("MAIN CMD: " + cmd + "\nBREACH CMD: " + goal + "\n");

		// === GET THE PROJECT AND PASSWORD CMDS ===

		// Now what we need to find is the projects and password site cmds.
		var l_args = {};
		l_args[cmd] = "";

		out_msg = decorrupt(() => tr.call(l_args));

		// The commands are on the last line and they are separated by ||.
		// So we isolate the last line.
		var out_lines = out_msg.split('\n');
		var last_line = out_lines[out_lines.length-1];

		// This doesn't work when there are multiple spaces and such. Find 
		// a robust regex or something else to do this more robustly.
		var raw_cmds = last_line.split(' ');
		if (raw_cmds.length != 5) {
			return {ok: false, msg: "Didn't follow expected format:\n", last_line};
		}

		var projects_cmd = raw_cmds[0];
		var password_cmd = raw_cmds[2];
		
		outs.push("PROJECTS CMD: " + projects_cmd + "\nPASSWORD CMD: " + password_cmd + "\n");
		//outs.push(last_line.split('').join('\u200B'));


		// === GET THE PASSWORD ===
		l_args[cmd] = password_cmd;
		out_msg = decorrupt(() => tr.call(l_args));
		//var pass_prefix1 = /We are calling this strategy ([a-zA-z_0-9]+)/;
		var pass_prefix1 = / this strategy ([a-zA-Z_0-9]+) /;

		var passw_reg = out_msg.match(pass_prefix1);
		if(!passw_reg) {
			return {ok: false, msg: "Couln't find paswrod in msg.", out_msg, outs};
		}

		var passwd = passw_reg[1];
		outs.push("PASSWORD: " + passwd + "\n");


		// === GET THE PROJECTS ===

		// THis one is going to be hard. We will do an incremental approach here
		// and discover more and more prefixes for passwords.

		// Here goes the list of regexes. These can later be stored in the mongodb,
		// that way I can update them as I go.

		l_args[cmd] = projects_cmd;

		var starttime = Date.now();
		var kekm = decorrupt(() => tr.call(l_args).join('\n'));
		var endtime = Date.now();

		//outs.push(kekm);
		outs.push("Decorrupt project listings: " + (endtime-starttime) + "ms\n");
		//return outs;

		starttime = Date.now();

		var proj_regexes = [];
		proj_regexes.push(/ of project ([a-z0-9_\-#,\/|.,\(\)]+?) /ig);
		proj_regexes.push(/ release date for ([a-z0-9_\-#,\/|.,\(\)]+?)\./ig);
		proj_regexes.push(/Work continues on ([a-z0-9_\-#,\/|.,\(\)]+?),/ig);
		proj_regexes.push(/ new developments on ([a-z0-9_\-#,\/|.,\(\)]+?) /ig);
		proj_regexes.push(/ Look for ([a-z0-9_\-#,\/|.,\(\)]+?) /ig);
		proj_regexes.push(/ for the new ([a-z0-9_\-#,\/|.,\(\)]+?) /ig);
		proj_regexes.push(/ initial launch of the ([a-z0-9_\-#,\/|.,\(\)]+?) /ig);



		var projects = new Set();

		// Get projects.
		for (var reg of proj_regexes) {
			outs.push("\n");
			var tmp_m;
			var tmp_k = 0;
			while ((tmp_m = reg.exec(kekm)) !== null) {
				tmp_k++;
				projects.add(tmp_m[1]);
				outs.push(tmp_m[1]);
			}

			if (tmp_k === 0) {
				outs.push("We got no matches on: " + reg.source);
			}
		}
		
		endtime = Date.now();
		outs.push("Regex match on projects: " + (endtime-starttime) + "ms\n");

		starttime = Date.now();
		// User names
		var usernames = new Set();

		// username regexes
		const user_regexes = [];
		user_regexes.push(/([a-z0-9_\-#,\/|.,\(\)]+?) of project /ig);
		user_regexes.push(/'.*?' -- ([a-z0-9_\-#,\/|.,\(\)]+?) when being /ig);

		// Get users.
		for (var reg of user_regexes) {
			outs.push("\n");
			var tmp_m;
			var tmp_k = 0;
			while ((tmp_m = reg.exec(kekm)) !== null) {
				tmp_k++;
				usernames.add(tmp_m[1]);
				outs.push(tmp_m[1]);
			}

			if (tmp_k === 0) {
				outs.push("We got no matches on: " + reg.source);
			}
		}

		endtime = Date.now();
		outs.push("Regex match on usernames: " + (endtime-starttime) + "ms\n");


		

		// Now then we are going to find what the password key name is.
		l_args[cmd] = goal;
		
		// TODO(rhermes): Can exploit the fact that if the 2 first don't yield
		// anything then it must be the last. This is an optimization.
		var ke_pass;
		for (var passk of ["p","pass","password"]) {
			l_args[passk] = passwd;
			// THis is the one place I don't have to worry about corruption.
			out_msg = tr.call(l_args);
			if (out_msg !== "No password specified.") {
				ke_pass = passk;
				break;
			}
		}

		// Now we store this into the DB.
		var m_corp = {
			_k: "t1_corp",
			_ts: Date.now(),
			name: tr.name.split('.')[0],
			k_action: cmd,
			v_action: goal,
			k_pass: ke_pass,
			v_pass: passwd,
			new_projects: Array.from(projects),
			old_projects: [],
			usernames: Array.from(usernames),
		};

		//outs.push(m_corp);

		var in_db_q = #db.f({_k: m_corp._k, name: m_corp.name}).first();
		if (in_db_q) {
			// THis might be prone to race conditions?
			#db.u1({_k: m_corp._k, name: m_corp.name}, m_corp);
			outs.push("Updated the corps info in the db!");
		} else {
			#db.i(m_corp);
			outs.push("Added corp to the db!");
		}
		
		
	}

	var f_scrape_npc_info = function(tr) {
		// We now have it all! Time to get cracking.
		
		// First we need to get the object out of mongodb.
		var m_corp = #db.f({_k: "t1_corp", name: tr.name.split('.')[0]}).first();
		if (!m_corp) {
			return "Corp is not in the db!";
		}

		outs.push(m_corp);

		var npc_locs = new Set();
		var used_projects = new Set();

		// Probabily need some kind of filtering at this, certainly need decorruption.

		var l_args = {};
		l_args[m_corp.k_action] = m_corp.v_action;
		l_args[m_corp.k_pass] = m_corp.v_pass;

		var limit = 0;
		var out_msg;
		for (var project of m_corp.new_projects) {
			l_args["project"] = project;

			out_msg = decorrupt(() => [].concat(tr.call(l_args)).join('\n'));
			for (var npc_loc of out_msg.split('\n')) {
				if (re_loc_addr.test(npc_loc)) {
					npc_locs.add(npc_loc);
				}	
			}

			used_projects.add(project);

			limit++;
			if (limit > 15) {
				break;
			}

		}

		// Insert the npc locs.
		var t1_loc_idx = #db.f({_k: "t1_loc_idx"}, {new_locs: 0}).first();
		if (!t1_loc_idx) {
			// We don't have the index, so we create it.
			#db.i({_k: "t1_loc_idx", _ts: Date.now(), new_locs: Array.from(npc_locs), breached_locs: []});
		} else {
			// Remove all the already breached locs from the new_locs
			for (var bl of t1_loc_idx.breached_locs) {
				npc_locs.delete(bl);
			}
			// We update the t1_loc_idx, but then we need 
			#db.u({_id: t1_loc_idx._id}, {$addToSet: {new_locs: {$each: Array.from(npc_locs)}}});
		}

		// Update the m_corp.
		#db.u({_id: m_corp._id}, {$addToSet: {old_projects: {$each: Array.from(used_projects)}}, $pullAll: {new_projects: Array.from(used_projects)}});

		outs.push("Entries in npc_locs: " + npc_locs.size);
	}

	var f_get_loc_cmds = function() {
		var t1_loc_idx = #db.f({_k: "t1_loc_idx"}, {breached_locs: 0}).first();
		if (!t1_loc_idx) {
			return "ERROR: No T1 npc locs is present in the db.";
		}
		// we don't do any filtering here.
		var buff = "";

		var limit = 0;
		for (var loc of t1_loc_idx.new_locs) {
			buff += "t1_solver {t: #s." + loc + " }\n";
			
			limit++;
			if (limit > 499) {
				break;
			}
		}
		buff = "Gave you " + limit + " of " + t1_loc_idx.new_locs.length + " locations.\n" + buff;
		return buff;
	}
	
	// Prune the db.
	var f_prune_locs = function() {
			var t1_loc_idx = #db.f({_k: "t1_loc_idx"}, {breached_locs: 0}).first();
			if (!t1_loc_idx) {
				return "ERROR: No T1 npc locs is present in the db.";
			}
			// we don't do any filtering here.
			var buff = "";

			var dead_locs = new Set();
			var limit = 0;
			for (var loc of t1_loc_idx.new_locs) {
				var level_msg = #s.scripts.get_level({name: loc});
				if (level_msg.hasOwnProperty("ok") && !level_msg.ok) {
					
					dead_locs.add(loc);
				}

				limit++;
				if (limit > 200) {
					break;
				}
			}

			#db.u({_id: t1_loc_idx._id}, {$pullAll: {new_locs: Array.from(dead_locs)}});
		
		buff += "THere was " + dead_locs.size + " dead locs";
		// buff = "Gave you " + limit + " of " + t1_loc_idx.new_locs.length + " locations.\n" + buff;
		return buff;
	}

	var f_get_corp_cmds = function() {
		var corps = #s.dtr.ls({ npcs:true, nosnipe:true, porcelain: true });
		var buff = "";
		for (var corp of corps.t1) {
			buff += 't1_harvest {t: #s.' + corp + ', action: "scrape_corp"}\n';
			buff += 't1_harvest {t: #s.' + corp + ', action: "scrape_npcs"}\n';
		}
		return buff;
	}
	


		// Actually runnning the function.	
	switch (a.action) {
		case "scrape_corp":
			var kk = f_scrape_corp_info(a.t);
			if (kk) {
				return kk;
			}
			break;
		case "scrape_npcs":
			var kk = f_scrape_npc_info(a.t);
			if (kk) {
				return kk;
			}
			break;
		case "get_corp_cmds":
			var kk = f_get_corp_cmds();
			if (kk) {
				return kk;
			}
			break;
		case "get_loc_cmds":
			var kk = f_get_loc_cmds();
			if (kk) {
				return kk;
			}
			break;
		case "prune_locs":
			var kk = f_prune_locs();
			if (kk) {
				return kk;
			}

			break;
		default:
			return "Don't know the command given: " + a.action;
	}

	// Regex 101 to remove color from shell.txt: (<color=(.*?)>|<\/color>)




	return outs;
}