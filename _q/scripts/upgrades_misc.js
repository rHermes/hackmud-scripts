function(ctx, a) {
	if (!a.t || a.t.name !== "sys.upgrades") {
		return "ERR: please call the function with t: #s.sys.upgrades";
	}

	var out_buff = [];

	// === START LOAD ===
	var starttime = Date.now();
	
	var raw_ups = a.t.call();
	var ups = a.t.call({info: [...Array(raw_ups.upgrades.length).keys()]});
	
	var endtime = Date.now();
	// === END LOAD ===

	// This is how long the load operation took.
	var load_time = endtime-starttime;


	// === START FILTER ===
	starttime = Date.now();

	for (var up of ups) {
		if (!up.loaded && up.name.startsWith("script_slot")) {
			out_buff.push(a.t.call({load: up.i}));
		}
		if (up.hasOwnProperty("slots") && up.slots > 1) {
			//out_buff.push(up);
		}
	//	out_buff.push(up);
	}

	endtime = Date.now();
	// === END FILTER ===

	// This is how long the filter operation took.
	var filter_time = endtime-starttime;


//	return {out: out_buff, load_time: load_time, filter_time: filter_time};
	return out_buff;
}
