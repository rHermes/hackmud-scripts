function(ctx, a) { // i:{}, f:[], r: {}, u:[], is_script:
	// This tool is my attempt at db mongo tool. It can be used
	// both as a tool and as a script.

	// Figoure out is arr and iss obj:
	//var l = #s.scripts.lib();

	var ret = {
		i: (q) => {
			return #db.i(q);
		},
		f: (q, p) => {
			return #db.f(q, p).array();
		},
		r: (q) => {
			return #db.r(q);
		},
		u: (q, u) => {
			return #db.u(q, u);
		}
	};

	// Here we decide if we are going to 
	var starttime = Date.now();

	var res;
	if (a.i) {
		res = ret.i(a.i);
	} else if (a.f) {
		res = ret.f(a.f[0], a.f[1]);
	} else if (a.r) {
		res = ret.r(a.r);
	} else if (a.u) {
		res = ret.u(a.u[0], a.u[1]);
	}
	var endtime = Date.now();

	return {res:  res, dur: endtime-starttime};
}
