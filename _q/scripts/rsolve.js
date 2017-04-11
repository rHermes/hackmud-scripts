function(ctx, a) {

	let state = #db.f({_id: "__rsolve_state"}).first();
	state.tested = state.tested || 0;
	state.started = state.started || Date.now();


	// Solve the rokaru.tx fun
	let output = [];
	const sample = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

	const npos = sample.length*sample.length*sample.length;

	output.push("There are " +  + " possibilties.");


	const wrong_msg = "`VLOCK_ERROR`\n`DThat is not the correct three char value.`\n"

	while (1) {
		if (state.k >= sample.length) {
			state.j++;
			state.k = 0;
		}

		if (state.j >= sample.length) {
			state.i++;
			state.j = 0;
		}

		if (state.i >= sample.length) {
			break;
		}

		let comb = sample[state.i] + sample[state.j] + sample[state.k];
		let ot = #s.rokaru.tx({qq_dec: comb});
		state.tested++;
		if (ot != wrong_msg) {
			#db.u1({_id: state._id}, state);
			return "Something else happend when we tried: " + comb;
		} else {
			output.push("The comb " + comb + " was wrong!");
			if (output.length > 35) {
				

				// lets see time spent.
				let ts_spent = Date.now() - state.started;
				let s_spent = 0.001*ts_spent;
				let comb_per_s = state.tested/s_spent;
				let out = [];
				out.push("We have tested " + state.tested + " of " + npos + " (" + (state.tested/npos)*100 + "%)");
				out.push("We are solving at " + comb_per_s + " and the ETA til exausted keyspace is: " + ((npos-state.tested)/comb_per_s)/60);

				//state.started = Date.now();
				#db.u1({_id: state._id}, state);
				return out;
			}
		}
		state.k++;
	}

	//return l4.split('').join('\u200B') ;
	// return JSON.stringify([l4, logg]);
	return output;
}
