<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Game from "../../lib/components/Game.svelte";

    import type { PlayerInit } from "../../lib/Player.ts";

    import { prngDriver } from "../../lib/drivers/prng.ts";
    import { evDriver } from "../../lib/drivers/ev.ts";
    import { manualDriver } from "../../lib/drivers/manual.ts";

    const SEED: number = 42;
    const PLAYERS: PlayerInit[] = [
        { name: "Arthur", driver: manualDriver },
        { name: "Ford", driver: manualDriver },
        { name: "Marvin", driver: evDriver },
    ];
</script>

<svelte:head>
    <title>Play Hadronize</title>
</svelte:head>

<Reset />

<Game gameParams={[SEED, PLAYERS]} />
