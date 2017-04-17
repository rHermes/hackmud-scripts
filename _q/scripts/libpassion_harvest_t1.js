function(ctx, a) {
	// This is for harvesting ALL addresses from a T1 corp.


	// Libraries.
	const LIB = #s._q.lib();

	let HARVEST_T1 = {
		harvest: (t) => {
			return LIB.decorrupt(() => t.call()).split('').join('\u200B');
		}
	};

	return HARVEST_T1;
}
