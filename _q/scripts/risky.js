function(ctx, a) {
	const create_core = () => {
		let r = {
			x: new Uint8Array(32),
			pc: 0
		};
		
		// Memory, here we have 5MiB
		let m = new Uint8Array(1048576*2);

		let core = {
			r: r,
			m: m
		};

		return core;
	}

	const create_env = (core) => {
		let env = {
			load_program: (prog, idx=0) => {
				// Check if index is 4 byte aligned.
				if (idx % 4 !== 0) {
					throw new Error("idx is not 4 byte aligned.");
				}
				core.m.set(prog, idx);
			},

			get_ins: () => {

			},
		};

		return env;
	}


	const get_op_code = (op)  => {

	};

	// 00108093                addi    ra,ra,1
	// 00100093                li      ra,1
	const prog0 = new Uint8Array(
		[0x93,0x80,0x10,0x00,0x93,0x00,0x10,0x00] //[0x73,0x00,0x10,0x00,0x93,0x05,0x00,0x00]
	);

	let core = create_core();
	let env = create_env(core);

	env.load_program(prog0);

}
