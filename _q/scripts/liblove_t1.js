function(ctx, a) {
	// Include libraries.
	const STATE = #s._q.liblove_state();

	let T1 = {
		ez_cmds: ["open", "release", "unlock"],
		ez_primes: [2,3,5,7,11,13,17,19,21,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97],
		c_colors: ["red","purple","blue","cyan","green","lime","yellow","orange"],
		l_keys_v1: ["vc2c7q","uphlaw", "cmppiq", "tvfkyq","6hh8xw"],
		l_keys_v2: ["4jitu5","hc3b69","5c7e1r","nfijix","vthf6e","lq09tg"],
		l_keys_v3: ["7oxb1b","54r1cg","afgny5"],

		get_EZ_CMD: (s,l,t) => {
			// Check if we are done with this:
			if (l.ctx.cmd_done) return;

			l.ctx.cmd_i = l.ctx.cmd_i || 0;

			while (l.ctx.cmd_i < T1.ez_cmds.length) {
				l.args[l.name] = T1.ez_cmds[l.ctx.cmd_i];
				STATE.call_loc(s, t);

				if (!STATE.lm(s).endsWith("unlock command.")) break;
				l.ctx.cmd_i++;
			}
			l.ctx.cmd_done = true;
		},

		solve_EZ_21: (s,l,t) => {
			T1.get_EZ_CMD(s,l,t);
		},

		solve_EZ_35: (s,l,t) => {
			l.args["digit"] = l.args["digit"] || 0;
			T1.get_EZ_CMD(s,l,t);

			while (STATE.lm(s).endsWith("not the correct digit.")) {
				l.args["digit"] += 1;
				STATE.call_loc(s, t);
			}
		},

		solve_EZ_40: (s,l,t) => {
			l.ctx.prime_i = l.ctx.prime_i || 0;
			l.args["ez_prime"] = T1.ez_primes[l.ctx.prime_i];
			T1.get_EZ_CMD(s,l,t);

			while (STATE.lm(s).endsWith("not the correct prime.")) {
				l.ctx.prime_i++;
				l.args["ez_prime"] = T1.ez_primes[l.ctx.prime_i];

				STATE.call_loc(s, t);
			}

		},

		solve_c001: (s,l,t) => {
			// Make sure variables are initialized:
			l.ctx.i = l.ctx.i || 0;

			while (l.ctx.i < T1.c_colors.length) {
				l.args["c001"] = T1.c_colors[l.ctx.i];
				l.args["color_digit"] = l.args["c001"].length;
				STATE.call_loc(s, t);
				
				if (!STATE.lm(s).endsWith("name.")) break;

				l.ctx.i++;
			}
		},

		solve_c002: (s,l,t) => {
			// Make sure variables are initialized:
			l.ctx.i = l.ctx.i || 0;

			while (l.ctx.i < T1.c_colors.length) {
				l.args["c002"] = T1.c_colors[l.ctx.i];
				l.args["c002_complement"] = T1.c_colors[(l.ctx.i+4) % 8];

				STATE.call_loc(s, t);

				if (!STATE.lm(s).endsWith("name.")) break;

				l.ctx.i++;
			}
		},

		solve_c003: (s,l,t) => {
			// Make sure variables are initialized:
			l.ctx.i = l.ctx.i || 0;

			while (l.ctx.i < T1.c_colors.length) {
				l.args["c003"] = T1.c_colors[l.ctx.i];
				l.args["c003_triad_1"] = T1.c_colors[(l.ctx.i+3) % 8];
				l.args["c003_triad_2"] = T1.c_colors[(l.ctx.i+5) % 8];

				STATE.call_loc(s, t);

				if (!STATE.lm(s).endsWith("name.")) break;

				l.ctx.i++;
			}
		},

		solve_l0cket: (s,l,t) => {
			l.ctx.i = l.ctx.i || 0;
			let kys = [].concat(T1.l_keys_v1, T1.l_keys_v2, T1.l_keys_v3);
			while (l.ctx.i < kys.length) {
				l.args["l0cket"] = kys[l.ctx.i];
				STATE.call_loc(s, t);
				if(!STATE.lm(s).endsWith("k3y.")) {
					return;
				}

				l.ctx.i++;
			}
			STATE.store(s);
			throw new Error("DIDN't SOLVE l0cket!");
		}
	};

	return T1;
}
