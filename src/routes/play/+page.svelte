<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Quark from "../../lib/components/Quark.svelte";

    import { Hadronize } from "../../lib/Hadronize.ts";
    import { prngDriver } from "../../lib/drivers/prng.ts";

    const game = new Hadronize(1, [
        { name: "p1", driver: prngDriver },
        { name: "p2", driver: prngDriver },
    ]);

    let quarks = $state(
        game.quarks.map((q) => {
            return { quark: q, x: 0, y: 0 };
        }),
    );

    game.produceQuark();

    let superposed = $derived(quarks[game.superposedIndex!]);

    let superposedQuarkPressed: boolean = $state(false);
    let mouse: { x: number; y: number } = $state({ x: 0, y: 0 });

    function handleMouseMove(event: MouseEvent) {
        mouse = { x: event.clientX, y: event.clientY };

        if (superposedQuarkPressed) {
            superposed.x = mouse.x;
            superposed.y = mouse.y;
        }
    }
</script>

<svelte:head>
    <title>Play Hadronize</title>
</svelte:head>

<svelte:window
    on:mousemove={handleMouseMove}
    onmouseup={() => (superposedQuarkPressed = false)}
/>

<Reset />

<div id="quarks">
    {#each quarks as q, index}
        <Quark
            quark={q.quark}
            x={q.x}
            y={q.y}
            onmousedown={() => {
                if (index === game.superposedIndex!)
                    superposedQuarkPressed = true;
            }}
        />
    {/each}
</div>

<h1>Play Hadronize</h1>
<p>This page is for playing Hadronize</p>

<style lang="scss">
</style>
