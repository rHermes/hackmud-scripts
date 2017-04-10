function(ctx, a) { // t:""
	//const dumps = ["ez_40"];

	var upgrades = #s.sys.upgrades();


	var unloaded = upgrades.filter(u => !u.loaded);
	var tier1 = unloaded.filter(u => u.tier === 1);
	var rarity02 = tier1.filter(u => (u.rarity === 0 || (u.name === "log_writer_v1" || u.name === "expose_access_log_v1")));
	var rarity1 = tier1.filter(u => u.rarity === 1 && !(u.name === "log_writer_v1" || u.name === "expose_access_log_v1"));

  #s.sys.xfer_upgrade_to({i: rarity02.map(u => u.i), to: a.t});

	var names_s = new Set();
	var names = {};
	for (var u of rarity1) {
		names_s.add(u.name);
		if (!names[u.name]) {
			names[u.name] = {i: u.i, count: 0};
		}
		names[u.name].count++;
	}

	
	
	var buf = "";
	for (var name of names_s) {
		buf += #s.market.sell({i: names[name].i, count: names[name].count, cost: "800KGC", confirm:true}).msg + "\n";
	}
	//return buf;
	
	return "Transfered " + rarity02.length + " items to " + a.t + "\nListed " + rarity1.length + " items for sale.";
}
