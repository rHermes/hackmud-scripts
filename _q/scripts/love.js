function(ctx, a) {
	// This is just a pretty frontend to the liblove libraries.
	if (a.t === undefined) {
		return "You need to give me a target, dear <3";
	}

	// Import libraries.
	const NAV = #s._q.liblove_navigate();
	const HARVEST = #s._q.liblove_harvest();
	try {
		var start = Date.now();
		var kiwi =  NAV.solve(a.t);
		var end = Date.now();

		return {ts: end-start, s: kiwi};
	} catch (e) {
		return "THERE WAS AN ERROR!";
	}
}
