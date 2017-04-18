function(ctx, a) {
	// This is for harvesting ALL addresses from a T1 corp.

	// Specials:
	// public_profile -- need to specify user
	// empl_pages

	// giant_spidr
	// Welcome to the giant_spidr project page. For a list of members add list: true


	// Check for scrape.

	// Libraries.
	const LIB = #s._q.lib();
	const STATE = #s._q.libpassion_state();

	let HARVEST_T1 = {
		get_main_cmd: (s, t) => {
			// The commands are always the last line, so we can skip decorrupting in some cases,
			// by only caring about the last line.
			const raw = LIB.decorrupt(() => {let vk = t.call({}).split('\n'); return [vk[vk.length-1]]})[0];
			// Now we get the mystery.
			const main_cmd_re = /-- access directory with ([a-z_]+):"([a-z]+?)"/;
			const re_ret = raw.match(main_cmd_re);

			s.ctx.cmd_main = re_ret[1];
			s.ctx.opt_main = re_ret[2];
		},

		get_other_opts: (s, t) => {
			const raw = LIB.decorrupt(() => {let vk = t.call().split('\n'); return [vk[vk.length-1]]})[0];

			const other_opts_re = /(?: |\|)*([a-z_]+)(?: |\|)*([a-z_]+)(?: |\|)*/;
			const re_ret = raw.match(other_opts_re);
			s.ctx.opt_blog = re_ret[1];
			s.ctx.opt_pass_scrape = re_ret[2];
		},

		get_pass_opt: (s, t) => {
			const args = {};
			args[s.ctx.cmd_main] = s.ctx.opt_pass_scrape;

			const raw = LIB.decorrupt(() => {let vk = t.call(args).split('\n'); return [vk[vk.length-1]]})[0];

			const pass_opts_re = /We are calling this strategy ([a-zA-Z0-9_]+) and/;
			const re_ret = raw.match(pass_opts_re);
			s.ctx.opt_pass = re_ret[1];
		},

		get_blog_scrape: (s, t) => {
			const args = {};
			args[s.ctx.cmd_main] = s.ctx.opt_blog;
			const raw = LIB.decorrupt(() => t.call(args).map(u => u.split('\n')[1]));

			// Dedup.
			const lines = Array.from(new Set(raw));
			lines.sort();
			//s.ctx.rr = lines;

			// Here we list the regexes to run on the raw content.
			const proj_regexes = [
				/ of project ([a-z0-9_\-#,\/|.,\(\)]+?) /i,
				/ release date for ([a-z0-9_\-#,\/|.,\(\)]+?)\./i,
				/Work continues on ([a-z0-9_\-#,\/|.,\(\)]+?),/i,
				/ new developments on ([a-z0-9_\-#,\/|.,\(\)]+?) /i,
				/ Look for ([a-z0-9_\-#,\/|.,\(\)]+?) /i,
				/ for the new ([a-z0-9_\-#,\/|.,\(\)]+?) /i,
				/ initial launch of the ([a-z0-9_\-#,\/|.,\(\)]+?) /i,
				/ for ([a-z0-9_\-#,\/|.,\(\)]+?) since it was/i,
				/([a-z0-9_\-#,\/|.,\(\)]+?) announces beta /i,
				/Following critical review of ([a-z0-9_\-#,\/|.,\(\)]+?),/i,
			];

			const user_regexes = [
				/([a-z0-9_\-#,\/|.,\(\)]+?) of project /i,
				/'.*?' -- ([a-z0-9_\-#,\/|.,\(\)]+?) when being /i,
			];

			const special_regexes = [
				/core competency with ([a-z0-9_\-#,\/|.,\(\)]+?) is now/i,
				/ ([a-z0-9_\-#,\/|.,\(\)]+?) personal showcase system\./i,
			];

			s.ctx.no_match = [];

			let proj_match = new Set();
			let user_match = new Set();
			let spec_match = new Set();

			// now we just loop through the lines and find the matches.
			for (let line of lines) {
				let matched = false;
				const prs = [
					[proj_regexes, proj_match],
					[user_regexes,user_match],
					[special_regexes, spec_match],
				];

				for (let i = 0; i < prs.length; i++) {
					let [regs, mts]= prs[i];
					for (let re of regs) {
						const p = line.match(re);
						if (p) {
							matched = true;
							mts.add(p[1]);
						}
					}
				}

				if (!matched) {
					s.ctx.no_match.push(line);
				}
			}

			s.ctx.scraped_projects = Array.from(proj_match).sort();
			s.ctx.scraped_users = Array.from(user_match).sort();
			s.ctx.scraped_special = Array.from(spec_match).sort();
		},

		harvest: (t) => {
			let s = STATE.create_or_load(t.name, 1);
			// return LIB.decorrupt(() => t.call().split('\n')); //.split('').join('\u200B');
			//return JSON.stringify(t.call({}).split("\n"));
			//return JSON.stringify(LIB.decorrupt(() => t.call({}).split('\n')).join("\n")); //.join('\n').split('').join('\u200B');
			
			// First we do is check on the stage of the harvest state.
			while (s.stage !== "done") {
				// Here we do the desicion.
				switch (s.stage) {
					case "init":
						s.stage = "get_main_cmd";
						break;
					case "get_main_cmd":
						HARVEST_T1.get_main_cmd(s, t);
						s.stage = "get_other_opts";
						break;
					case "get_other_opts":
						HARVEST_T1.get_other_opts(s, t);
						s.stage = "get_pass_opt";
						break;
					case "get_pass_opt":
						HARVEST_T1.get_pass_opt(s, t);
						s.stage = "get_blog_scrape";
						break;
					case "get_blog_scrape":
						HARVEST_T1.get_blog_scrape(s, t);
						break;
					case "get_pass_cmd":
						break;
					default:
						return "THIS IS NOT A VALID STAGE!";
				}

				STATE.store(s);

				// this is for debugging
				if (s.stage == "get_blog_scrape") {
					if (s.ctx.done_wow) {
						break;
					} else {
						s.ctx.done_wow = true;
					}
				}
			}
			return s;
		}
	};

	return HARVEST_T1;
}
