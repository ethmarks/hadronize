<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Quark from "../../lib/components/Quark.svelte";

    import { Hadronize } from "../../lib/Hadronize.ts";
    import { prngDriver } from "../../lib/drivers/prng.ts";

    const game = new Hadronize(1, [
        { name: "p1", driver: prngDriver },
        { name: "p2", driver: prngDriver },
    ]);

    let quarks = $state(game.quarks);
</script>

<svelte:head>
    <title>Play Hadronize</title>
</svelte:head>

<Reset />

<div id="quarks">
    {#each quarks as quark}
        <Quark {quark} />
    {/each}
</div>

<h1>Play Hadronize</h1>
<p>This page is for playing Hadronize</p>

<style lang="scss">
    #quarks {
        display: flex;
        flex-direction: row;
    }
</style>
