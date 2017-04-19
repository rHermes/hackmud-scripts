function(ctx, a) {
	// joy is the entry point for anything market / upgrade related.

	let r0 = #s.market.browse({rarity: 0});
	/*
	let r1 = #s.market.browse({rarity: 1});
	let r2 = #s.market.browse({rarity: 2});
	let r3 = #s.market.browse({rarity: 3});
	let r4 = #s.market.browse({rarity: 4});
	let r5 = #s.market.browse({rarity: 5});
	*/
	let r0c = r0.slice();
	let r0_full = [];
	while (r0c.length !== 0) {
		let is = r0c.splice(0,100).map(u => u.i);
		r0_full.push(...#s.market.browse({i: is}));
	}
	return r0_full.length;
	// let r2_full = #s.market.browse({i: r2.map(u => u.i)});
	//return [r0.length, r1.length, r2.length, r3.length, r4.length, r5.length];
}
