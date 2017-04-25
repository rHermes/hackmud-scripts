function(ctx, a) {
	// This is just a pretty frontend to the libpassion libraries.

	// Make sure a is initiated.
	a = a || {};
	
	// Import libraries.
	const HARVEST = #s._q.libpassion_harvest();
	const HARVEST_T1 = #s._q.libpassion_harvest_t1();
	const HARVEST_T2 = #s._q.libpassion_harvest_t2();
	const LIST = #s._q.libpassion_list();
	const LOCS = #s._q.libpassion_locs();
	
	switch (a.cmd) {
		case "list":
			return LIST.get_npcs();
		case "list_update":
			return LIST.update_db();
		case "harvest_t1":
			return HARVEST_T1.harvest(a.t);
		case "harvest_t2":
			return HARVEST_T2.harvest(a.t);
		case "cmds_t1":
			return LIST.get_npcs().t1.map(u => '_q.passion {cmd: "harvest_t1", t: #s.' + u + '}');
		case "cmds_t2":
			return LIST.get_npcs().t2.map(u => '_q.passion {cmd: "harvest_t2", t: #s.' + u + '}');
		case "cmds_t1_solve":
			return LOCS.t1_locs().map(u => "_q.love {t: #s." + u + "}").slice(0,500);
		case "cmds_t2_solve":
			return LOCS.t2_locs().map(u => "_q.love {t: #s." + u + "}").slice(0,500);
		case "cmds_t1_count":
			return "We have " + LOCS.t1_locs().length + " T1 locs in the db.";
		case "cmds_t2_count":
			return "We have " + LOCS.t2_locs().length + " T2 locs in the db.";
		case "prune_t1":
			let pruned = LOCS.prune_t1();
			return "Pruned " + pruned + " locations!";
		default:
			return 'Available commands are: harvest_t1, cmds_t1, list, list_update, prune_t1, cmds_t1_solve';
	}
}
