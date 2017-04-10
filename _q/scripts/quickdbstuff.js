function(ctx, a)
{
	var t1_loc_idx = #db.f({_k: "t1_loc_idx"},{}).first();
	if (!t1_loc_idx) {
		return "We have no t1_loc_idx"
	}

	const re_loc_addr = /^[a-zA-Z_][a-zA-Z_0-9]*\.[a-zA-Z_][a-zA-Z_0-9]*$/;

	var buff = "";
	var nremove = new Set();
	for (var nloc of t1_loc_idx.new_locs) {
		if (!re_loc_addr.test(nloc)) {
			buff += "Invalid: " + nloc + "\n";
			nremove.add(nloc);
		}
	}
	buff += "Number of invalid entries: " + nremove.size;

	#db.u({_id: t1_loc_idx._id}, {$pullAll: {new_locs: Array.from(nremove)}});
	return buff;
}
