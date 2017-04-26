function(ctx, a)
{
	let outs = [];

	const generation = 1;

	const state_create = (t) => {
		return {
			_id: "_sdd_gen_" + generation + "_" + t.name,
			_type: "_sdd_gen_" + generation,
			username: "d4ft",
			pin: "5231",
			cmd_main: "perform",
			opt_cal: "flow",
			ctx: {}
		};
	}

			// Store the state in the database. This will overwrite anything already
		// stored in the db.
	const state_store = (s) => {
			let sn = #db.u1({_id: s._id}, s)[0];
			// If we don't get anything back, then we must insert.
			if (!sn.n) { 
				sn = #db.i(s);
			}
			return sn;
	};

		// Loads the state from the database, given the location name
	const state_load = (t) => {
			return #db.f({_id: "_sdd_gen_" + generation + "_" + t.name}).first();
	};

		// This either creates and inserts or loads from db. If the record
		// is invalid, then we recreate it.
	const state_create_or_load = (t) => {
			let s = state_load(t);
			if (s === null) {
				s = state_create(t);
				state_store(s);
			}
			return s;
	};

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

				days.push({
					day: day,
					ids: ids,
					x: j,
					y: i
				});
			}
		}
		return {
			head: head,
			year: year,	
			days: days
		};
	};

	const perform_sweep = (s, t) => {
		s.ctx.d = s.ctx.d || -60;
		
	};



	let s = state_create_or_load(a.t);


	

	let rawout = #s.archaic.intern(args);
	const color_re = /`[a-zA-Z](.*?)`/g;
	let cleanout = rawout.replace(color_re, "$1");
	outs.push(cleanout);
	outs.push(parse_cal(cleanout));

	return outs;
}
