function(ctx, a) {
	if (ctx.caller !== "_q") {
		return "Naughty boy";
	}
	switch (a.act) {
		case "withdraw":
			return #s.accts.xfer_gc_to_caller({amount: a.amount})
			break;
		default:
			return "don't know the command: " + a.act;
			break;
	}
}
