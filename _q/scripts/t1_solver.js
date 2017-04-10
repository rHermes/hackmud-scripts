function(ctx, a)  { // t:#s.username.target
	// Valid locks:
	// - ez_21
	// - ez_35
	// - ez_40
	// - c001
	// - c002
	// - c003
	// - w4rn

	// THis is based around the idea that the locks will always appear on line based things:

	var c_ez = ["open","release","unlock"],
		c_primes = [2,3,5,7,11,13,17,19,21,23,29,31,37,41,43,47,53, 59,61,67,71,73,79,83,89,97],
		c_colors = ["red","purple","blue","cyan","green","lime","yellow","orange"],
		l_args = {},
		l_list = [],
		l_msg = "",
		l_name = "",
		l_lines = [],
		err_msg = "",
		success = false;
	
	// First time to kick it off.
	while(update()) {

		// Figure out which lock we are dealing with.
		l_name = err_msg.substring(err_msg.indexOf("`N")+2, err_msg.length-7);
		l_list.push(l_name);

		switch (l_name) {
			case "EZ_21":
				unlock_cmd();
				break;
			case "EZ_35":
				unlock_cmd();
				unlock_digit();
				break;
			case "EZ_40":
				unlock_cmd();
				unlock_prime();
				break;
			case "c001":
				unlock_c001();
				break;
			case "c002":
				unlock_c002();
				break;
			case "c003":
				unlock_c003();
				break;
			default:
				return l_name + " is not implemented!";
		}
	}

	function unlock_cmd() {
		for (var ez of c_ez) {
			l_args[l_name] = ez;
			update();
			
			if (!err_msg.endsWith("unlock command.")) {
				break;
			}
		}
	}

	function unlock_prime() {
		for (var pr of c_primes) {
			l_args["ez_prime"] = pr;
			update();
			
			if (!err_msg.endsWith("prime.")) {
				break;
			}
		}
	}

	function unlock_digit() {
		for (var i = 0; i < 10; i++) {
			l_args["digit"] = i;
			update();

			if(!err_msg.endsWith("digit.")) {
				break;
			}
		}
	}

	function unlock_c001() {
		for (var color of c_colors) {
			l_args["c001"] = color;
			l_args["color_digit"] = color.length;
			update();

			if(!err_msg.endsWith("name.")) {
				break;
			}
		}
	}

	function unlock_c002() {
		for (var i = 0; i < c_colors.length; i++) {
			l_args["c002"] = c_colors[i];
			l_args["c002_complement"] = c_colors[(i+4) % 8];
			update();

			if(!err_msg.endsWith("name.")) {
				break;
			}
		}
	}

	function unlock_c003() {
		for (var i = 0; i < c_colors.length; i++) {
			l_args["c003"] = c_colors[i];
			l_args["c003_triad_1"] = c_colors[(i+3)%8];
			l_args["c003_triad_2"] = c_colors[(i+5)%8];
			update();

			if(!err_msg.endsWith("name.")) {
				break;
			}
		}
	}



	function update() {
		l_msg = a.t.call(l_args);
		l_lines = l_msg.split("\n");

		// TODO(rhermes): This could be done shorter, but realizing that the error message is
		// always the last.

		var l_err_idx = l_lines.findIndex(e => e === "`VLOCK_ERROR`");
		if (l_err_idx === -1) { 
			err_msg = "";
			return false;
		}
		err_msg = l_lines[l_err_idx+1];
		
		return true;
	}
	/*
	// When we get a good one, we insert them into a cracked database:
	var t1_loc_idx = #db.f({_k: "t1_loc_idx"}, {new_locs: 0, breached_locs: 0}).first();
	if (!t1_loc_idx) {
		// We don't have the index, so we create it.
		#db.i({_k: "t1_loc_idx", _ts: Date.now(), new_locs: [], breached_locs: [a.t.name]});
	} else {
		// here we just update.
		#db.u({_id: t1_loc_idx._id}, {$addToSet: {breached_locs: a.t.name}, $pull: {new_locs: a.t.name}});
	}
	*/
	return { ok: true, msg: l_list, args: l_args };
}
