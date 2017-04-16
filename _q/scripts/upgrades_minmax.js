function(ctx, a) { // type:""
	// This script minmaxes a certain upgrade category. It will keep the number
	// of loaded upgrades of that type the same, but will attempt to maximize the
	// effect.
	
	// The normal setup.

	// This is the function that will be used to output the numerical value of
	// an upgrade. It's also the sort code, which will sort the items in reverse.
	// This allows for much common code reuse.
	var f_max;
	var f_cmp;

	switch (a.type) {
		case "char_count":
			f_max = (u) => u.chars;
			f_cmp = (a,b) => b.chars - a.chars;
			break;
		case "script_slot":
		case "public_script":
			f_max = (u) => u.slots;
			f_cmp = (a,b) => b.slots - a.slots;
			break;
		default:
			return {ok: false, msg: "haven't implemented this type."}
	}

	// Get list of upgrades -> filter
//	var up_idx = #s.sys.upgrades({}).filter((e) => e.name.startsWith(a.type));

	// Get list of actuall upgrades -> sort.
	var up_val = #s.sys.upgrades({full: true}).filter((e) => e.name.startsWith(a.type)).sort(f_cmp);
	// l.log(up_val);

	
	// filter out the loaded and the optimal setups.
	var loaded = up_val.filter((e) => e.loaded)
	var opti =  up_val.slice(0,loaded.length);

	var cur_loaded = loaded.reduce((acc,val) => acc + f_max(val), 0);
	var opti_possible = opti.reduce((acc,val) => acc + f_max(val), 0);


	// I could actually filter this first and get the same result, but I'm lazy!
	for (var upg of opti) {
		if (!upg.loaded) {
			var tmp = loaded.pop();
//			l.log("Replacing " + tmp.i + " with " + upg.i);
			#s.sys.manage({"unload": tmp.i});
			#s.sys.manage({"load": upg.i});
		}
	}

	return {ok: true, msg: opti_possible-cur_loaded};
	return {ok: true, msg: (new Error).stack};
}
