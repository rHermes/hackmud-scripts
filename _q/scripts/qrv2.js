function(ctx, a) {
	// The modulos operator in javascript is not wellbehaved for negative
	// numbers, so we use this instead.
	function mod(n, m) {
		return ((n % m) + m) % m;
	}

	var crBitStream = (uint8Array) => {
		var bs = {
			a: uint8Array,
			position: 0,
			bitsPending: 0,

			writeBits: (bits, value) =>  {
				if (bits == 0) { return; }
				value &= (0xffffffff >>> (32 - bits));
				var bitsConsumed;
				if (bs.bitsPending > 0) {
					if (bs.bitsPending > bits) {
						bs.a[bs.position - 1] |= value << (bs.bitsPending - bits);
						bitsConsumed = bits;
						bs.bitsPending -= bits;
					} else if (bs.bitsPending == bits) {
						bs.a[bs.position - 1] |= value;
						bitsConsumed = bits;
						bs.bitsPending = 0;
					} else {
						bs.a[bs.position - 1] |= value >> (bits - bs.bitsPending);
						bitsConsumed = bitsPending;
						bs.bitsPending = 0;
					}
				} else {
					bitsConsumed = Math.min(8, bits);
					bs.bitsPending = 8 - bitsConsumed;
					bs.a[bs.position++] = (value >> (bits - bitsConsumed)) << bs.bitsPending;
				}
				bits -= bitsConsumed;
				if (bits > 0) {
					bs.writeBits(bits, value);
				}
			},

			readBits: (bits, bitBuffer) => {
				if (typeof bitBuffer == "undefined") { bitBuffer = 0; }
				if (bits == 0) { return bitBuffer; }
				var partial;
				var bitsConsumed;
				if (bs.bitsPending > 0) {
					var byte = bs.a[bs.position - 1] & (0xff >> (8 - bs.bitsPending));
					bitsConsumed = Math.min(bs.bitsPending, bits);
					bs.bitsPending -= bitsConsumed;
					partial = byte >> bs.bitsPending;
				} else {
					bitsConsumed = Math.min(8, bits);
					bs.bitsPending = 8 - bitsConsumed;
					partial = bs.a[bs.position++] >> bs.bitsPending;
				}
				bits -= bitsConsumed;
				bitBuffer = (bitBuffer << bitsConsumed) | partial;
				return (bits > 0) ? bs.readBits(bits, bitBuffer) : bitBuffer;
			},

			seekTo: (bitPos) => {
				bs.position = (bitPos / 8) | 0;
				bs.bitsPending = bitPos % 8;
				if(bs.bitsPending > 0) {
					bs.bitsPending = 8 - bs.bitsPending;
					bs.position++;
				}
			}
		};
		return bs;
	}

	var _qd = {
		prim: 0x11D,
		exp:  [],
		log:  [],
		// Define modes when it comes to decoding.
		modes: {
			// Normal modes.
			NUMERIC: 1,
			ALPHANUMERIC: 2,
			BYTE: 4,
			KANJI: 8,

			// Special modes.
			TERMINATOR: 0,
			FCN1_FIRST_POSITION: 5,
			FCN1_SECOND_POSITION: 9,
			STRUCTURED_APPEND: 3,
			ECI: 7,
		},
		
		modes_length: {
			1: [10, 12, 14],
			2: [9, 11, 13],
			4: [8, 16, 16],
			8: [8, 10, 12],
		},

		// The % is well defined over postivite numbers which is what we are
		// going to be iterating over here.
		masks: [
			(i,j) => !((i+j)%2),
			(i,j) => !(i%2),
			(i,j) => !(j%3),
			(i,j) => !((i+j)%3),
			(i,j) => !((Math.floor(i/2) + Math.floor(j/3))%2),
			(i,j) => !(((i*j)%2) + ((i*j)%3)),
			(i,j) => !((((i*j)%3) + i*j)%2),
			(i,j) => !((((i*j)%3) + i + j)%2)
		],
		
		// Consider putting this into a db.
		alignment_patterns: [
			[],[],					// 0 & 1. Just here to pad so 2 is the first.
			[18],
			[22],
			[26],
			[30],
			[34],
			[6,22,38],
			[6,24,42],
			[6,26,46],
			[6,28,50],
			[6,30,54],
			[6,32,58],
			[6,34,62],
			[6,26,46,66],
			[6,26,48,70],
			[6,26,50,74],
			[6,30,54,78],
			[6,30,56,82],
			[6,30,58,86],
			[6,34,62,90],
			[6,28,50,72,94],
			[6,26,50,74,98],
			[6,30,54,78,102],
			[6,28,54,80,106],
			[6,32,58,84,110],
			[6,30,58,86,114],
			[6,34,62,90,118],
			[6,26,50,74,98,122],
			[6,30,54,78,102,126],
			[6,26,52,78,104,130],
			[6,30,56,82,108,134],
			[6,34,60,86,112,138],
			[6,30,58,86,114,142],
			[6,34,62,90,118,146],
			[6,30,54,78,102,126,150],
			[6,24,50,76,102,128,154],
			[6,28,54,80,106,132,158],
			[6,32,58,84,110,136,162],
			[6,26,54,82,110,138,166],
			[6,30,58,86,114,142,170],
		],

		// The format is [L blocks, M blocks, Q blocks, H blocks]
		// Where a block is of the format [c,n,k] where c is the number of times it appears.
		// This could also be done with objects, but I'll just use arrays here for more 
		// compact code.
		rs_block_sizes: [
			[[],[],[],[]],[[],[],[],[]],					// 0 & 1. Just here to pad, so that version 2 comes first.
			[[[1,44,34]],[[1,44,28]],[[1,44,22]],[[1,44,16]]],
			[[[1,70,55]],[[1,70,44]],[[2,35,17]],[[2,35,13]]],
			[[[1,100,80]],[[2,50,32]],[[2,50,24]],[[4,25,9]]],
			[[[1,134,108]],[[2,67,43]],[[2,33,15],[2,34,16]],[[2,33,11],[2,34,12]]],
			[[[2,86,68]],[[4,43,27]],[[4,43,19]],[[4,43,15]]],
			[[[2,98,78]],[[4,49,31]],[[2,32,14],[4,33,15]],[[4,39,13],[1,40,14]]],
			[[[2,121,97]],[[2,60,38],[2,61,39]],[[4,40,18],[2,41,19]],[[4,40,14],[2,41,15]]],
			[[[2,146,116]],[[3,58,36],[2,59,37]],[[4,36,16],[4,37,17]],[[4,36,12],[4,37,13]]],
			[[[2,86,68],[2,87,69]],[[4,69,43],[1,70,44]],[[6,43,19],[2,44,20]],[[6,43,15],[2,44,16]]],
			[[[4,101,81]],[[1,80,50],[4,81,51]],[[4,50,22],[4,51,23]],[[3,36,12],[8,37,13]]],
			[[[2,116,92],[2,117,93]],[[6,58,36],[2,59,37]],[[4,46,20],[6,47,21]],[[7,42,14],[4,43,15]]],
			[[[4,133,107]],[[8,59,37],[1,60,38]],[[8,44,20],[4,45,21]],[[12,33,11],[4,34,12]]],
			[[[3,145,115],[1,146,116]],[[4,64,40],[5,65,41]],[[11,36,16],[5,37,17]],[[11,36,12],[5,37,13]]],
			[[[5,109,87],[1,110,88]],[[5,65,41],[5,66,42]],[[5,54,24],[7,55,25]],[[11,36,12],[7,37,13]]],
			[[[5,122,98],[1,123,99]],[[7,73,45],[3,74,46]],[[15,43,19],[2,44,20]],[[3,45,15],[13,46,16]]],
			[[[1,135,107],[5,136,108]],[[10,74,46],[1,75,47]],[[1,50,22],[15,51,23]],[[2,42,14],[17,43,15]]],
			[[[5,150,120],[1,151,121]],[[9,69,43],[4,70,44]],[[17,50,22],[1,51,23]],[[2,42,14],[19,43,15]]],
			[[[3,141,113],[4,142,114]],[[3,70,44],[11,71,45]],[[17,47,21],[4,48,22]],[[9,39,13],[16,40,14]]],
			[[[3,135,107],[5,136,108]],[[3,67,41],[13,68,42]],[[15,54,24],[5,55,25]],[[15,43,15],[10,44,16]]],
			[[[4,144,116],[4,145,117]],[[17,68,42]],[[17,50,22],[6,51,23]],[[19,46,16],[6,47,17]]],
			[[[2,139,111],[7,140,112]],[[17,74,46]],[[7,54,24],[16,55,25]],[[34,37,13]]],
			[[[4,151,121],[5,152,122]],[[4,75,47],[14,76,48]],[[11,54,24],[14,55,25]],[[16,45,15],[14,46,16]]],
			[[[6,147,117],[4,148,118]],[[6,73,45],[14,74,46]],[[11,54,24],[16,55,25]],[[30,46,16],[2,47,17]]],
			[[[8,132,106],[4,133,107]],[[8,75,47],[13,76,48]],[[7,54,24],[22,55,25]],[[22,45,15],[13,46,16]]],
			[[[10,142,114],[2,143,115]],[[19,74,46],[4,75,47]],[[28,50,22],[6,51,23]],[[33,46,16],[4,47,17]]],
			[[[8,152,122],[4,153,123]],[[22,73,45],[3,74,46]],[[8,53,23],[26,54,24]],[[12,45,15],[28,46,16]]],
			[[[3,147,117],[10,148,118]],[[3,73,45],[23,74,46]],[[4,54,24],[31,55,25]],[[11,45,15],[31,46,16]]],
			[[[7,146,116],[7,147,117]],[[21,73,45],[7,74,46]],[[1,53,23],[37,54,24]],[[19,45,15],[26,46,16]]],
			[[[5,145,115],[10,146,116]],[[19,75,47],[10,76,48]],[[15,54,24],[25,55,25]],[[23,45,15],[25,46,16]]],
			[[[13,145,115],[3,146,116]],[[2,74,46],[29,75,47]],[[42,54,24],[1,55,25]],[[23,45,15],[28,46,16]]],
			[[[17,145,115]],[[10,74,46],[23,75,47]],[[10,54,24],[35,55,25]],[[19,45,15],[35,46,16]]],
			[[[17,145,115],[1,146,116]],[[14,74,46],[21,75,47]],[[29,54,24],[19,55,25]],[[11,45,15],[46,46,16]]],
			[[[13,145,115],[6,146,116]],[[14,74,46],[23,75,47]],[[44,54,24],[7,55,25]],[[59,46,16],[1,47,17]]],
			[[[12,151,121],[7,152,122]],[[12,75,47],[26,76,48]],[[39,54,24],[14,55,25]],[[22,45,15],[41,46,16]]],
			[[[6,151,121],[14,152,122]],[[6,75,47],[34,76,48]],[[46,54,24],[10,55,25]],[[2,45,15],[64,46,16]]],
			[[[17,152,122],[4,153,123]],[[29,74,46],[14,75,47]],[[49,54,24],[10,55,25]],[[24,45,15],[46,46,16]]],
			[[[4,152,122],[18,153,123]],[[13,74,46],[32,75,47]],[[48,54,24],[14,55,25]],[[42,45,15],[32,46,16]]],
			[[[20,147,117],[4,148,118]],[[40,75,47],[7,76,48]],[[43,54,24],[22,55,25]],[[10,45,15],[67,46,16]]],
			[[[19,148,118],[6,149,119]],[[18,75,47],[31,76,48]],[[34,54,24],[34,55,25]],[[20,45,15],[61,46,16]]],
		],

		// === Galois Field ===
		init_tables: () => {
			var exp = new Uint8Array(512);
			var log = new Uint8Array(256);

			var x = 1;
			for (var i = 0; i < 255; i++) {
				exp[i] = x;
				log[x] = i;
				
				x <<= 1; 
				if (x & 0x100) { x ^= _qd.prim; }
			}

			for (var i = 255; i < 512; i++) { exp[i] = exp[i-255]; }

			_qd.exp = exp;
			_qd.log = log;
		},

		add: (x, y) => x^y,
		sub: (x, y) => x^y,

		mul: (x, y) => {
			if ( !x || !y ) { return 0; } 
			return _qd.exp[_qd.log[x] + _qd.log[y]];
		},

		div: (x, y) => {
			if (y === 0) { throw new Error("Divided by zero!"); }
			if (x === 0) { return 0; }
			return _qd.exp[mod(_qd.log[x] + 255 - _qd.log[y],255)];
		},

		pow: (x, power) => _qd.exp[mod(_qd.log[x] * power,255)],
		inverse: (x) => _qd.exp[255 - _qd.log[x]],
		
		// === Poly functions ===
		poly_scale: (p, x) => p.map(u => _qd.mul(u, x)),
		
		// TODO(rhermes): Shorten this?
		poly_add: (p, q) => {
			const pl = p.length;
			const ql = q.length;
			const rl = Math.max(pl,ql);

			var r = new Uint8Array(rl);
			p.forEach((u,i) => r[i+rl-pl] = u);
			q.forEach((u,i) => r[i+rl-ql] ^= u);

			return r;
		},

		poly_mul: (p, q) => {
			const pl = p.length;
			const ql = q.length;
			var r = new Uint8Array(pl+ql-1);
			for (var j = 0; j < ql; j++)
				for (var i = 0; i < pl; i++)
					r[i+j] ^= _qd.mul(p[i],q[j])

			return r;
		},

		poly_eval: (p, x) => p.reduce((a,u) => _qd.mul(a,x) ^ u),

		// === Reed-solomon encode ===
		generator_poly: (nsym) => {
			var g = [1];
			for (var i = 0; i < nsym; i++) {
				g = _qd.poly_mul(g, [1, _qd.pow(2,i)]);
			}
			return g;
		},

		encode_msg: (msg_in, nsym) => {
			const mil = msg_in.length;
			if ((mil + nsym) > 255)
				throw new Error("Message to long!");

			var gen = _qd.generator_poly(nsym);
			var msg_out = new Uint8Array(mil + gen.length - 1);

			msg_out.set(msg_in);

			for (var i = 0; i < mil; i++) {
				const coef = msg_out[i];
				if (coef !== 0)
					for (var j = 1; j < gen.length; j++)
						msg_out[i+j] ^= _qd.mul(gen[j], coef);
			}
			msg_out.set(msg_in);

			return msg_out;
		},

		// === Reed-Solomon decode ===
		calc_syndromes: (msg, nsym) => {
			var synd = new Uint8Array(nsym+1);
			for (var i = 0; i < nsym; i++) {
				synd[i+1] = _qd.poly_eval(msg, _qd.pow(2,i));
			}
			return synd;
		},

		find_errata_locator: (e_pos) => e_pos.reduce(
				(a,u) => _qd.poly_mul(a,_qd.poly_add([1],[_qd.pow(2,u), 0])), [1]
		),

		find_error_evaluator: (synd, err_loc, nsym) => _qd.poly_mul(synd, err_loc).slice(-(nsym+1)),

		correct_errata: (msg_in, synd, err_pos) => {
			var coef_pos = err_pos.map(u => msg_in.length - 1 - u);
			var err_loc = _qd.find_errata_locator(coef_pos);

			var err_eval = _qd.find_error_evaluator(
				synd.slice().reverse(), err_loc, err_loc.length-1
			).reverse();

			
			var X = coef_pos.map(u => _qd.pow(2,u - 255));

			var E = new Uint8Array(msg_in.length);
			const Xl = X.length;

			for (var i = 0; i < Xl; i++) {
				const Xi = X[i];
				const Xi_inv = _qd.inverse(Xi);

				var err_loc_prime_tmp = [];
				for (var j = 0; j < Xl; j++)
					if (j !== i)
						err_loc_prime_tmp.push(_qd.sub(1, _qd.mul(Xi_inv, X[j])));


				const err_loc_prime = err_loc_prime_tmp.reduce(_qd.mul, 1);

				var y = _qd.poly_eval(err_eval.slice().reverse(), Xi_inv);
				y = _qd.mul(_qd.pow(Xi, 1), y);

				E[err_pos[i]] = _qd.div(y, err_loc_prime);
			}

			return _qd.poly_add(msg_in, E);
		},

		check: (msg, nsym) => Math.max(..._qd.calc_syndromes(msg, nsym)) === 0,

		// === QR READER ===
		
		str_to_arr: (qr_str) => {
			// _qd just converts from QR str, to an array. Since the font is
			// 2 cells tall and 1 cell long, we must work on two arrays at the
			// same time.

			// we apply colorstrop here, to make sure we don't get any extra characters.
			var qr = [];
			for (var line of qr_str.replace(/`[A-Za-z0-9](.)`/g, "$1").split('\n')) {
				// High and low band.
				var hb = [];
				var lb = [];
				var f = (h,l) => {hb.push(h); lb.push(l)}
				
				// Convert each of the strs to numbers.
				for (var c of line) {
					switch (c) {
						case " ":	f(0,0);	break;
						case "▀": f(1,0); break;
						case "▄":	f(0,1);	break;
						case "█": f(1,1);	break;
						default: f(-1,-1); break;
					}
				}
				// Add them to the collection.
				qr.push(hb, lb);
			}
			qr.pop();

			// Just a quick check to see if the QR is square or not.
			if (qr.length !== qr[0].length) {
				throw new Error("Not square QR! " + qr.length + " vs " + qr[0].length);
			}

			return qr;
		},

		// Returns QR version. _qd is calculated from the fact that version 1 is 21x21
		// and they increase by 4 modules on each side per version.
		version: (qr) => (qr.length - 17) / 4,	
		
		
		// === QR INFO FORMAT ===
		check_format: (fmt) => {
			for (var i = 4; i > -1; i--)
				if (fmt & (1 << (i+10)))
					fmt ^= 0x537 << i;

			return fmt;
		},

		hamming_weight: (x) => {
			var w = 0;
			while (x > 0) {
				w += x & 1;
				x >>= 1;
			}
			return w;
		},

		err_check_format: (fmt) => {
			var best_fmt = -1;
			var best_dist = 15;
			for (var test_fmt = 0; test_fmt < 32; test_fmt++) {
				var test_code = (test_fmt<<10) ^ _qd.check_format(test_fmt<<10)
				var test_dist = _qd.hamming_weight(fmt ^ test_code)
				if (test_dist < best_dist) {
					best_dist = test_dist;
					best_fmt = test_fmt;
				} else if (test_dist === best_dist) {
					best_fmt = -1
				}
			}

			return best_fmt;
		},

		format_information: (qr) => {
			var sz = qr.length;
			var qr_t = qr[0].map((x,i) => qr.map(x => x[i]));
			
			// Gather the two codes.
			var raw_format_1 = [].concat(qr[8].slice(0,6), qr[8].slice(7,9), qr_t[8][7], qr_t[8].slice(0,6).reverse());
			var raw_format_2 = [].concat(qr_t[8].slice(sz-7,sz).reverse(), qr[8].slice(sz-8,sz));

			var f_raw_format = [];

			// Since we do error correction here, we remove the -1 here, so that it becomes true or false.
			for (var i = 0; i < raw_format_1.length; i++) {
				if (raw_format_1[i] !== -1) {
					f_raw_format.push(raw_format_1[i]);
				} else if (raw_format_2[i] !== -1) {
					f_raw_format.push(raw_format_2[i]);
				} else {
					f_raw_format.push(0);
				}
			}
		
			const format_mask = 0x5412;

			var fmt = _qd.err_check_format(f_raw_format.reduce((a,c,i) => a |= c << (14-i), 0) ^ format_mask);
			
			if (fmt == -1) {
				throw new Error("Too corrupt QR, could not read format!");
			}

			// Return the err_level and the mask.
			return ["MLHQ"[fmt>>3], fmt & 7];
		},

		// Generates an array of the same shape as the QR, but it's only 0 and 1.
		// It denotes the areas of the QR code that we can access and which we cannot.
		access_mask: (qr) => {
			var sz = qr.length;
			var ver = _qd.version(qr);

			// Create the map itself.
			var mask = qr.map(u => u.map(v => 1));

			// IMPROVE(rhermes): These loops all have the same structure, I could optimize
			// _qd to use less space.
			// First off we mark of the 3 corners. The upper left one is the easiest.
			for (var i = 0; i < 9; i++) {
				for (var j = 0; j < 9; j++) {
					mask[i][j] = 0;
				}
			}

			// Next up is the lower left corner and the one in the top right.
			// we can do both in one loop, as they are just each other transposed.
			for (var i = sz-8; i < sz; i++) {
				for (var j = 0; j < 9; j++) {
					mask[i][j] = 0;
					mask[j][i] = 0;
				}
			}

			// Next we add the timing lines. _qd is easy as span entire rows and columns.
			for (var i = 0; i < sz; i++) {
				mask[6][i] = 0;
				mask[i][6] = 0;
			}


			// Now for the aligment pattern. We map _qd a little differently.
			// If it's only one element we just pass it on. if there are more though,
			// we create a grid, and then we just remove the three at the 3 corners.
			var pattern_centers = [];

			var a_pts = _qd.alignment_patterns[ver];

			if (a_pts.length === 1) {
				pattern_centers = [[a_pts[0], a_pts[0]]];
			} else {
				var fst = a_pts[0];
				var lst = a_pts[a_pts.length-1];
				for (var i of a_pts) {
					for (var j of a_pts) {
						// Remove the 3 corners.
						if ((i == fst && j == fst) || (i == fst && j == lst) || (i == lst && j == fst)) {
							continue;
						}
						pattern_centers.push([i,j]);
					}
				}
			}

			// Now we just mark the 5x5 area around that center as 0.
			for (var [ci, cj] of pattern_centers) {
				for (var i = ci-2; i < ci+3; i++) {
					for (var j = cj-2; j < cj+3; j++) {
						mask[i][j] = 0;
					}
				}
			}

			// Last thing is that if the qr code is version 7 or higher there
			// is also version information. These stay the same, so it's no problem.
			if (ver > 6) {
				// We generate both at the same time, as they are just transposed.
				for (var i = 0; i < 6; i++) {
					for (var j = sz-11; j < sz-8; j++) {
						mask[i][j] = 0;
						mask[j][i] = 0;
					}
				}
			}

			return mask;
		},

		read_raw_data: (qr) => {
			var sz = qr.length;
			var ver = _qd.version(qr);
			var access_mask = _qd.access_mask(qr);

			var [err_level, mask] = _qd.format_information(qr);
			var pattern_mask = _qd.masks[mask];

			// Now that we have all the neccecary ingredients, we are going to start
			// zigging and zagging.

			var bytes = [];

			var i = sz-1, j = sz-1, up = 1, back = 0, c_byte = [];

			while (j >= 0) {
				if (access_mask[i][j]) {
					// if it's -1, then we just insert that.
					if (qr[i][j] === -1) {
						c_byte.push(-1);
					} else {
						c_byte.push(!qr[i][j] ^ !pattern_mask(i,j));
					}
				}

			
				if (c_byte.length === 8) {
					bytes.push(c_byte);
					c_byte = [];
				}

				// Now we check if we are either on the top or of the bottom, going up or down.

			
				if (back && ((i === 0 && up) || (i === sz-1) && !up)) {
					// We have hit the top and are trying to go up
					
					// move one towards left side.
					j--;

					// special case. if the tile we now are on is on the timing mark, we move
					// one more to the left. _qd is common amongst all the layouts. _qd is
					// a hack, and I know it, but it works.
					if (j === 6) {
						j--;
					}

					// Set back and up to 0
					up = !up;
					back = 0;
				} else {
					// We just move according to the normal laws.

					// are we moving back or not.
					if (back) {
						j++;

						// We only move down or up when we also move back.
						if (up) {
							i--;
						} else {
							i++;
						}
					} else {
						j--;
					}

					// toggle back.
					back = !back;
				}
			}
			return bytes;
		},

		deinterleave: (qr) => {
			var [err_level, mask] = _qd.format_information(qr);
			var rd = _qd.read_raw_data(qr);

			// Construct the blocks arrray.
			var bb = _qd.rs_block_sizes[_qd.version(qr)];

			var blocks_info;
			switch (err_level) {
				case "L":
					blocks_info = bb[0];
					break;
				case "M":
					blocks_info = bb[1];
					break;
				case "Q":
					blocks_info = bb[2];
					break;
				case "H":
					blocks_info = bb[3];
					break;
			}
			
			var blocks = [];
			var b_limit = 0;
			for (var [c,n,k] of blocks_info) {
				
				for (var i = 0; i < c; i++) {
					blocks.push({d: [], e: [], n: n, k: k});
					b_limit += k;
				}	
			}		

			// The data codepoint counter.
			var b_cntr = 0;

			// Just a coutner to iterate around,.
			var cnt = 0;
			for (var cb of rd) {
				while(1) {
					var blk = blocks[cnt % blocks.length];

					cnt++;

					// check if we have space.
					if (b_cntr < b_limit) {
						// IF we are still in data points land
						if (blk.d.length < blk.k) {
							blk.d.push(cb);
							b_cntr++;
							break;
						}
					} else {
						// We are in error code terotory.
						if (blk.e.length >= (blk.n-blk.k)) {
							throw new Error("OVERFLOW?");
						} else {
							blk.e.push(cb);
							b_cntr++;
							break;
						}
					}
				}
			}

			return blocks;
		},

		// _qd is the function that return the array as a byte stream to us.
		get_byte_stream: (qr) => {
			var blocks = _qd.deinterleave(qr);

			var byte_stream = [];

			for (var block of blocks) {
				// The error handling happens on a block by block basis.
				
				// These are the error_positions.
				var err_pos = [];
				var msg = [];
				var i = 0;
				for (var bit_group of block.d.concat(block.e)) {
					if (bit_group.indexOf(-1) > -1) {
						msg.push(0);
						err_pos.push(i);
					} else {
						// convert to byte.
						msg.push(bit_group.reduce((a,c,l) => a |= c << (7-l),0));
					}
					i++;
				}


				// Now we have the message and the error locations.
				if (err_pos.length !== 0) {
					var synd = _qd.calc_syndromes(msg, block.n-block.k);
					var ecc_msg = _qd.correct_errata(msg, synd, err_pos);
					byte_stream =	byte_stream.concat(Array.from(ecc_msg.slice(0,block.k)));
				} else {
					byte_stream = byte_stream.concat(msg.slice(0,block.k));
				}
			}
			return byte_stream;

		},
		// TODO(rhermes): provide a method that corrects, given that the error
		// locations are known.

		// === Public functions ===
		get_data: (qr) => {
			var stream = _qd.get_byte_stream(qr);

			var buf = new Uint8Array(stream.length+1);
			var bs = crBitStream(buf);

			var bits_left = 0;
			for (var bt of stream) {
				bs.writeBits(8, bt);
				bits_left += 8;
			}
			bs.seekTo(0);

			var mode = "";
			var size_idx = 0;
			if (_qd.version(qr) > 9) {
				size_idx = 1;
			}
			if (_qd.version(qr) > 26) {
				size_idx = 2;
			}
		
			var payloads = [];
			do {
				if (bits_left < 4) {
					mode = _qd.modes.TERMINATOR;
				} else {
					mode = bs.readBits(4);
					bits_left -= 4;
				}

				switch (mode) {
					case _qd.modes.TERMINATOR:
						break;

					case _qd.modes.BYTE:
						const vlen = _qd.modes_length[mode][size_idx];

						const sz = bs.readBits(vlen);
						bits_left -= vlen;


						var payload = new Uint8Array(sz);
						for (var i = 0; i < sz; i++) {
							payload[i] = bs.readBits(8);
						}
						bits_left -= 8*sz;

						payloads.push(String.fromCharCode(...payload))
						break;

					default:
						throw new Error("Mode is not implemented: " + mode);
				}

			} while (mode !== _qd.modes.TERMINATOR);
			return payloads;
		}
	}
	_qd.init_tables();
	return _qd;
}