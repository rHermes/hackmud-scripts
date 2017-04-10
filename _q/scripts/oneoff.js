function(ctx, a) {
	let s = #s.scripts.lib();
	let s_p = Object.getOwnPropertyNames(s);

	var outs = [];
	for (let p of s_p) {
		outs.push("s." + p + ":\t\t\t" + typeof s[p] + " : \t\t\t" + s[p]);
	}

	var n_to_gc = (n) => {
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
	};
	
	var tests_n_to_gc = [
		0,
		-1,
		10,
		100,
		1000,
		10000,
		1000000,
		30200000,
		1200302103,
		21031203023123,
		232312,
		2030120412003120301230,
		-10000000000000001
	];



	outs = [];

	// the unit test.
	for (let test of tests_n_to_gc) {
		let simp = s.to_gc_str(test);
		let mimp = n_to_gc(test);

		if (simp !== mimp) {
			outs.push("FAILED: Expected " + simp + " got " + mimp);
		}
	}
	return outs.join("\n");

	let solve_CON_SPEC = (t) => {
		// First we need to define the alphabeth.
		const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let places = t.split('').map(u => abc.indexOf(u));


		// Now we simply got a reverse string.
		if ((places[0] == (places[1]+1)) && (places[1] == (places[2]+1))) {
			let k = places[places.length-1];
			return abc[k-1] + abc[k-2] + abc[k-3];
		} 
		// Forward string.
		else if ((places[0] == (places[1]-1)) && (places[1] == (places[2]-1))) {
			let k = places[places.length-1];
			return abc[k+1] + abc[k+2] + abc[k+3];
		} else {
			return "";
		}
	}

	let solve_CON_SPEC_v2 = t => {
		// First we need to define the alphabeth.
		const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let places = t.split('').map(u => abc.indexOf(u));
		const dx = [places[1] - places[0], places[2] - places[1]];

		let di = 0;
		let k = places[0];
		let ans = "";

		for (let i = 0; i < places.length+2; i++) {
			k += dx[di];
			di = 1 - di;
			ans += abc[k];
		}
		return ans.slice(-3);
	}

	outs = [];
	let tests_CON_SPEC = [
		{in: "UTSRQPO", out: "NML"},
		{in: "ZYXWVUT", out: "SRQ"},
		{in: "EFGHIJK", out: "LMN"},
		{in: "VUTS", out: "RQP" },
		{in: "CFGJKNO", out: "RSV"}
	];

	for (let test of tests_CON_SPEC) {
		let simp = test.out;
		let mimp = solve_CON_SPEC_v2(test.in);

		if (simp !== mimp) {
			outs.push("FAILED '" + test.in + "': Expected '" + simp + "' got '" + mimp + "'");
		}
	}

	return outs.join("\n");
	//return s.corrupt(outs.join("\n"), 5);
}
