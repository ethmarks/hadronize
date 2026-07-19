<script>
    import setup from "$lib/assets/input_form_screenshot.png";
    import play from "$lib/assets/play_screenshot.png";

    import noreaction from "$lib/assets/no_reaction.webm";
    import hadronize from "$lib/assets/hadronize_reaction.webm";
    import tunneling from "$lib/assets/tunneling_reaction.webm";

    import desktopTurn from "$lib/assets/desktop_turn.webm";
    import mobileTurn from "$lib/assets/mobile_turn.webm";
    import consoleTurn from "$lib/assets/console_turn.webm";

    import winning from "$lib/assets/winning.png";
</script>

<svelte:head>
    <title>How to Play | Hadronize</title>
</svelte:head>

<h2>How to Play</h2>

<p>Welcome to Hadronize! This guide will teach you how to play.</p>

<h3>Which platform?</h3>

<ul>
    <li><strong>Browser (recommended): read the rest of this page.</strong></li>
    <li>
        CLI: head to the <a href="./cli">CLI page</a> which explains how to install
        Hadronize and play it in your terminal.
    </li>
    <li>
        Paper: head to the <a href="./rules">rules page</a> which explains the rules
        at the theoretical level, which is useful if you want to play cut out cards
        on paper for some reason. I don't recommend this approach because then you
        wouldn't get to use my cool UI.
    </li>
</ul>

<h3>Starting a game</h3>

<figure>
    <img alt="Hadronize setup form" src={setup} width="768" height="501" />
</figure>

<p>Next, you'll need to set up and start a new game of Hadronize.</p>

<ol>
    <li>Head to the <a href="./play">play page</a></li>
    <li>
        Choose your player count. Hadronize can be played with as few as 2
        players, but it's much more interesting with 4-6 players in my opinion.
        I personally find it more fun to play with other humans, so if you're
        able to, you should ask a friend or two to play a quick game with you.
        If you can't, Hadronize has bots so you can also play singleplayer too.
    </li>
    <li>
        Set the names of each player. For human players, name them whatever that
        human would prefer to be called. For bot players, name them whatever you
        want. I like to name mine <a
            href="https://interstellarfilm.fandom.com/wiki/TARS">TARS</a
        >
        or <a href="https://interstellarfilm.fandom.com/wiki/CASE">CASE</a>.
    </li>
    <li>
        Set the types of each player. For human players, set it to "Human". For
        bot players, you can choose from the stock bots or <a href="./bots"
            >make your own</a
        >. If you're unsure which ones to use, I suggest using EVan for a
        challenge and Bogo for mild chaos.
    </li>
    <li>
        You shouldn't need to mess with the advanced settings, unless you're
        colorblind, in which case you should change the quark style to
        "patterned".
    </li>
    <li>Press "Start Game"</li>
</ol>

<h3>Playing</h3>

<figure>
    <img
        alt="Hadronize being played on desktop"
        src={play}
        width="1880"
        height="953"
    />
</figure>

<p>
    Your screen should look similar to the image above. They might be in a
    different arrangement if you're playing on mobile (which is supported!).
</p>

<p>Let me explain everything that's on screen.</p>

<ul>
    <li>
        The small colorful circles are quarks. <a
            href="https://en.wikipedia.org/wiki/Quark#Classification"
            >Just like real-life quarks</a
        >, they come in six different flavors:

        <span style="color: #5dafef">up</span>,
        <span style="color: #e5c07b">down</span>,
        <span style="color: #98c379">strange</span>,
        <span style="color: #4db6ac">charm </span>,
        <span style="color: #c678dd">top </span>, and
        <span style="color: #ef657a">bottom</span>
        .
    </li>
    <li>
        The clusters of quarks with player names above them are chambers.
        They're basically each player's "hand" of quarks.
    </li>
    <li>
        The quark in the center of the screen is the superposed quark. It's in a
        superposition between three different flavors, and we don't know which
        one it is until we collapse the superposition.
    </li>
</ul>

<h3>Quark Reactions</h3>

<p>
    When you collapse a superposed quark (more on how that happens in the next
    section) into a chamber, one of three things can happen.
</p>

