function(ctx, args) {
	// This script sorts upgrades.

	// TODO(rhermes): implement! Sort first on loaded, then on name and then on
	// power of the upgrade.
	// return JSON.stringify(#s.sys.upgrades({info: [1,2]}));
	var f_cmp;

	// This is the compare function
	var cmpF = (a, b) => {
			// Sort on loaded first.
			if (a.loaded !== b.loaded ) {
				return  (a.loaded) ? -1 : 1;
				//return b.loaded - a.loaded;
			}

			var getType = function(k) {
				switch(k.name) {
					case "public_script_v1":
					case "public_script_v2":
						return "public_script_slot";
					
					case "script_slot_v1":
					case "script_slot_v2":
						return "script_slot";
					
					case "char_count_v1":
					case "char_count_v2":
						return "char_count";
					
					case "c001":
					case "c002":
					case "c003":
					case "ez_21":
					case "ez_35":
					case "ez_40":
					case "w4rn":
					case "w4rn_er":
					case "CON_SPEC":
						return "lock";
					
					default:
						throw new Error("getType not defined for " + k.name);
				}
			}

			// Then we sort on type.
			if (getType(a) !== getType(b)) {
				return (getType(a) < getType(b)) ? -1 : 1;
			}

			// Then we sort on capacity.
			var f_cmp;
			switch (getType(a)) {
				case "char_count":
					f_cmp = (a,b) => b.chars - a.chars;
					break;
				case "script_slot":
				case "public_script_slot":
					f_cmp = (a,b) => b.slots - a.slots;
					break;
				case "lock":
					// TODO(rhermes): properly implement this.
					f_cmp = (a,b) => 0;
					break;
				default:
					throw Error("not implemented for " + a.type);
			}
			if (f_cmp(a,b) !== 0) {
				return f_cmp(a,b);
			}

			// Now we are getting to astetics, so it's name first, then rarity.
			if (a.name.toUpperCase() !== b.name.toUpperCase()) {
				return (a.name.toUpperCase() < b.name.toUpperCase) ? -1 : 1;
			}

			// The last sensiblething we can order by is tier.

			if (a.rarity !== b.rarity) {
				return b.rarity - a.rarity;
			}

			// Now we just filter on sn, because there is little else left to do.
			return (a.sn < b.sn) ? -1 : 1;
	}
	//cmpF = (a, b) => (0 + b.loaded) - (0 + a.loaded);

	

	// Get list of upgrades -> filter
	var up_idx = #s.sys.upgrades({});
	var up_val = #s.sys.upgrades({info: up_idx.map((e) => e.i)});
	var up_val_sort = up_val.slice().sort(cmpF);

	for (var i = 0; i < up_val_sort.length; i++) {
		up_val[up_val_sort[i].i]["ix"] = i;
	}

	// The sorting here is taken from: https://en.wikipedia.org/wiki/Longest_increasing_subsequence
	var find_lis = (X) => {
		var N = X.length;
		var L = 0;
		var P = new Int32Array(N);
		var M = new Int32Array(N+1);
		
		for (var i = 0; i < N; i++) {
			// Binary search to get largest psotive
			var lo = 1;
			var hi = L;
			while (lo <= hi) {
				var mid = Math.ceil((lo+hi)/2);
				if (X[M[mid]].ix < X[i].ix) {
					lo = mid+1;
				} else {
					hi = mid-1;
				}
			}
			
			P[i] = M[lo-1];
			M[lo] = i;
			
			if (lo > L) {
				L = lo;
			}
		}
		
		var S = new Array(L);
		var k = M[L];
		for (var i = L-1; i > -1; i--) {
			S[i] = X[k];
			k = P[k];
		}
		
		return S;
	};

	var gen_move = (X) => {
		var lis = find_lis(X);
		var nomove = new Set(lis.map(u => u.sn));
		// return Array.from(nomove);
		
		var moves = X.filter(u => !nomove.has(u.sn)).sort((a,b) => b.ix-a.ix);

		var Xw = X.slice();

		var move_cmds = [];
		for (var move of moves) {
			// Since we are always doing the ones who will be moved the most to the right, there is no need adjust idx.
			var fr = Xw.findIndex((u) => u.sn == move.sn);
			move_cmds.push([fr,move.ix]);
			Xw.splice(fr,1);
			Xw.splice(move.ix,0,move);
		}

		return move_cmds;
	}

	var mov_cmds = gen_move(up_val);
	var kk = #s.sys.upgrades({reorder: mov_cmds});
	return "That required " + mov_cmds.length + " move commands!";
	// return up_val_sort.map(u => JSON.stringify({i: u.i, name: u.name}));
	//return up_val.map(u => JSON.stringify({i: u.i, name: u.name, should_be: u.should_be}));
}
