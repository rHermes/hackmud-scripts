function(ctx, a){
	// This is just for playing with dtrs' `dtr.js_asm`
	let program1 = [
		"	JMP	:main",
		":factorial",
		"$1	TYPEOF	$0",
		"$1	==	$1	'number",
		"	RETEZ	$1	'Can only perform factorial on numbers",
		"$1	>	$0	0",
		"	RETEZ	$1	'Can only perform factorial on positive numbers",
		"$1	|	$0	0",
		"$1	===	$1	$0",
		"	RETEZ	$1	'Can only perform factorial on integers",
		"$1	=	1",
		"$2	=	0",
		":_factorial_loop",
		"$2	+	$2	1",
		"$1	*	$1	$2",
		"$3	>=	$2	$0",
		"	JEZ	$3	:_factorial_loop",
		"	RET	$1",
		"",
		":main",
		"	FUNC	:factorial	@.n",
	]

	return #s.dtr.js_asm({code: program1, n: 4})
}
