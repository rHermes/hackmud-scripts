function(context, args) {
var stt = Date.now();
		// Utility function, since I use the same code multiple places.
	var timeF = f => {
		var starttime = Date.now();
		var ret = f();
		return [ret, Date.now()-starttime];
	}

	var qrd = #s._q.qrv2();

	// Load in the qr from the db. We could get this from a command, but this is
  // faster and better.
	var [raw_qrs, load_time] = timeF(() => #db.f({_k: "qr2_dirty"},{}).first().data);
	// Now we need to isolate one QR code to begin with.

	// Strip away missing messages
	var raw_qrs_1 = raw_qrs.replace(/<.*?>\n?/g,"");

	// Split them into invidual qrs.
	var qr_strs = raw_qrs_1.split('\n\n').filter(u => u);

	var arrs = qr_strs.map(u => qrd.str_to_arr(u));


	var payloads = arrs.map(u => qrd.get_data(u));

	return Date.now()-stt;

}
