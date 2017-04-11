# hackmud-scripts

These are my hackmud scripts! Later there will be a proper structure to this
project, including maybe minifiers, but for now there is only the raw scripts.

## Noticable scripts

- _q.qrv2 - A QR decoder with errasure correction support.
- _q.love - A WIP solver. It is focused on npc solving.

## Projects

### Love

The `love` solver is meant to be a general purpose solver for any tier of locks.
The main script, `love`, is just a frontend for the `liblove` libraries. This
kind of setup is shamelessly stolen from n00bish.

#### TODO

##### Escrow services integration.
This might be a moot point since the solver is open source, but since it requires
some script slots to use, there might end up being some publically hosted version
which some people use rather than run their own. For that purpose, there should
be an option to add a charge per unlock feature, that require some sort of payment
for each solve.

This would be something the hoster of the script would have to turn on and it should
support all the common escrow features, like `escrow`, `pay.pal` and `jade.vita`.
For the two latter one would need to assess the danger of one or two of these scripts
either going away or going rouge.

##### Invalidation Support
Currently the solver doesn't have any idea if the previous state no longer matches
the one currenty present. This will be tricky to get right, since I'm aiming for
a low call overhead on my solver, but a basic first version could just call function
once first and see if the output matches the last output exactly. If it does, we can
assume that nothing has changed.

##### Support PVP solving.
The current implementation of some of the lock solve methods would not stand up
against active defences. The noticeable examples are `acc_nt` and `sn_w_glock`.


### Passion

The `passion` harvester is meant to be a general purpose harvester for all
corp tiers. The main script `passion` is just a frontend for the `liblove`
libraries.

#### TODO

##### DB integration.
Right now the database integration is kind of weak. Implement a more state like
system, so that we can run it against corps in a more systematic manner.

##### Recognize corp type
Make a huristics for recognize what kind of corp we are looking at.

##### T1 special commands
There are some special commands that can be given to T1 corps.


##### Cross username support
Someone mentioned that usernames for T2 corps can be from many T1 corporations,
so we should therefor explore this.


### Joy
`joy` is going to be a suite of upgrade tools. Sorting, minmaxing, selling, recording
and so on. It may also feature market searching tools.


#### TODO

##### Everything