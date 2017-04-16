function(ctx, a) {
	// This is just a pretty frontend to the libpassion libraries.

	// Make sure a is initiated.
	a = a || {};
	
	// Import libraries.
	const HARVEST = #s._q.libpassion_harvest();
	const LIST = #s._q.libpassion_list();
	
	switch (a.cmd) {
		case "list":
			return LIST.get_npcs();
		case "list_update":
			return LIST.update_db();
		default:
			return 'Available commands are: list, list_update';
	}
}
