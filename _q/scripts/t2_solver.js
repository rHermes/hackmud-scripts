function(ctx,a) {
	// This is a t2 lock solver.
	if (a.t === undefined) {
		return "We need a target ma'am!";
	}

	// Timing utils.
	var timeF = f => {
		var starttime = Date.now();
		var ret = f();
		return [ret, Date.now()-starttime];
	}



	// Setup vita stuff

	// So overview:

	// When I first called, the message I got was:
	//
	// LOCK_ERROR
	// Denied access by #FUTUREtech acct_nt lock.

	// When I got the second lock the messages was:
	// LOCK_UNLOCKED acct_nt
	// LOCK_ERROR
	// Denied access by context CON_SPEC lock.


	// WHen i got it the thrid lock message was:
	// LOCK_UNLOCKED acct_nt
	// LOCK_UNLOCKED CON_SPEC
	// LOCK_ERROR
	// Denied access by sn_w inc sn_w_glock lock.

	// When I got that the message was just:

	// LOCK_UNLOCKED
	// Connection terminated.




	// === CON_SPEC ===

	// ONce I specified  it gave me: 
	
	// UTSRQPO									-> NML
	// ZYXWVUT									-> SRQ
	// EFGHIJK									-> LMN
	// VUTS											-> RQP

	// Provide the next three letters in the sequence

	// THe answer turned out to be NML and it was that part of the alphabet backwards.

	// Guessing on the evidence I've got, I think that this means that we will always find
	// Some sort of alphabet puzzle, either backwards or forwards.

	// Solutions


	// === sn_w_glock ===

	// Once I speciifed it, it gave me:
	
	// That balance would not be chosen by a magician.
	
	// It also took money from my account. This seem to indicate that the balance in my account
	// needs to be the answer. For this one I googled for magician numbers and after a few tries
	// The one that opened that one was 1089 or "1K89GC". It seems the amount needs to be a GC string.

	// solutions:
	
	// That balance would not be chosen by a magician. 	-> 1089 	: 1K89GC
	// Well that wasn't a special balance. 							-> 38 		: 38GC
	// That balance was not secret. 										-> 7 			: 7GC
	// That balance has no meaning.											-> 42			: 42GC

	// === magnara ===

	// --- QUESTIONS ---
	// 
	// recinroct magnara ulotnois orf: islmeub							-> sublime
	// recinroct magnara ulotnois orf: gnie									-> inge
	// recinroct magnara ulotnois orf: luln									-> null

	// So we got some anagrams going on.
	// 
	// islmeub => sublime
	// gnie => inge

	// === acct_nt ===

	// Once I specified the accc_nt without parameters I got:

	// === QUESTIONS ===

	// Get me the amount of a large deposit near 170331.0356							
	// What was the net GC between 170331.1019 and 170331.1040
	// What was the net GC between 170331.1019 and 170331.1041
	// Get me the amount of a large withdrawal near 170401.0454							-> "10M935K349GC"
	// Get me the amount of a large deposit near 170401.0502 								-> "19M655K566GC"
	// Need to know the total spent on transactions without memos between 170401.1149 and 170401.1225

	// I had to look into my account to find it was not the one at the actual mark.
	
	// Since there is an inaccuracy in the times, how do we do this?

	// Solution

	var solve_acct_nt = (t, question) => {
		var ss = Date.now();
		var txns = #s.accts.transactions({count: "all"});

		// This is the correct version, but shawn the mad man has other plans.
		// var ing2ts = (u) => new Date(Date.UTC("20" + u.slice(0,2), parseInt(u.slice(2,4))-1, parseInt(u.slice(4,6)),  parseInt(u.slice(7,9)),  parseInt(u.slice(9,11))));

		var ing2ts = (u) => new Date("20" + u.slice(0,2), parseInt(u.slice(2,4))-1, parseInt(u.slice(4,6)),  parseInt(u.slice(7,9)),  parseInt(u.slice(9,11)));

		var round_off = (u) => new Date(u.getFullYear(), u.getMonth(), u.getDate(), u.getHours(), u.getMinutes());

		var cmp_dates = (a,b) => a.getTime() === b.getTime();

		switch (question[0]) {
			case "between":
				var net = 0;
				var [start, end] = question.splice(1).map(ing2ts);

				var rel_txns = txns.filter(u => (start <= round_off(u.time) && round_off(u.time) <= end));

				var net = rel_txns.reduce((a,c) => a + (c.recipient == ctx.caller ? c.amount : -c.amount), 0);

				return net;

				return JSON.stringify(rel_txns);
			break;
		}
		// 

		return Date.now()-ss;
	}

	//return solve_acct_nt(a.t, ["between", "170331.2126", "170331.1041"]);
	return solve_acct_nt(a.t, ["between", "170331.1019", "170331.1041"]);
}