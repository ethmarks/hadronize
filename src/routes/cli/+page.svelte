<script lang="ts">
    import { main } from "$lib/cli";
    import { consoleDriver } from "$lib/utils/consoleDriver";

    import { onMount } from "svelte";

    onMount(async () => {
        await main(
            {
                abbreviate: false,
                showEmpty: false,
                showPlayerOrder: true,
                showPreviousObservation: true,
            },
            [
                1,
                [
                    { name: "alice", driver: consoleDriver },
                    { name: "bob", driver: consoleDriver },
                ],
            ],
        );
    });
</script>

<svelte:head>
    <title>Hadronize CLI</title>
</svelte:head>

<h1>Hadronize CLI</h1>
<a href="../">Go home</a>
<p>
    <strong
        >Open your browser console (<kbd>F12</kbd>) to play Hadronize CLI.</strong
    >
</p>

<h2>Instructions</h2>
<p>
    See the <a href="https://github.com/ethmarks/hadronize#rules"
        >Hadronize README</a
    >
    for an explanation of Hadronize's rules. Check out
    <a
        href="https://github.com/ethmarks/hadronize/blob/main/src/lib/utils/consoleDriver.ts"
        ><code>consoleDriver.ts</code></a
    > in the source code to see how the browser console input works (it's pretty clever).
</p>
<p>
    To use the CLI, all you need to do is enter one of the player's names
    directly into the browser console (e.g. <kbd>alice</kbd>) on your turn. If
    it doesn't work, try the fallback function: <kbd>turn("alice")</kbd>.
</p>

<p>
    <em>
        Note: The CLI obviously only works if you can open your browser console.
        This means that you can't use it on mobile unless you really know what
        you're doing. Please remember that Hadronize is under heavy development,
        and eventually it will have a UI which will probably be
        mobile-accessible.
    </em>
</p>
