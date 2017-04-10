function(ctx, a) {
	// This is going to be my solver. Unlinke many other, it's going to be
	// modular. If called from a script it returns a solver object. We are
	// going to need the users transactions and such though.

	// INFO:
	// about 99% of the time spent in this application is going to be spent
	// calling the loc with these locks. Reducing the number of calls is
	// therfor paramount. That means that almost any kind of reduction in
	// number of calls to the loc will be worth the overhead in the script.

	// IDEA(rhermes): I could call the lock with all the parameters known
	// to me, and from that know which lock it was. This would bring down
	// the amount of calls by X-1, where X is the amount of locs. The back
	// side to this though, is that locks like sn_w_glock would trigger right
	// away.

	// IDEA(rhermes): Write to the db, everytime we finish a lock, that way,
	// we could resume by running the same command again, and it would go
	// straight to the lock we needed. To make that clear, we would remember
	// args between runs.

	// TODO(rhermes): integrate support for parameters and db in the rest 
	// of the locks.

	// TODO(rhermes): Currently, with the current db system, we don't
	// get to 

	// TODO(rhermes): Create a state system.

	// TODO(rhermes): Improvement for the acct_nt: filter out uneccecarry
	// transactions. So if it's transactions earned, then remove all who
	// don't have recipient and so forth. This will allow me to
	// filter through them faster.

	const tot_script_start = Date.now();

	var _S = {
		// === CONSTS ===
		ez_cmds: ["open", "release", "unlock"],
		ez_primes: [2,3,5,7,11,13,17,19,21,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97],
		c_colors: ["red","purple","blue","cyan","green","lime","yellow","orange"],
		mag_words: ["sublime", "inge", "null", "rico", "tail", "mugged"],
		sn_w_glock_amounts: {
			"That balance was not secret.": "7GC",
			"Well that wasn't a special balance.": "38GC",
			"Not an elite balance at all.": "1K337GC",
			"Not a hunter's balance indeed.": "3K6GC",
			"Not a monolithic balance.": "2K1GC",
			"That balance would not be chosen by a magician.": "1K89GC",
			"That's not a balance of the beast.": "666GC",
			"That balance has no meaning.": "42GC",
			"Seems like your balance could be more secure.": "443GC",
		},


		// === STATE ===
		lm: "",
		msgs: [],
		args: {},
		locks: [],

		// Time keeping.
		ts_start: Date.now(),
		ts_end: Date.now(),
		ts_calls: [],
		ts_locks: [],

		// DB stuff
		db_id: null,
		
		call_loc: (t) => {
			// if it looks like the script is going to spend to long in this call we abort.
			if (Date.now() - tot_script_start > 4500) {
				throw new Error("We were in danger of running over our alloted time!");
			}

			var ts_s = Date.now();
			_S.lm = t.call(_S.args);
			var ts_e = Date.now();

			_S.msgs.push(_S.lm);
			_S.ts_calls.push(ts_e-ts_s);
		},

		// === LOCKS ===
		// generalizations:
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

		// --- Tier 2 ---
		solve_magnara: t => {
			_S.args["magnara"] = "";
			_S.call_loc(t);

			const sorted_words = _S.mag_words.map(u => u.split('').sort().join(''));
			
			// we get the word by splitting on ": " and taking the last element
			let raw_word = _S.lm.split(": ")[1];
			let sorted_word = raw_word.split('').sort().join('');
			
			let possible_words = [];
			for (let i = 0; i < sorted_words.length; i++) {
				if (sorted_word == sorted_words[i]) {
					possible_words.push(_S.mag_words[i]);
				}
			}

			// Now we just loop through the possible answers, til we get the correct one.
			for (let pw of possible_words) {
				_S.args["magnara"] = pw;
				_S.call_loc(t);
				if (_S.lm.split('\n').length > 1) {
					return;
				}
			}
			throw new Error("couldn't find suitable candidate for word: " + raw_word);
		},

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

		solve_acct_nt: t => {
			// TODO(rhermes): Make n00bish eat dirt here. I'll beat him at his own game :D

			// TODO(rhermes): Implement binary search or something for this, will make
			// the inital lookup faster?

			// Utility functions, we are goign to need in for the date stuff.
			const ing2ts = (u) => new Date("20" + u.slice(0,2), parseInt(u.slice(2,4))-1, parseInt(u.slice(4,6)),  parseInt(u.slice(7,9)),  parseInt(u.slice(9,11)));
			const round_off = (u) => new Date(u.getFullYear(), u.getMonth(), u.getDate(), u.getHours(), u.getMinutes());
			const cmp_dates = (a,b) => a.getTime() === b.getTime();

			// This returns all the possible answers for a given question, applying fx to all of them.
			// the start and end is expected to be Date objects. FX is applied to each element, and sx
			// is the function that sums them together. SX take the whole array as an argument.
			const range_question = (start,end,fx,sx) => {
				// For now we get all of the transactions. Later, we will keep some of
				// them in the DB, which would be faster.
				let txns = #s.accts.transactions({count: "all"});

				// This is the amount before and after the first one, that we also add to the mix.
				let buffer = 16;

				// These will be used in the range calculations.

				// WE record the position of the last same start
				// and the first end. it's worth noting that this is in reverse,
				// as we are moving backwards in time. There is no need to record
				// the other part of  the bound as it will be start_idx and end_idx
				// respectivly.
				let same_start_lst = -1;
				let same_end_fst = -1;

				let start_idx = -1;
				let end_idx = -1;

				for (let i = 0; i < txns.length; i++) {
					let txn = txns[i];
					let rots = round_off(txn.time);
					
					// we are before the start of the end.
					if (end < rots) {
						continue;
					}
					// This is the first time we are withing the range, so we mark it.
					if (end_idx < 0) {
						end_idx = i;
					}

					if (rots < start) {
						break;
					}

					// Now that we know that we are in the range, lets set start:
					start_idx = i;

					if (same_start_lst < 0 && cmp_dates(rots, start)) {
						same_start_lst = i;
					}

					if (cmp_dates(rots, end)) {
						same_end_fst = i;
					}

				}

				let rel_txns = [];

				// Now that we have the ranges, we can get the rel_txns.

				// the layout will look like this:
				// end_idx ... (same_end_fst) ... (same_start_lst) ... start_idx;
				// we then use offsett to get the ranges which we must search.

				// Now that we have it all, we need to generate all the possible solutions.
				// There will be (same_start+1)*(same_end+1) possible solutions.
				let pos_ranges = [];

				// These two are the out extremes.
				let range_start_end = Math.min(txns.length, start_idx + buffer);
				let range_end_start = Math.max(0, end_idx-buffer);



				let range_end_end = end_idx + buffer;
				// if we have same_end_fst
				if (same_end_fst > -1) {
					range_end_end = same_end_fst + buffer;
				}

				let range_start_start =  start_idx-buffer;
				if (same_start_lst > -1) {
					range_start_start = same_start_lst-buffer;
				}

				if (range_start_start < range_end_end) {
					// we could just use Min(x, y) to eliminate this problem.
					// throw new Error("OVERLAPP!");
				}

				// we could get an off one error here, if range_start_end is = txns.length
				for (let i = range_end_start; i <= range_end_end; i++) {
					for (let j  = range_start_start; j <= range_start_end; j++) {
						pos_ranges.push(txns.slice(i,j+1).map(fx));
					}
				}

				return pos_ranges.map(sx);
			};

			// These are the range questions.
			const range_question_funcs = [
				{
					c: "Need to know the total spent on transactions without memos between",
					fx: (txn) => {
						if (txn.sender === "_q" && !txn.memo) {
							return txn.amount;
						} else {
							return 0;
						}
					},
					sx: (ann) => {
						return ann.reduce((a,c) => a+c, 0);
					}
			 	},
				{
					c: "Need to know the total spent on transactions with memos between",
					fx: (txn) => {
						if (txn.sender === "_q" && txn.memo) {
							return txn.amount;
						} else {
							return 0;
						}
					},
					sx: (ann) => {
						return ann.reduce((a,c) => a+c, 0);
					}
			 	},
				{
					c: "Need to know the total earned on transactions without memos between",
					fx: (txn) => {
						if (txn.recipient === "_q" && !txn.memo) {
							return txn.amount;
						} else {
							return 0;
						}
					},
					sx: (ann) => {
						return ann.reduce((a,c) => a+c, 0);
					}
			 	},
				{
					c: "What was the net GC between",
					fx: (txn) => {
						if (txn.recipient !== "_q" ) {
							return -txn.amount;
						} else {
							return txn.amount;
						}
					},
					sx: (ann) => {
						return ann.reduce((a,c) => a+c, 0);
					}
				}
			];

			// Returns the possible answers for a given single question. TFX is the filter to
			// pass to accts.transactions, fx gives the answer, given a question, and px gives
			// sorts the possible answers, by distance from near. fx should return an object
			// with .ans property.
			const single_question = (near,tfx,fx,px) => {
				let txns = #s.accts.transactions(tfx);
				let buffer = 20;

				let range_start = -1;
				let range_end = -1;

				for (let i = 0; i < txns.length; i++) {
					let txn = txns[i];
					let rots = round_off(txn.time);

					if (rots > near) {
						range_start = i;
					} else if (rots < near) {
						range_end = i;
						break;
					}
				}

				// Now we just calculate the real range.
				range_start = Math.max(0, range_start-buffer);
				range_end = Math.min(txns.length-1, range_end+buffer);

				let pos_ans = txns.slice(range_start,range_end+1).map(fx); //.sort(px);
				return pos_ans;
			}

			const single_question_funcs = [
				{
					c: "Get me the amount of a large withdrawal near",
					tfx: {
						count: "all",
						from: "_q"
					},
					fx: (tx) => {
						return { raw: tx.amount, ans: _S.num_to_gc(-tx.amount)};
					},
					px: (a,b) => {
						return b.raw - a.raw;
					}
				}
			]

			// We can get the message first.
			_S.args["acct_nt"] = "GC";
			_S.call_loc(t);

			if (_S.is_done() || _S.lm.split('\n').length > 1) {
						return; // Done.
			}

			// loop through and check if it is a between question:
			for (let rqf of range_question_funcs) {
				if (!_S.lm.startsWith(rqf.c)) {
					continue;
				}

				// So this is the question, so we now proceed to solve it.
				let start = ing2ts(_S.lm.slice(-27,-16));
				let end = ing2ts(_S.lm.slice(-11));

				let pos_ans = range_question(start,end,rqf.fx,rqf.sx);
				let pos_ans_set = new Set(pos_ans);
				_S.args["__pos_ans_set"] = Array.from(pos_ans_set);

				for (let posa of pos_ans_set) {
					_S.args["acct_nt"] = _S.num_to_gc(posa);
					_S.call_loc(t);

					if (_S.is_done() || _S.lm.split('\n').length > 1) {
						return; // Done.
					}
				}

				throw new Error("Couldn't find answer!!");
			}

			// Loop through and check if it is a single qusetion:
			for (let sqf of single_question_funcs) {
				if (!_S.lm.startsWith(sqf.c)) {
					continue;
				}

				// So this is the question, so we now proceed to solve it.
				let near = ing2ts(_S.lm.slice(-11));

				let pos_ans = single_question(near,sqf.tfx,sqf.fx,sqf.px);
				let pos_ans_set = new Set(pos_ans.map(u => u.ans));
				_S.args["__pos_ans_set"] = Array.from(pos_ans_set);

				for (let posa of pos_ans_set) {
					_S.args["acct_nt"] = posa;
					_S.call_loc(t);

					if (_S.is_done() || _S.lm.split('\n').length > 1) {
						return; // Done.
					}
				}

				throw new Error("Couldn't find answer!");
			}
			throw new Error("Couldn't find range or single question that matched!");
		},

		solve_sn_w_glock: (t) => {
			// we use a second user with the love_companion script.

			// TODO(rhermes): Add error checking here.

			// First we deposit everything we have.
			var balance = #s.accts.balance({});	

			// TODO(rhermes): Add check here to see if balance is 0. If it is, we avoid an external call.
			var transfer = #s.accts.xfer_gc_to({to: "_w", amount: balance});

			_S.args["sn_w_glock"] = "";
			_S.call_loc(t);
			
			// Check if we can quit right here.
			// The message is always just one line long, so anymore and we have solved
			// the message before.
			if (_S.lm.split('\n').length > 1) {	return;	}

			var amount_needed = _S.sn_w_glock_amounts[_S.lm];
			if (!amount_needed) {
				// We got something we haven't seen.
				throw new Error("Haven't seen this secret!");
			}

			// withdraw money needed.
			var withdraw = #s._w.love_companion({act: "withdraw", amount: amount_needed});

			_S.call_loc(t);

			if (_S.lm.split('\n').length == 1) {	
				throw new Error("We must have got the secret wrong.");
			}
		},
		
		// === UTIL ===
		is_done: () => {
			let prt = _S.lm.split('\n');
			return (prt[0] === "`NLOCK_UNLOCKED`" && prt[prt.length-1] === "Connection terminated.");
		},

		
		num_to_gc: (n) => {
			let ret = "";
			if (n == 0) {return "0GC"};
			if (n < 0) {ret += "-"; n = -n;}
			if (n > 1000000000000000-1) {ret += Math.floor(n/1000000000000000) + "Q"; n %= 1000000000000000}
			if (n > 1000000000000-1) {ret += Math.floor(n/1000000000000) + "T"; n %= 1000000000000}
			if (n > 1000000000-1) {ret += Math.floor(n/1000000000) + "B"; n %= 1000000000}
			if (n >	1000000-1) {ret += Math.floor(n/1000000) + "M"; n %= 1000000}
			if (n > 1000-1) {ret += Math.floor(n/1000) + "K"; n %= 1000}
			if (n) {ret += n}
			return ret + "GC";
		},
	

		// Identify the locs. returns the name of the lock. This operates
		// on the assumption that we have a clean error msg.
		identify: () => {
			var lines = _S.lm.split('\n');
			if (lines[lines.length-2] !== "`VLOCK_ERROR`")
				throw new Error("Couldn't find lock error and we are not done!");

			return lines[lines.length-1].match(/`N([a-zA-Z0-9_]+)`/)[1];
		},

		load_from_db: t => {
			// THis is just basic support for now, but it helps. I only store during
			// identification for now, making check if the state is valid or not, much
			// easier.

			// TODO(rhermes): Take advantage of the fact that update with only field value
			// parametesr replaces the value in db, to avoid extra db.r call.
			let db_loc = #db.f({_k: "love_solve_state", name: t.name}).first();
			let insert_new = true;


			if (db_loc) {
				// This wastes a loc call, but I don't give a fack.
				if (t.call(db_loc.args) !== db_loc.lm) {
					// The last message was not right. So we delete the
					// db entry.
					#db.r({_id: db_loc._id});
				} else {
					insert_new = false;
					_S.args = db_loc.args;
					_S.locks = db_loc.locks;
					_S.lm = db_loc.lm;
					_S.db_id = db_loc._id;
				}
			}
			
			if (insert_new) {
				// We didn't find it, so we are inserting it.
				_S.call_loc(t);
				#db.i({
					_ts: Date.now(), _k: "love_solve_state",
					name: t.name, args: _S.args, locks: _S.locks,
					lm: _S.lm
				});
				// We need the ID, so we grab it.
				let now_loaded = #db.f({_k: "love_solve_state", name: t.name}).first();
				_S.db_id = now_loaded._id;
			}

			return !insert_new;
		},

		// This assumes that the document is in the db.
		update_db: t => {
			let retval = #db.u({_id: _S.db_id}, {
				"$set": {
					args: _S.args, 
					locks: _S.locks,
					lm: _S.lm
				}
			});

			return retval;
		},

		// This is the public endpoint.
		// T = script for loc to call
		// XGT = script for accts.xfer_gc_to.
		solve: (t) => {
			// Set states to what we need them to be.
			_S.lm = "";
			_S.args = {};
			_S.locks = [];
			_S.msgs = [];
			_S.ts_start = Date.now();

			// Preliminary db support.
			var lock_name = _S.load_from_db(t);


			while (!_S.is_done()) {
				var lock_name = _S.identify();
				var solve_func = _S["solve_" + lock_name];
				
				if (solve_func === undefined) {
					throw new Error("Lock " + lock_name + " not implemented yet!");
				}
				_S

				// Here we update. This ensures that we can use the lm check to ensure that
				// everthing is clean.
				_S.update_db(t);

				var ts_s_lock = Date.now();
				solve_func(t);
				var ts_e_lock = Date.now();
				_S.locks.push(lock_name);
				_S.ts_locks.push(ts_e_lock-ts_s_lock);
			}

			_S.ts_end = Date.now();

			return {
				locks: _S.locks, 
				args: _S.args, 
				loc_calls: _S.msgs.length, 
				ts_total: _S.ts_end - _S.ts_start,
				ts_loc_calls: _S.ts_calls.reduce((a,c) => a+c),
				ts_locks: _S.ts_locks
			};
		},
	};

	if (a.t === undefined) {
		return _S;
		// return "Give me a target, love~";
	}
				
	try {
		return _S.solve(a.t);
	} catch (e) {
			return [{
				locks: _S.locks, 
				args: _S.args, 
				loc_calls: _S.msgs.length,
				msgs: _S.msgs,
				ts_total: _S.ts_end - _S.ts_start,
				ts_loc_calls:  _S.ts_calls.reduce((a,c) => a+c, 0),
				ts_locks: _S.ts_locks
			}, e.message];
	}
}
