function(ctx, a) {
	// This is just a pretty frontend to the libpassion libraries.
	
	// Import libraries.
	const HARVEST = #s._q.libpassion_harvest();
	
	try {
		var start = Date.now();
		var kiwi =  NAV.solve(a.t);
		var end = Date.now();

		return {ts: end-start, s: kiwi};
	} catch (e) {
		return "THERE WAS AN ERROR!";
	}
}
