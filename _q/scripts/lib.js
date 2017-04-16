function(ctx, a) {
	// This is a library for utility functions.
	let LIB = {
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

		decorrupt: (f) => {
			// The secret is to do it on a line by line basis. The reson for this is
			// that corruption will never change the line count. The decorruption here
			// will usually just take two calls, so we don't need to worry so much
			// about the filtration of calls.

			// The function f takes no parameters and returns an array of strings.
			// these must be in the same order each time, so if the output changes
			// between calls you will need to sort and/or filter the output in f.

			// The algorithm works by diffing the output of the two calls. This is
			// harder than it sounds, as we want to preserve color information. The
			// trick is to think in units of 1 display character rather than 1 char.
			
			// This can be done, by 
			
			// TODO(rhermes): Setup some kind of hell harness test for this function.
			
			let cur = f();
		},

		move_order: (xs) => {
			// This generates one of many optimal solutions for sorting XS
			// using only pick and insert moves.



			// here we figure out the longest increasing subsequence.
			let P = new Uint32Array(xs.length);
			let M = new Uint32Array(xs.length+1);
			let L = 0;

			for (let i = 0; i < xs.length; i++) {
				let lo = 1;
				let hi = L;
				
				while (lo <= hi) {
					const mid = Math.ceil((lo+hi)/2);
					if (xs[M[mid]] < xs[i])
						lo = mid+1;
					else
						hi = mid-1;
				}
				
				P[i] = M[lo-1];
				M[lo] = i;
				L = Math.max(lo, L);
			}
			let S = [];
			let k = M[L];
			for (let i = L-1; i > -1; i--) {
				S.unshift(xs[k]);
				k = P[k];
			}
			
			let tobesorted = [];
			for (let s of xs) {
				if (S.indexOf(s) === -1) {
					tobesorted.push(s);
				}
			}

			let moves = [];

			// We make a shallow copy, so as to not change the actuall input array.
			let ys = xs.slice();
			
			// This is the part where we do the inserts.
			for (let s of tobesorted) {
				let idx = ys.indexOf(s);
				ys.splice(idx,1);
				
				// Now we need to find which of the
				let st = ys[0];
				for (let k of S) {
					if (s < k) {
						break;
					}
					st = k;
				}
				
				// now to find the index of the start value.
				let st_idx = ys.indexOf(st);
				
				// now we go forward until we find the spot where its bigger than us again.
				while (s > ys[st_idx] ) {
					st_idx++;
				}
				moves.push({from: idx, to: st_idx});
				ys.splice(st_idx,0,s);
			}
			
			return moves;
		}
	};

	return LIB;
}
