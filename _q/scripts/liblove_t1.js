function(ctx, a) {
	let _K = {
		ez_cmds: ["open", "release", "unlock"],
		ez_primes: [2,3,5,7,11,13,17,19,21,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97],
		c_colors: ["red","purple","blue","cyan","green","lime","yellow","orange"],

		get_EZ_CMD: (s,t) => {

		}
	};
/*
	get_EZ_CMD: (t,lock_name) => {
			for (var cmd of _S.ez_cmds) {
				_S.args[lock_name] = cmd;
				_S.call_loc(t);


				// Check if we are done.
				if (_S.is_done() || !_S.lm.endsWith("unlock command."))
					break;
			}
		},

		// --- Tier 1 ---
		solve_EZ_21: t => {
			_S.get_EZ_CMD(t, "EZ_21");
		},

		solve_EZ_35: t => {
			// We add digit here, as it may save us 1 call.
			_S.args["digit"] = 0;
			_S.get_EZ_CMD(t, "EZ_35");

			// Just check if we are done.
			while (!_S.is_done() && _S.lm.endsWith("not the correct digit.")) {
				_S.args["digit"] += 1;
				_S.call_loc(t);
			}
		},

		solve_EZ_40: t => {
			// We add digit here, as it may save us 1 call.
			var idx = 0;	
			_S.args["ez_prime"] = _S.ez_primes[idx];
			_S.get_EZ_CMD(t, "EZ_40");

			// Just check if we are done.
			while (!_S.is_done() && _S.lm.endsWith("not the correct prime.")) {
				idx++;
				_S.args["ez_prime"] = _S.ez_primes[idx];
				_S.call_loc(t);
			}
		},

		solve_c001: t => {
			for (var color of _S.c_colors) {
				_S.args["c001"] = color;
				_S.args["color_digit"] = color.length;
				_S.call_loc(t);

				if (_S.is_done() || !_S.lm.endsWith("name."))
					break;
			}
		},

		solve_c002: t => {
			for (var i = 0; i < _S.c_colors.length; i++) {
				_S.args["c002"] = _S.c_colors[i];
				_S.args["c002_complement"] = _S.c_colors[(i+4) % 8];
				_S.call_loc(t);

				if (_S.is_done() || !_S.lm.endsWith("name."))
					break;
			}
		},

		solve_c003: t => {
			for (var i = 0; i < _S.c_colors.length; i++) {
				_S.args["c003"] = _S.c_colors[i];
				_S.args["c003_triad_1"] = _S.c_colors[(i+3)%8];
				_S.args["c003_triad_2"] = _S.c_colors[(i+5)%8];
				_S.call_loc(t);

				if (_S.is_done() || !_S.lm.endsWith("name."))
					break;
			}			
		},
	return { ok:false };
	*/
	return _K;
}
