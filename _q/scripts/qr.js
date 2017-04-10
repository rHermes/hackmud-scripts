function(ctx, a) {
	// SOURCE OF INFORMATION:
	// - https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders
	// - http://web.archive.org/web/20160919092634/http://blog.qartis.com/decoding-small-qr-codes-by-hand

	// TODO(rhermes): Figure out if the aligment patters and rs_block_size is not
	// better stored in the DB, they don't take up time during parsing.

	// TODO(rhermes): Create lite version, made for small code size, so that it can be
	// included and parsed quick.

	// TODO(rhermes): Add repeating reads of blocks, so that we are standard compliant :)
	// look at zxing for advice here.

	// TODO(rhermes): Reimplement with classes.

	// TODO(rhermes): Actually understand how the error decoding works, other than the mild outline.

	// TODO(rhermes): Unrealated, write TODO app and BIGNUM library.

	// TODO(rhermes): fix color coding here.

	const re_color_strip = /`[a-zA-Z]([^`]*?)`/g;

	// IMPORTANT TO REMEMBER THAT (X,Y) is written as qr[Y][X]. This is
	// due to the way the array is stored in memory.
	var transpose = m => m[0].map((x,i) => m.map(x => x[i]));

	// Utility function, since I use the same code multiple places.
	var timeF = f => {
		var starttime = Date.now();
		var ret = f();
		return [ret, Date.now()-starttime];
	}

	// Taken straight from here:
	// https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders/Additional_information#Universal_Reed-Solomon_Codec
	// Limited to max c_exp=16
	var gf = #s._q.galoi();

	// Here we init the tables.
	gf.init_tables();
	
	var rs = {
		// TODO(rhermes): Redo this so G is only allocated once.
		generator_poly: function(nsym, fcr=0, generator=2) {
			var g = [1];
			for (var i = 0; i < nsym; i++) {
				g = gf.poly_mul(g, [1, gf.pow(generator, i+fcr)]);
			}
			return g;
		},

		generator_poly_all: function(max_nsym, fcr=0, generator=2) {
			var g_all = new Array(max_nsym);
			for (var nsym = 0; nsym < max_nsym; nsym++) {
				g_all[nsym] = rs.generator_poly(nsym, fcr, generator);
			}
			return g_all;
		},

		// I have inlined the polynomial division here.
		encode_msg: function(msg_in, nsym, fcr=0, generator=2, gen=null) {
			if ((msg_in.length + nsym) > gf.field_charac) {
				throw new Error("Message is too long!");
			}

			if (gen === null) {
				gen = rs.generator_poly(nsym, fcr, generator);
			}
			
			var msg_out = new Uint32Array(msg_in.length + gen.length - 1);
			msg_out.set(msg_in);

			for (var i = 0; i < msg_in.length; i++) {
				var coef = msg_out[i];
				if (coef !== 0) {
					for (var j = 1; j < gen.length; j++) {
						msg_out[i + j] ^= gf.mul(gen[j], coef);
					}
				}
			}

			msg_out.set(msg_in);
			
			return msg_out;
		},

		// === DECODING ===

		calc_syndromes: function(msg, nsym, fcr=0, generator=2) {
			var synd = new Uint32Array(nsym);
			for (var i = 0; i < nsym; i++) {
				synd[i] = gf.poly_eval(msg, gf.pow(generator,i+fcr));
			}
			return Uint32Array.of(0, ...synd);
		},

		find_errata_locator: function(e_pos, generator=2) {
			var e_loc = [1];
			for (var i of e_pos) {
				e_loc = gf.poly_mul(e_loc, gf.poly_add([1], [gf.pow(generator, i), 0]));
			}
			return e_loc;
		},

		// TODO(rhermes): Here there are faster way.
		find_error_evaluator: function(synd, err_loc, nsym) {
			var [_, remainder] = gf.poly_div(gf.poly_mul(synd, err_loc), ([1].concat(new Uint8Array(nsym+1))))

			return remainder;
		},

		correct_errata: function(msg_in, synd, err_pos, fcr=0, generator=2) {
			var coef_pos = err_pos.map(u => msg_in.length - 1 - u);
			var err_loc = rs.find_errata_locator(coef_pos, generator);
			var err_eval = rs.find_error_evaluator(synd.slice().reverse(), err_loc, err_loc.length-1).reverse();

			var X = [];
			for (var i = 0; i < coef_pos.length; i++) {
				var l = gf.field_charac - coef_pos[i];
				X.push(gf.pow(generator,-l));
			}

			var E = new Array(msg_in.length);
			E.fill(0);
			var Xlength = X.length;

			for (var i = 0; i < X.length; i++) {
				var Xi = X[i];

				var Xi_inv = gf.inverse(Xi);

				var err_loc_prime_tmp = [];
				for (var j = 0; j < Xlength; j++) {
					if (j !== i) {
						err_loc_prime_tmp.push(gf.sub(1, gf.mul(Xi_inv, X[j])));
					}
				}

				var err_loc_prime = err_loc_prime_tmp.reduce(gf.mul, 1);

				var y = gf.poly_eval(err_eval.slice().reverse(), Xi_inv);
				y = gf.mul(gf.pow(Xi, 1-fcr), y);

				var magnitude = gf.div(y, err_loc_prime);
				E[err_pos[i]] = magnitude;
			}

			msg_in = gf.poly_add(msg_in, E);

			return msg_in;
		},

		find_error_locator: function(synd, nsym, erase_loc=null, erase_count=0) {
			var err_loc;
			var old_loc;
			if (erase_loc) {
				err_loc = [].concat(erase_loc);
				old_loc = [].concat(erase_loc);
			} else {
				err_loc = [1];
				old_loc = [1];
			}

			var synd_shift = Math.max(0, synd.length - nsym);

			for (var i = 0; i < (nsym - erase_count); i++) {
				var K;
				if (erase_loc) {
					K = erase_count+i+synd_shift;
				} else {
					K = i+synd_shift;
				}

				var delta = synd[K];
				for (var j = 1; j < err_loc.length; j++) {
					delta ^= gf.mul(err_loc[err_loc.length-(j+1)], synd[K-j]);
					// Debug line?
				}

				old_loc = old_loc.concat(0);

				if (delta !== 0) {
					if (old_loc.length > err_loc.length) {
						var new_loc = gf.poly_scale(old_loc, delta);
						old_loc = gf.poly_scale(err_loc, gf.inverse(delta));
						err_loc = new_loc;
					}

					err_loc = gf.poly_add(err_loc, gf.poly_scale(old_loc, delta));
				}
			}

			while (err_loc.length && err_loc[0] === 0) {
				err_loc.shift();
			}

			var errs = err_loc.length - 1;
			if ((errs-erase_count) * 2 + erase_count > nsym) {
				throw new Error("Too many errors to correct!");
			}

			return err_loc;
		},

		find_errors: function(err_loc, nmess, generator=2) {
			// nmess = msg_in.length
			var errs = err_loc.length - 1;
			var err_pos = [];
			for (var i = 0; i < nmess; i++) {
				if (gf.poly_eval(err_loc, gf.pow(generator, i)) === 0) {
					err_pos.append(nmess - 1 - j);
				}
			}

			if (err_pos.length !== errs) {
				throw new Error("Too many (or to few) errors found by Chien Search for the errata locator polynomial!");
			}	
			
			return err_pos;
		},

		forney_syndromes: function(synd, pos, nmess, generator=2) {
			var erase_pos_reversed = pos.map(p => nmess-1-p);

			var fsynd = synd.slice(1);
			for (var i = 0; i < pos.length; i++) {
				var x = gf.pow(generator, erase_pos_reversed[i]);
				for (var j = 0; j < fsynd.length - 1; j++) {
					fsynd[j] = gf.mul(fsynd[j], x) ^fsynd[j + 1];
				}
			}

			return fsynd;
		},

		correct_msg: function(msg_in, nsym, fcr=0, generator=2, erase_pos=null, only_erasure=false) {
			if (msg_in.length > gf.field_charac) {
				throw new Error("Your message is too big");
			}

			var msg_out = msg_in.slice();

			if (erase_pos === null) {
				erase_pos = [];
			} else {
				for (var e_pos of erase_pos) {
					msg_out[e_pos] = 0;
				}
			}

			if (erase_pos.length > nsym) {
				throw new Error("Too many erasures to correct!");
			}

			var synd = rs.calc_syndromes(msg_out, nsym, fcr, generator);

			if (Math.max(...synd) === 0) {
				return [msg_out.slice(0,-nsym), msg_out.slice(-nsym)];
			}

			if (only_erasure) {
				err_pos = [];
			} else {
				var fsynd = rs.forney_syndromes(synd, erase_pos, msg_out.length, generator);
				// Here the erase_loc should really be implicit, but since I can't do that, I'll make it
				// explicit.
				var err_loc = rs.find_error_locator(fsynd, nsym, null, erase_pos.length);

				err_pos = rs.find_errors(err_loc.slice().reverse(), msg_out.length, generator);
				if (err_pos === null) {
					throw new Error("Could not locate error");
				}
			}

			msg_out = rs.correct_errata(msg_out, synd, erase_pos.concat(err_pos), fcr, generator);

			synd = rs.calc_syndromes(msg_out, nsym, fcr, generator);
			if (Math.max(...synd) > 0) {
				throw new Error("Could not correct message!");
			}

			return [msg_out.slice(0,-nsym), msg_out.slice(-nsym)];
		},


		check: function(msg, nsym, fcr=0, generator=2) {
			return Math.max(...rs.calc_syndromes(msg, nsym, fcr, generator)) === 0;
		}
	};



	// Test out decode.
	var msg_in = new Uint32Array([ 0x40, 0xD2, 0x75, 0x47, 0x76, 0x17, 0x32, 0x06,0x27, 0x26, 0x96, 0xc6, 0xc6, 0x96, 0x70, 0xec ]);

	var msg = rs.encode_msg(msg_in, 10);

	//return rs.check(msg, 10);

	//return Array.from(msg).map(u => u.toString(16)).join(' ');


	// In this list the functions which isn't prone to errors when there is corruption is listed first.
	var ret = {
		// IMage of this: https://upload.wikimedia.org/wikipedia/commons/c/c8/QR_Code_Mask_Patterns.svg
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

		// Taken from here: https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders/Additional_information#Alignment_pattern
		alignment_pattern: [
			[],[], 					// 0 & 1. Just here to pad so 2 is the first.
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
		rs_block_size: [
			[[],[],[],[]],[[],[],[],[]], 					// 0 & 1. Just here to pad, so that version 2 comes first.
			[[[1,44,34]],[[1,44,28]],[[1,44,22]],[[1,44,16]]],
			[[[1,70,55]],[[1,70,44]],[[2,35,17]],[[2,35,13]]],
			[[[1,100,80]],[[2,50,32]],[[2,50,24]],[[4,25,9]]],
			[[[1,134,108]],[[2,67,43]],[[2,33,15], [2,34,16]],[[2,33,11], [2,34,12]]],
			[[[2,86,68]],[[4,43,27]],[[4,43,19]],[[4,43,15]]],
			[[[2,98,78]],[[4,49,31]],[[2,32,14], [4,33,15]],[[4,39,13], [1,40,14]]],
			[[[2,121,97]],[[2,60,38], [2,61,39]],[[4,40,18], [2,41,19]],[[4,40,14], [2,41,15]]],
			[[[2,146,116]],[[3,58,36], [2,59,37]],[[4,36,16], [4,37,17]],[[4,36,12], [4,37,13]]],
			[[[2,86,68], [2,87,69]],[[4,69,43], [1,70,44]],[[6,43,19], [2,44,20]],[[6,43,15], [2,44,16]]],
			[[[4,101,81]],[[1,80,50], [4,81,51]],[[4,50,22], [4,51,23]],[[3,36,12], [8,37,13]]],
			[[[2,116,92], [2,117,93]],[[6,58,36], [2,59,37]],[[4,46,20], [6,47,21]],[[7,42,14], [4,43,15]]],
			[[[4,133,107]],[[8,59,37], [1,60,38]],[[8,44,20], [4,45,21]],[[12,33,11], [4,34,12]]],
			[[[3,145,115], [1,146,116]],[[4,64,40], [5,65,41]],[[11,36,16], [5,37,17]],[[11,36,12], [5,37,13]]],
			[[[5,109,87], [1,110,88]],[[5,65,41], [5,66,42]],[[5,54,24], [7,55,25]],[[11,36,12], [7,37,13]]],
			[[[5,122,98], [1,123,99]],[[7,73,45], [3,74,46]],[[15,43,19], [2,44,20]],[[3,45,15], [13,46,16]]],
			[[[1,135,107], [5,136,108]],[[10,74,46], [1,75,47]],[[1,50,22], [15,51,23]],[[2,42,14], [17,43,15]]],
			[[[5,150,120], [1,151,121]],[[9,69,43], [4,70,44]],[[17,50,22], [1,51,23]],[[2,42,14], [19,43,15]]],
			[[[3,141,113], [4,142,114]],[[3,70,44], [11,71,45]],[[17,47,21], [4,48,22]],[[9,39,13], [16,40,14]]],
			[[[3,135,107], [5,136,108]],[[3,67,41], [13,68,42]],[[15,54,24], [5,55,25]],[[15,43,15], [10,44,16]]],
			[[[4,144,116], [4,145,117]],[[17,68,42]],[[17,50,22], [6,51,23]],[[19,46,16], [6,47,17]]],
			[[[2,139,111], [7,140,112]],[[17,74,46]],[[7,54,24], [16,55,25]],[[34,37,13]]],
			[[[4,151,121], [5,152,122]],[[4,75,47], [14,76,48]],[[11,54,24], [14,55,25]],[[16,45,15], [14,46,16]]],
			[[[6,147,117], [4,148,118]],[[6,73,45], [14,74,46]],[[11,54,24], [16,55,25]],[[30,46,16], [2,47,17]]],
			[[[8,132,106], [4,133,107]],[[8,75,47], [13,76,48]],[[7,54,24], [22,55,25]],[[22,45,15], [13,46,16]]],
			[[[10,142,114], [2,143,115]],[[19,74,46], [4,75,47]],[[28,50,22], [6,51,23]],[[33,46,16], [4,47,17]]],
			[[[8,152,122], [4,153,123]],[[22,73,45], [3,74,46]],[[8,53,23], [26,54,24]],[[12,45,15], [28,46,16]]],
			[[[3,147,117], [10,148,118]],[[3,73,45], [23,74,46]],[[4,54,24], [31,55,25]],[[11,45,15], [31,46,16]]],
			[[[7,146,116], [7,147,117]],[[21,73,45], [7,74,46]],[[1,53,23], [37,54,24]],[[19,45,15], [26,46,16]]],
			[[[5,145,115], [10,146,116]],[[19,75,47], [10,76,48]],[[15,54,24], [25,55,25]],[[23,45,15], [25,46,16]]],
			[[[13,145,115], [3,146,116]],[[2,74,46], [29,75,47]],[[42,54,24], [1,55,25]],[[23,45,15], [28,46,16]]],
			[[[17,145,115]],[[10,74,46], [23,75,47]],[[10,54,24], [35,55,25]],[[19,45,15], [35,46,16]]],
			[[[17,145,115], [1,146,116]],[[14,74,46], [21,75,47]],[[29,54,24], [19,55,25]],[[11,45,15], [46,46,16]]],
			[[[13,145,115], [6,146,116]],[[14,74,46], [23,75,47]],[[44,54,24], [7,55,25]],[[59,46,16], [1,47,17]]],
			[[[12,151,121], [7,152,122]],[[12,75,47], [26,76,48]],[[39,54,24], [14,55,25]],[[22,45,15], [41,46,16]]],
			[[[6,151,121], [14,152,122]],[[6,75,47], [34,76,48]],[[46,54,24], [10,55,25]],[[2,45,15], [64,46,16]]],
			[[[17,152,122], [4,153,123]],[[29,74,46], [14,75,47]],[[49,54,24], [10,55,25]],[[24,45,15], [46,46,16]]],
			[[[4,152,122], [18,153,123]],[[13,74,46], [32,75,47]],[[48,54,24], [14,55,25]],[[42,45,15], [32,46,16]]],
			[[[20,147,117], [4,148,118]],[[40,75,47], [7,76,48]],[[43,54,24], [22,55,25]],[[10,45,15], [67,46,16]]],
			[[[19,148,118], [6,149,119]],[[18,75,47], [31,76,48]],[[34,54,24], [34,55,25]],[[20,45,15], [61,46,16]]],
		],

		// Returns QR version. This is calculated from the fact that version 1 is 21x21
		// and they increase by 4 modules on each side per version.
		version: function(qr) {
			return (qr.length - 17) / 4;	
		},

		// Generates an array of the same shape as the QR, but it's only 0 and 1.
		// It denotes the areas of the QR code that we can access and which we cannot.
		data_mask: function(qr) {
			var sz = qr.length;
			var ver = ret.version(qr);

			// Create the map itself.
			var mask = qr.map(u => u.map(v => 1));

			// IMPROVE(rhermes): These loops all have the same structure, I could optimize
			// this to use less space.
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

			// Next we add the timing lines. This is easy as span entire rows and columns.
			for (var i = 0; i < sz; i++) {
				mask[6][i] = 0;
				mask[i][6] = 0;
			}


			// Now for the aligment pattern. We map this a little differently.
			// If it's only one element we just pass it on. if there are more though,
			// we create a grid, and then we just remove the three at the 3 corners.
			var pattern_centers = [];

			var a_pts = ret.alignment_pattern[ver];

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

		str_to_arr: function(qr_str) {
			// This just converts from QR str, to an array. Since the font is
			// 2 cells tall and 1 cell long, we must work on two arrays at the
			// same time.

			// we apply colorstrop here, to make sure we don't get any extra characters.
			var qr = [];
			for (var line of qr_str.replace(re_color_strip, "$1").split('\n')) {
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
						default: f(1,1); break;
					}
				}
				// Add them to the collection.
				qr.push(hb, lb);
			}

			// if the width of the project is not even, then the last band will not
			// really be there. We cut it off in these cases.
			qr.pop();

			// Just a quick check to see if the QR is square or not.
			if (qr.length !== qr[0].length) {
				throw new Error("Not square QR! " + qr.length + " vs " + qr[0].length);
			}

			return qr;
		},

		// THis is all used for BCH codes.
		check_format: function(fmt) {
			var g = 0x537;
			for (var i = 4; i > -1; i--) {
				if (fmt & (1 << (i+10))) {
					fmt ^= g << i;
				}
			}
			return fmt;
		},

		hamming_weight: function(x) {
			var w = 0;
			while (x > 0) {
				w += x & 1;
				x >>= 1;
			}
			return w;
		},

		err_check_format: function(fmt) {
			var best_fmt = -1;
			var best_dist = 15;
			for (var test_fmt = 0; test_fmt < 32; test_fmt++) {
				var test_code = (test_fmt<<10) ^ ret.check_format(test_fmt<<10)
				var test_dist = ret.hamming_weight(fmt ^ test_code)
				if (test_dist < best_dist) {
					best_dist = test_dist;
					best_fmt = test_fmt;
				} else if (test_dist === best_dist) {
					best_fmt = -1
				}
			}

			return best_fmt;
		},

		// If this returns [], then there was too much corruption or the QR code is not valid.
		format_information: function(qr) {
			var sz = qr.length;
			var qr_t = transpose(qr);
			
			// Gather the two codes.
			var raw_format_1 = [].concat(qr[8].slice(0,6), qr[8].slice(7,9), qr_t[8][7], qr_t[8].slice(0,6).reverse());
			var raw_format_2 = [].concat(qr_t[8].slice(sz-7,sz).reverse(), qr[8].slice(sz-8,sz));
		
			const format_mask = 0x5412;

			// Convert the bit arrays into numbers and err check it.
			var rum1 = ret.err_check_format(raw_format_1.reduce((a,c,i) => a |= c << (14-i), 0) ^ format_mask);
			var rum2 = ret.err_check_format(raw_format_2.reduce((a,c,i) => a |= c << (14-i), 0) ^ format_mask);
			
			var fmt = -1;

			if (rum1 >= 0) {
				fmt = rum1;
			} else if (rum2 >= 0) {
				fmt = rum2;
			} else {
				throw new Error("Too corrupt QR, could not read format!");
			}

			// Return the err_level and the mask.
			return ["MLHQ"[fmt>>3], fmt & 7];
		},

		read_raw_data: function(qr) {
			var sz = qr.length;
			var ver = ret.version(qr);
			var data_mask = ret.data_mask(qr);

			var [err_level, mask] = ret.format_information(qr);
			var pattern_mask = ret.masks[mask];

			// Now that we have all the neccecary ingredients, we are going to start
			// zigging and zagging.

			var bytes = [];

			var i = sz-1, j = sz-1, up = 1, back = 0, c_byte = [];

			while (j >= 0) {
				if (data_mask[i][j]) {
					c_byte.push(!qr[i][j] ^ !pattern_mask(i,j));
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
					// one more to the left. This is common amongst all the layouts. This is
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

		deinterleave: function(qr) {
			var [err_level, mask] = ret.format_information(qr);
			var rd = ret.read_raw_data(qr);


		
			// Construct the blocks arrray.
			var bb = ret.rs_block_size[ret.version(qr)];

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
					// var [n, k] = block_lims[cnt % block_lims.length];
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

		check_qr: function(qr) {
			var blks = ret.deinterleave(qr);

			var orig_msg = [];
			var err_msg = [];

			var nsyms = 0;
			for (var blk of blks) {
				// Convert blk.d to bytes.
				var om = blk.d.map(u => u.reduce((a,c,i) => a |= c << (7-i),0));

				// convert blk.e to bytes.
				var em = blk.e.map(u => u.reduce((a,c,i) => a |= c << (7-i),0));

				orig_msg = orig_msg.concat(om);
				err_msg = err_msg.concat(em);
				nsyms +=  blk.n - blk.k;
			}
			if (nsyms != err_msg.length) {
				throw new Error("WHAT!");
			}
			return rs.check(orig_msg.concat(err_msg), err_msg.length);
			
		},

		get_data_err: function(qr) {
			var blks = ret.deinterleave(qr);

			var orig_msg = [];
			var err_msg = [];

			var nsyms = 0;
			for (var blk of blks) {
				// Convert blk.d to bytes.
				var om = blk.d.map(u => u.reduce((a,c,i) => a |= c << (7-i),0));

				// convert blk.e to bytes.
				var em = blk.e.map(u => u.reduce((a,c,i) => a |= c << (7-i),0));

				orig_msg = orig_msg.concat(om);
				err_msg = err_msg.concat(em);
				nsyms +=  blk.n - blk.k;
			}
			if (nsyms != err_msg.length) {
				throw new Error("WHAT!");
			}

			return [orig_msg, err_msg];			
		},
		// TODO(rhermes): the length part of this is not yet compatible  for version 10 and up.
		// This is as simple as adding an array for each type at the top, this will need to be done.
		read_data: function(qr) {
			var blks = ret.deinterleave(qr);

			var rd = [];

			for (var blk of blks) {
				rd = rd.concat(...blk.d);
			}

			// This is our counter for where we are in the array.
			var cz = 0;

			// Read the first 4 bits to get the type.
			var dtype = rd[0]*8 + rd[1]*4 + rd[2]*2 + rd[3];
			var dlen = 0;

			cz += 4;

			switch (dtype) {
				case 1: // Numeric
					dlen = rd[4]*512 + rd[5]*256 + rd[6]*128 + rd[7]*64 + rd[8]*32 + rd[9]*16 + rd[10]*8 + rd[11]*4 + rd[12]*2 + rd[13];
					cz += 10;
					break;
				case 2: // alpha numeric
					dlen = rd[4]*256 + rd[5]*128 + rd[6]*64 + rd[7]*32 + rd[8]*16 + rd[9]*8 + rd[10]*4 + rd[11]*2 + rd[12];
					cz += 9;
					break;
				case 4: // byte
				case 8: // kanji 
					dlen = rd[4]*128 + rd[5]*64 + rd[6]*32 + rd[7]*16 + rd[8]*8 + rd[9]*4 + rd[10]*2 + rd[11];
					cz += 8;
					break;
				default:
					throw new Error(dtype);
			}

			// now we read the length.
			var data = [];
			var i = 0;
			while (i < dlen*8) {
				switch (dtype) {
					case 4: // byte
					case 8: // kanji 
						data.push(rd[cz]*128 + rd[cz+1]*64 + rd[cz+2]*32 + rd[cz+3]*16 + rd[cz+4]*8 + rd[cz+5]*4 + rd[cz+6]*2 + rd[cz+7]);
						cz += 8;
						i += 8;
						break;

					default:
						throw new Error("UNKNOWN DTYPE!");
				}
			}
			return data;
		},
	};

	function hamming(input1, input2) {
		var diff = 0;
    for (var i = 0; i < input1.length; i++) {
      if (input1[i] != input2[i]) {
        diff = diff + 1;
      }
    }
    return diff;
	}

	var detect_reedsolomon_parameteres = function(message, mesecc_orig, gen_list=[2], c_exp=8) {
		var n = mesecc_orig.length;
		var k = message.length;

		var field_charac = Math.floor(Math.pow(2,c_exp) -1);
		var maxval = Math.max(mesecc_orig);
		if (maxval > field_charac) {
			throw new Erorr("The sepecified field's exponent is wrong");
		}

		var best_match = {
			hscore: -1,
			params: [
				{gen_nb: 0, prim: 0, fcr: 0}
			]
		};

		for (var gen_nb of gen_list) {
			var prim_list = gf.find_prime_polys(gen_nb, c_exp, false, false);
			for ( var prim of prim_list) {
				// Exlude the last to parameters?
				gf.init_tables(prim, gen_nb, c_exp);

				for (var fcr = 0; fcr < field_charac; fcr++) {
					// Shjould i cut nb here too?
					var mesecc = rs.encode_msg(message, n-k, fcr, gen_nb)

					var h = hamming(mesecc, mesecc_orig);

					if (best_match.hscore === -1 || h <= best_match.hscore) {
						if (best_match.hscore === -1 || h < best_match.hscore) {
							best_match.hscore = h;
							best_match.params = [{gen_nb: gen_nb, prim: prim, fcr: fcr}];
						} else if (h == best_match.hscore) {
							best_match.params.push({gen_nb: gen_nb, prim: prim, fcr: fcr})
						}

						if (h === 0) {
							break;
						}
					}
				}
			}
		}

		return best_match;
	}

	function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return hex;
}


	// Load in the qr from the db. We could get this from a command, but this is
  // faster and better.
	var [raw_qrs, load_time] = timeF(() => #db.f({_k: "qr2_dirty"},{}).first().data);
	// Now we need to isolate one QR code to begin with.

	// Strip away missing messages
	var raw_qrs_1 = raw_qrs.replace(/<.*?>\n?/g,"");

	return raw_qrs_1;

	// Split them into invidual qrs.
	var qr_strs = raw_qrs_1.split('\n\n').filter(u => u);

	var arrs = qr_strs.map(u => ret.str_to_arr(u));





	//return "[" + arrs[2].map(u => "[" + u.join(",") + "]").join(",\n") + "]";

	// return qr_strs[0];

	// Create qr_array.
	var [qr_arr, str2arr_time] = timeF(() => ret.str_to_arr(qr_strs[0]));

	var [orig_msg, err_msg] = ret.get_data_err(qr_arr);

	return JSON.stringify([orig_msg, err_msg]);

	var bm = detect_reedsolomon_parameteres(orig_msg, orig_msg.concat(err_msg));
	

	return JSON.stringify(bm);

	var buff = "";
	buff += "ORIG: " + orig_msg.map(u => decimalToHex(u, 2)).join(" ") + "\n";
	buff += "ERR: " + err_msg.map(u => decimalToHex(u, 2)).join(" ") + "\n";
	return buff;
	return JSON.stringify(ret.get_data_err(qr_arr));

	// Now we will read the info out of all of them.
	var times = Date.now();
	return arrs.map(u => String.fromCharCode(...ret.read_data(u))).join("\n");
	return Date.now() - times;
	//return arrs.map(u => ret.format_information(u)).join('\n');
}
