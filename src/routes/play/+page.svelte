<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Quark from "../../lib/components/Quark.svelte";

    import { Hadronize } from "../../lib/Hadronize.ts";
    import { prngDriver } from "../../lib/drivers/prng.ts";
    import { onMount } from "svelte";

    const game = new Hadronize(1, [
        { name: "p1", driver: prngDriver },
        { name: "p2", driver: prngDriver },
    ]);

    game.produceQuark();

    let superposedQuark = $derived(game.quarks[game.superposedIndex!]);

    let superposedQuarkPressed: boolean = $state(false);
    let mouse: { x: number; y: number } = $state({ x: 0, y: 0 });
    let superposed: { x: number; y: number } = $state({ x: 0, y: 0 });

    function handleMouseMove(event: MouseEvent) {
        mouse = { x: event.clientX, y: event.clientY };

        if (superposedQuarkPressed) {
            superposed = { x: mouse.x, y: mouse.y };
        }
    }

    onMount(() => {
        superposed = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        };
    });
</script>

<svelte:head>
    <title>Play Hadronize</title>
</svelte:head>

<svelte:window
    on:mousemove={handleMouseMove}
    onmouseup={() => (superposedQuarkPressed = false)}
/>

<Reset />

<div id="superposed">
    <Quark
        quark={superposedQuark}
        x={superposed.x}
        y={superposed.y}
        onmousedown={() => {
            superposedQuarkPressed = true;
        }}
    />
</div>

<h1>Play Hadronize</h1>
<p>This page is for playing Hadronize</p>

<style lang="scss">
</style>
