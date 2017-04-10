function(context, args)
{

//	#db.i({type:"bank", user: "_w", amount: 100})

	var l = #s.scripts.lib()
	if (args.amount && args.amount > 0) {
        if (withdraw_balance(context.caller, args.amount)) {
            //#s.accts.xfer_gc_to_caller({to:context.caller, amount:args.amount});
			l.log({to:context.caller, amount:args.amount})
            return { ok: true, msg: l.get_log()};
        }
    } else {
        return { ok: false, msg: "a" };
    }
	
    function withdraw_balance(user, amount) {
        var current = #db.f({type:"bank", user:user}).first();
        if (current.amount >= amount) {
			l.log([{type:"bank", user:user}, {$inc:{amount: -amount}}])
            //#db.u1({type:"bank", user:user}, {$inc:{amount: -amount}});
            return true;
        }
        return false;
    }
}
