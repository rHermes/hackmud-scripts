function(ctx, a) {
	// This is just a pretty frontend to the libpassion libraries.

	// Make sure a is initiated.
	a = a || {};
	
	// Import libraries.
	const HARVEST = #s._q.libpassion_harvest();
	const HARVEST_T1 = #s._q.libpassion_harvest_t1();
	const LIST = #s._q.libpassion_list();
	
	switch (a.cmd) {
		case "list":
			return LIST.get_npcs();
		case "list_update":
			return LIST.update_db();
		case "harvest_t1":
			return HARVEST_T1.harvest(a.t);
		case "cmds_t1":
			let npcs = LIST.get_npcs();
			return npcs.t1.map(u => '_q.passion {cmd: "harvest_t1", t: #s.' + u + '}');
		default:
			return 'Available commands are: harvest_t1, cmds_t1, list, list_update';
	}
}
