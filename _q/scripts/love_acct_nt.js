function(ctx, a) {
	// This lock has such a special place in my heart that I've decided to outsource it's implementation here.
	// This will return an object which can be used to give a list of potential answer to a given question.
	// These answers will be ordered such that the most likely ones are the first ones.

	// This has access to #s.accts.transactions, since it is needed. No other external function calls are
	// nececcary.

	// There are basically 3 types of questions:
	// 1. Get me the amount of a large (deposit|withdrawal) near (170401.0502)
	// 2. What was the net GC between (170331.1019) and (170331.1040)
	// 3. Need to know the total (spent|earned) on transactions (without|with) memos between (170401.1149) and (170401.1225)

	// The trick here is that number 2 and 3 are really the same, except that for 3 the answer is Math.abs(net).
	// Another trick is that the 3 gives information on the sign of the total and the majority or tie of memos
	// in the range. This means that the overall code for 2 and 3 is very similar, it's just that we can apply an
	// extra filtering step in the case of form number 3.

	// Another insigt is that if we are just doing t2 solving with the user you are calling on
	// you most likley have a net balance of 0GC in most cases. This means that the first call to
	// the lock when you are tryign to get the question, should always be 0GC.


	// This returns the 
	const parse_question = qst => {

	}

	const solve = (qst, txns=null) => {
		// If txns is not passed in, we get all transactions from the user.
		// This is mostley for unit testing and it will be refined later.
		if (txns === null) {
			txns = #s.accts.transactions({count: "all"});
		}

		const qst_info = parse_question(qst);

		// This is the main public entry.
		return [];
	}

	return solve;
}