<ol>
    <li>
        <p>
            No reaction. If the chamber doesn't have any of the flavor that the
            superposed quark collapses into, nothing happens. It's just added to
            the chamber.
        </p>
        <p>
            In the example below, the superposed quark turned out to be <span
                style="color: #5dafef">up</span
            >, but Alice didn't have any <span style="color: #5dafef">up</span>
            quarks, so there was no reaction.
        </p>
        <figure>
            <video
                src={noreaction}
                autoplay
                muted
                loop
                playsinline
                width="1880"
                height="953"
            ></video>
        </figure>
    </li>
    <li>
        <p>
            Tunneling. If the chamber <em>does</em> have at least one quark of
            the flavor that the superposed quark collapses into, and the chamber
            it collapsed into is <em>not</em> the chamber of the player whose turn
            it is, all quarks of that flavor immediately quantum-tunnel to the player
            whose turn it is.
        </p>
        <p>
            In the example below, the quark turned out to be
            <span style="color: #98c379">strange</span>, and Charlie already had
            a
            <span style="color: #98c379">strange</span> quark. Because the quark
            went to Charlie but it was Alice's turn, all of Charlie's
            <span style="color: #98c379">strange</span> quarks plus the superposed
            quark went to Alice's chamber.
        </p>
        <figure>
            <video
                src={tunneling}
                autoplay
                muted
                loop
                playsinline
                width="1880"
                height="953"
            ></video>
        </figure>
    </li>
    <li>
        <p>
            Hadronization. If the chamber <em>does</em> have at least one quark
            of the flavor that the superposed quark collapses into, and the
            chamber it collapsed into <em>is</em> the chamber of the player whose
            turn it is, all quarks of that flavor turn into hadrons, which represent
            player score.
        </p>
        <p>
            In the example below, the quark turned out to be
            <span style="color: #98c379">strange</span>, and Alice already had a
            <span style="color: #98c379">strange</span>
            quark. Because the quark went to Alice and it was Alice's turn, all of
            her <span style="color: #98c379">strange</span> quarks plus the superposed
            quark all hadronized together.
        </p>
        <figure>
            <video
                src={hadronize}
                autoplay
                muted
                loop
                playsinline
                width="1880"
                height="953"
            ></video>
        </figure>
    </li>
</ol>

<h3>Taking a turn</h3>

<p>
    On your turn, all that you have to do is decide who the new superposed quark
    goes to. That's it. I'll leave the strategy to you, but let me explain how
    to actually enter your input.
</p>

<ul>
    <li id="desktop">
        <p>
            Desktop: just drag and drop the superposed quark onto your target
            chamber. An indicator will appear around the chamber when you've
            dragged the quark close enough.
        </p>
        <figure>
            <video
                src={desktopTurn}
                autoplay
                muted
                loop
                playsinline
                width="1880"
                height="953"
            ></video>
        </figure>
    </li>
    <li id="mobile">
        <p>Mobile: just tap on your target chamber. Simple as that.</p>

        <figure>
            <video
                src={mobileTurn}
                autoplay
                muted
                loop
                playsinline
                width="1080"
                height="2114"
            ></video>
        </figure>
    </li>
    <li id="console">
        <p>
            Browser console (bonus): you can also play Hadronize in the browser
            console! Just type in the name of the player whose chamber you want
            to target.
        </p>
        <p>
            How does it work? <a
                href="https://github.com/ethmarks/hadronize/blob/main/src/lib/drivers/manual.ts"
                >Magic</a
            >! (aka dynamically creating named window properties that are
            objects with anonymous getters that invoke a function that resolves
            a void promise).
        </p>

        <figure>
            <video
                src={consoleTurn}
                autoplay
                muted
                loop
                playsinline
                width="1880"
                height="953"
            ></video>
        </figure>
    </li>
</ul>

<h3>Winning</h3>

<p>
    The game immediately ends when a player hadronizes 10 or more quarks.
    Whoever does it first is the winner.
</p>

<figure>
    <img alt="Charlie wins" src={winning} width="1920" height="993" />
</figure>

<p>
    Note: for technical reasons, there's a hardcoded limit of 300 turns. If you
    reach this limit, the game will unceremoniously end. In my many many hours
    of developing Hadronize (<a
        href="https://hackatime.hackclub.com/@ethmarks/project/hadronize"
        >more than 100</a
    >) and many playtests with friends, I have never once hit the turn limit
    unless I was specifically trying to for testing purposes. If you manage
    accidentally encounter the turn limit, you should feel accomplished.
</p>

<h3>Conclusion</h3>

<blockquote>
    Congratulations! You now know how to play Hadronize. <a href="./play"
        >Go play!</a
    >
</blockquote>

<p>
    While you're here, did you know that the theme of Hadronize is based on
    actual physics?
</p>

<p>
    <a href="https://en.wikipedia.org/wiki/Hadronization">Hadronization</a> is a
    real process where quarks bond together via the
    <a href="https://en.wikipedia.org/wiki/Strong_interaction"
        >strong nuclear force</a
    >
    and form <a href="https://en.wikipedia.org/wiki/Hadron">hadrons</a>. In
    reality, the only standard configurations are groups of threes (which are
    called
    <a href="https://en.wikipedia.org/wiki/Baryon">baryons</a>).
    <a href="https://en.wikipedia.org/wiki/Meson">Mesons</a> are hadrons made of
    two quarks, but they only form matter-antimatter pairs. Groups of four (<a
        href="https://en.wikipedia.org/wiki/Tetraquark">tetraquarks</a
    >) and five (<a href="https://en.wikipedia.org/wiki/Pentaquark"
        >pentaquarks</a
    >) do exist, but they're extremely unstable. Also, baryons usually aren't
    composed of all the same flavor. There are some exceptions, like
    <a href="https://en.wikipedia.org/wiki/Delta_baryon"
        >Delta-plus-plus baryons</a
    >, but they're also extremely unstable.
</p>

<p>
    As you can see, I had to compromise a bit on scientific realism to avoid
    making the game boring, but hopefully you'll agree that Hadronize is more
    realistic than most works with a "quantum" theme.
</p>

<style>
    img,
    video {
        max-height: clamp(500px, 70vh, 1200px);
    }
</style>
