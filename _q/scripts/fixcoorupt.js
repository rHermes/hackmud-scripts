function(ctx, a) {
	const re_color_strip = /`[a-zA-Z]([^`]*?)`/g;
	const corrupt_chars = ['¡','¢','£','¤','¥','¦','§','¨','©','ª'];
	const corrupt_chars_set = new Set(corrupt_chars);
	const corrupt_chars_re = /[¡¢£¤¥¦§¨©ª]/g;
	const re_loc_addr = /^[a-zA-Z_][a-zA-Z_0-9]*\.[a-zA-Z_][a-zA-Z_0-9]*$/;

	// Time this and watch how long this takes!
	// F is a function which takes no parameters
	function decorrupt(f) {
		// Account if the output is an array.
		if (false) {
			return "Not implemented."
		}

		// This is our starting version.
		var cur_msg = f().replace(re_color_strip, "$1");

		// Build index of corrupted chars.
		var corrupt_idxs = new Set();
		var tmp_res;
		while ((tmp_res = corrupt_chars_re.exec(cur_msg)) !== null) {
			corrupt_idxs.add(tmp_res.index);
		}
		
		// This is to make it into an array so that 
		cur_msg = cur_msg.split('');
		

		// Now we call the difference.
		while (corrupt_idxs.size) {
			var new_msg = f().replace(re_color_strip, "$1");

			var cleaned_idx = new Set();
			for (var idx of corrupt_idxs) {
				if (!corrupt_chars_set.has(new_msg[idx])) {
					cleaned_idx.add(idx);
					cur_msg[idx] = new_msg[idx];
				}
			}

			for (var idx of cleaned_idx) {
				corrupt_idxs.delete(idx);
			}
		}

		//outs.push(cur_msg.join());
		
		return cur_msg.join('');
	}

	var starttime = Date.now();
	
	//var cln = #s.bunnybat_hut.memberlogin({username: "turner_t", get:"order_qrs"}).join('\n');
	//var cln = decorrupt(() => [].concat(#s.weyland.members({username: "theformalartist", action: "order_qrs", h1u: "30fng"})).join('\n'));
	var endtime = Date.now();

	#db.i({_k: "qr2_dirty", data: cln});

	return {c: cln, ts: endtime-starttime};
}
