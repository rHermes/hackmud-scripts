function(ctx, a) {
	// This is just a pretty frontend to the liblove libraries.
	if (a.t === undefined) {
		return "You need to give me a target, dear <3";
	}

	// Import libraries.
	const NAV = #s._q.liblove_navigate();

	try {
		return NAV.solve(a.t);
	} catch (e) {
		return "THERE WAS AN ERROR!";
	}
}
