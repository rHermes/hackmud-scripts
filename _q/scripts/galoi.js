function(context, args)
{
	var gf = {
		exp: new Uint32Array(512),
		log: new Uint32Array(256),
		field_charac: 255,

		// TODO(rhermes): make this more javascriptish.
		rhw_primes1: function(n) {
			var sieve = new Array(Math.floor(n/2));
			sieve.fill(true);

			for (var i = 3; i < Math.floor(Math.pow(n,0.5))+1; i += 2) {
				if (sieve[Math.floor(i/2)]) {
					for (var j = Math.floor(i*i/2); j < sieve.length; j += i) {
						sieve[j] = false;
					}
				}
			}

			var ret = [2];
			for (var i = 1; i < Math.floor(n/2); i++) {
				if (sieve[i]) {
					ret.push(2*i+1);
				}
			}

			return ret; 
		},

		mult_noLUT: function(x, y, prim=0, field_charac_full=256, carryless=true) {
			var r = 0;
			while (y > 0) {
				if (y & 1) {
					if (carryless) {
						r ^= x;
					} else {
						r += x;
					}
				}

				y >>= 1;
				x <<= 1;

				if (prim > 0 && (x & field_charac_full)) {
					x ^= prim;
				}
			}
			return r;
		},

		find_prime_polys: function(generator=2, c_exp=8, fast_primes=false, single=false) {
			// Compute the list of prime polynomials for the given generator and galois field characteristic exponent.
			var root_charac = 2;
			var field_charac = Math.floor(Math.pow(root_charac, c_exp) - 1);
			var field_charac_next = Math.floor(Math.pow(root_charac, c_exp+1) - 1);

			var prim_candidates = [];
			if (fast_primes) {
				prim_candidates = gf.rwh_primes1(field_charac_next).filter(u => u > field_charac);
			} else {
				for (var i = field_charac+2; i < field_charac_next; i += root_charac) {
					prim_candidates.push(i);
				}
			}

		


		
			// Start of the main loop.
			var correct_primes = [];
			for (var prim of prim_candidates) {
				var seen = new Array(field_charac+1);
				seen.fill(0);

				var conflict = false;

				var x = 1;
				for (var i = 0; i < field_charac; i++) {
					x = gf.mult_noLUT(x, generator, prim, field_charac+1);
					if (x > field_charac || seen[x]) {
						conflict = true;
						break;
					} else {
						seen[x] = 1;
					}
				}

				if (!conflict) {
					correct_primes.push(prim);
					if (single) {
						return prim;
					}
				}
			}

			return correct_primes;
		},

		init_tables: function(prim=0x11d, generator=2, c_exp=8) {
			gf.field_charac = Math.floor(Math.pow(2,c_exp)-1);
			gf.exp = new Uint32Array(gf.field_charac*2);
			gf.log = new Uint32Array(gf.field_charac+1);
			
			var x = 1;
			for (var i = 0; i < gf.field_charac; i++) {
				gf.exp[i] = x;
				gf.log[x] = i;
				x = gf.mult_noLUT(x, generator, prim, gf.field_charac+1);
			}

	
			for (var i = gf.field_charac; i < gf.field_charac*2; i++) {
				gf.exp[i] = gf.exp[i - gf.field_charac];
			}
			return [gf.log, gf.exp];
		},

		add: function(x,y) {
			return x ^ y;
		},

		sub: function(x,y) {
			return x ^ y;
		},

		neg: function(x) {
			return x;
		},

		mul: function(x, y) {
			if (x === 0 || y === 0) {
				return 0;
			}
			return gf.exp[(gf.log[x] + gf.log[y]) % gf.field_charac]
		},

		div: function(x, y) {
			if (y === 0) {
				throw new Error("DIVISION BY ZERO");
			}
			if (x === 0) {
				return 0;
			}

			return gf.exp[(gf.log[x] + gf.field_charac -gf.log[y]) % gf.field_charac];
		},

		pow: function(x, power) {
			return gf.exp[(gf.log[x] * power) % gf.field_charac];
		},

		inverse: function(x) {
			return gf.exp[gf.field_charac - gf.log[x]];
		},

		//== POLYNOMIAL MATHS ===
		poly_scale: function(p,x) {
			var r = new Uint32Array(p.length);
			for (var i = 0; i < p.length; i++) {
				r[i] = gf.mul(p[i], x);
			}
			return r;
		},

		poly_add: function(p, q) {
			var r = new Uint32Array(Math.max(p.length, q.length));

			for (var i = 0; i < p.length; i++) {
				r[i+r.length-p.length] = p[i];
			}

			for (var i = 0; i < q.length; i++) {
				r[i+r.length-q.length] ^= q[i];
			}

			return r;
		},

		poly_mul: function(p,q) {
			var r = new Uint32Array(p.length+q.length-1);
			var lp = p.map(u => gf.log[u]);
			for (var j = 0; j < q.length; j++) {
				var qj = q[j];
				if (qj !== 0) {
					var lq = gf.log[qj];
					for (var i = 0; i < p.length; i++) {
						if (p[i] !== 0) {
							r[i + j] ^= gf.exp[lp[i] + lq];
						}
					}
				}
			}
			return r;
		},

		poly_mul_simple: function(p,q) {
			var r = new Uint32Array(p.length+q.length-1);
			for (var j = 0; j < q.length; j++) {
				for (var i = 0; i < p.length; i++) {
					r[i+j] ^= gf.mul(p[i],q[j]);
				}
			}
			return r;
		},

		poly_neg: function(p) {
			return p;
		},

		poly_div: function(dividend, divisor) {
			var msg_out = dividend.slice();

			for (var i = 0; i < (dividend.length - (divisor.length-1)); i++) {
				var coef = msg_out[i];
				if (coef !== 0) {
					for (var j = 1; j < divisor.length; j++) {
						if (divisor[j] !== 0) {
							msg_out[i + j] ^= gf.mul(divisor[j], coef);
						}
					}
				}
			}

			var separator = -(divisor.length-1);
			return [msg_out.slice(0, separator), msg_out.slice(separator)];
		},

		poly_eval: function(poly, x) {
			var y = poly[0];
			for (var i = 1; i < poly.length; i++) {
				y = gf.mul(y, x) ^ poly[i];
			}
			return y;
		},
	}

	return gf;
}
