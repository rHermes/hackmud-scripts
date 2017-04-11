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
	};

	return LIB;
}
