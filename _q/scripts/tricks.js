function(context, args)
{
	// This is justa place to dump random tips
	//
	// Print out without silly escapes. Nice to see if the app is doing the coloring or the text.
	
	// str.split('').join('\u200B') ?
	//
	// Regex 101 to remove color from shell.txt: (<color=(.*?)>|<\/color>)

	// Get all the property names of an object.
	// return Object.getOwnPropertyNames(s); 

	// Tier information:
	// uninit: MAX 5MGC
	// T1 : 1MGC, MAX 20MGC, 32 upgrade slots, 8 Equipable
	// T2 : 10MGC, MAX 5BGC, 64 upgrade slots, 16 Equipable
	// T3 : 100MGC, MAX 5TGC, 128 upgrade slots, 32 Equipable
	// T4 : 1BGC, MAX UNLIMITED GC, 256 upgrade slots, 64 Equipable

	// Slots is just equipable*4

	// DTR STUFF
	// dtr.market_watch{macros:true}
	// dtr.market_watch{name:"/char_count/",sort:{chars:-1, cost: 1},buy:#s.market.buy,buy_order:{order:"sort",max_items_gc:"10BGC",max_items:100}}


	// DTR WISDOM
	
	// the way the regen cycle works is:
	// 1) all old scripts are deleted
	// 2) new corp scripts are uploaded at fullsec, and private
	// 3) the corp scripts are populated, and re-uploaded as proper sec level and public
	
	// === TODO ===
	// + Create DB manager
	// + Create table printer.
	// + Create unit testing lib.
}
