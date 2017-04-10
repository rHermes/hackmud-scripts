function(ctx, a) {
	// Attempt at making my own dtr.ls.
	// 
	// it builds around the idea of getting all the users.
	
	var start_time = Date.now();
	var fsec = #s.scripts.fullsec();
	var hsec = #s.scripts.highsec();
	var msec = #s.scripts.midsec();
	var lsec = #s.scripts.lowsec();

	return Date.now()-start_time;
}
