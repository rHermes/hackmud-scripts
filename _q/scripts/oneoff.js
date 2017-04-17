function(ctx, a) {
	let s = #s.scripts.lib();
	let s_p = Object.getOwnPropertyNames(s);

	let LIB = #s._q.lib();
	let D = #s.dtr.lib();

	var outs = [];
	for (let p of s_p) {
		outs.push("s." + p + ":\t\t\t" + typeof s[p] + " : \t\t\t" + s[p]);
	}

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
		let mimp = LIB.num_to_gc(test);

		if (simp !== mimp) {
			outs.push("FAILED: Expected " + simp + " got " + mimp);
		}
	}
//	return outs.join("\n");

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

	//return outs.join("\n");

	// Reorder array	
	outs = [];
	let tests_reorder = [
		[0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 16, 15, 17],
		[ 7, 14, 15, 4, 20, 12, 10, 5, 11, 19, 13, 17, 0, 6, 2, 8, 3, 16, 18, 9, 1 ],
	];
	


	for (let test of tests_reorder) {
		let simp = D.generateReorderArray(test);
		let mimp = LIB.move_order(test);

		outs.push(simp.length);
		outs.push(mimp.length);
		outs.push("\n");
		continue;

		if (simp !== mimp) {
			outs.push("FAILED '" + test.in + "': Expected '" + simp + "' got '" + mimp + "'");
		}
	}

	// return outs.join("\n");

	outs = [];

	// Generate test hell suite.

	let test_suite = [];

	// Entire sentence + single word.
	for (let col of s.colors) {
		test_suite.push(
			"`" + col + "This is a good sentence`",
			"This is a `" + col + "good` sentence"
		);
	}

	// Rainbow.
	test_suite.push(
		Array.from(s.colors).map(c => "`"+c +c+ "`").join("")
	);

	const test_suite_str = test_suite.join("\n");

	let deco = LIB.decorrupt(() => s.corrupt(test_suite_str, 4).split('\n'));
	
	if (deco.join('\n') !== test_suite_str) {
		return deco;
	}

	return outs;
}
