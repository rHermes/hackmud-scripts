function(ctx, a) {
	let T2 = {
		solve_CON_SPEC: t => {
					_S.args["CON_SPEC"] = "";
					_S.call_loc(t);

						// First we need to define the alphabeth.
					const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
					let places = _S.lm.split('\n')[0].split('').map(u => abc.indexOf(u));
					const dx = [places[1] - places[0], places[2] - places[1]];

					let di = 0;
					let k = places[0];
					let ans = "";

					for (let i = 0; i < places.length+2; i++) {
						k += dx[di];
						di = 1 - di;
						ans += abc[k];
					}

					// Now we set the arg
					_S.args["CON_SPEC"] = ans.slice(-3);
					_S.call_loc(t);

					if (!_S.lm.startsWith("`NLOCK_UNLOCKED`")) {
						throw new Error("The answer we gave was wrong!");
					}
		},
	};

	return T2;
}
