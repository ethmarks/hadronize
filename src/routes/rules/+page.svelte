<svelte:head>
    <title>Hadronize Rules</title>
</svelte:head>

<h2>Rules</h2>

<ul>
    <li>2-6 players</li>
    <li>~10 minutes per game</li>
</ul>

<h3>Goal</h3>

<p>Be the first player to hadronize 10 or more quarks.</p>

<h3>Quarks</h3>

<p>
    <strong>Quarks</strong> are the fundamental game mechanic in Hadronize.
    There are
    <a href="https://en.wikipedia.org/wiki/Quark#Classification"
        >6 different flavors</a
    > of quark: up, down, strange, charm, bottom, and top.
</p>

<h3>Setup</h3>

<p>
    At the start of the game, each player starts with 4 collapsed quarks with
    randomly-chosen flavors. Each player's collection of quarks is called a
    <a href="https://en.wikipedia.org/wiki/Cloud_chamber"
        ><strong>Cloud Chamber</strong></a
    >. Cloud chambers can hold an unlimited number of quarks.
</p>

<h3>Gameplay</h3>

<p>Starting from a randomly-chosen starting player, play proceeds clockwise.</p>

<p>
    On each turn, a new superposed quark is produced out of vacuum fluctuations.
    The active player must select any player (<strong
        >including themselves</strong
    >), who will then observe the new quark. Upon observation, the superposed
    quark collapses into one of its three possible flavors and is added to the
    observing player's cloud chamber.
</p>

<p>
    If the observing player did <em>not</em> already have any quarks of the same flavor
    as the new quark in their cloud chamber, the turn ends and play proceeds to the
    next player.
</p>

<p>
    If the observing player already had at least one quark of the same flavor as
    the new quark, the new quark reacts with the existing quarks in a way that
    depends on which player observed the quark.
</p>

<p>
    <strong>If the observing player is the same as the active player</strong>:
    the new quark reacts with all existing quarks of the same flavor, and they
    all <strong>hadronize</strong> together. Hadronized quarks can <em>NOT</em> react
    with new quarks, but they count towards the active player's score.
</p>

<p>
    <strong>If the observing player is different from the active player</strong
    >: the new quark reacts with all existing quarks of the same flavor, and
    they all <strong>quantum tunnel</strong> from the observing player's chamber
    into the active player's cloud chamber. Quarks can <em>NOT</em> hadronize immediately
    after quantum tunneling, but on all subsequent turns they can react, hadronize,
    and quantum tunnel just like normal.
</p>

<p>
    Once the new quark is added and the reaction completes, the turn ends and
    play proceeds to the next player.
</p>

<h3>Examples</h3>

<p>
    Alice has three charm quarks but zero strange quarks in her cloud chamber,
    and Bob has three strange quarks but zero charm quarks in his cloud chamber.
    It is Alice's turn. A new superposed quark appears, and Alice sees that its
    superposition is between charm, strange, and up. Alice...
</p>

<ul>
    <li>
        ...makes herself observe the new quark. It collapses in her cloud
        chamber, into a...

        <ul>
            <li>
                ...charm quark. It reacts with Alice's existing charm quarks,
                and the four (3 existing + 1 new) quarks hadronize. Alice is now
                four hadronized quarks closer to winning.
            </li>
            <li>
                ...strange quark. It does nothing because Alice doesn't have any
                existing strange quarks for it to react with. Alice now has a
                strange quark in her cloud chamber.
            </li>
        </ul>
    </li>
    <li>
        ...makes Bob observe the new quark. It collapses in his cloud chamber,
        into a...

        <ul>
            <li>
                ...charm quark. It does nothing because Bob doesn't have any
                charm quarks for it to react with. Bob now has a charm quark in
                his cloud chamber and Alice's cloud chamber is unchanged.
            </li>
            <li>
                ...strange quark. It reacts with Bob's existing strange quarks,
                and the four (3 existing + 1 new) quarks quantum tunnel into
                Alice's cloud chamber. Alice now has four strange quarks in her
                cloud chamber and Bob has zero strange quarks in his cloud
                chamber.
            </li>
        </ul>
    </li>
</ul>
