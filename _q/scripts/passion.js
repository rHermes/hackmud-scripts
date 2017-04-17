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
		case "t1_harvest":
			return HARVEST_T1.harvest(a.t);
		default:
			return 'Available commands are: t1_harvest, list, list_update';
	}
}
