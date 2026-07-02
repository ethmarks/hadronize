<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Game from "../../lib/components/Game.svelte";

    import type { PlayerInit } from "../../lib/Player.ts";

    import { prngDriver } from "../../lib/drivers/prng.ts";
    import { evDriver } from "../../lib/drivers/ev.ts";
    import { manualDriver } from "../../lib/drivers/manual.ts";

    import { mount, unmount } from "svelte";

    const PLAYERS: PlayerInit[] = [
        { name: "Arthur", driver: manualDriver },
        { name: "Ford", driver: manualDriver },
        { name: "Marvin", driver: evDriver },
    ];

    const ENABLE_SPEED = false;

    let seed: number = $state(1);
    let speed: number = $state(1);

    let gameContainer: HTMLElement;
    let gameInstance: ReturnType<typeof Game>;

    function mountGame() {
        if (gameInstance) unmount(gameInstance);

        gameInstance = mount(Game, {
            target: gameContainer,
            props: { gameParams: [seed, PLAYERS], speed },
        });
    }
</script>

<svelte:head>
    <title>Play Hadronize</title>
</svelte:head>

<Reset />

<form onsubmit={mountGame}>
    <label for="seed">Seed</label>
    <input
        id="seed"
        type="number"
        min="0"
        max={2 ** 32}
        step="1"
        required
        bind:value={seed}
    />

    {#if ENABLE_SPEED}
        <label for="speed">Speed</label>
        <input
            id="speed"
            type="number"
            min="0"
            max="50"
            step="1"
            bind:value={speed}
        />
    {/if}

    <button type="submit">Start Game</button>
</form>

<div id="gameContainer" bind:this={gameContainer}></div>

<style lang="scss">
    :global(body) {
        background: rgb(32, 33, 36);
        overflow: hidden;
        height: 100vh;
    }

    #gameContainer {
        --top: 5rem;
        --bottom: 3rem;
        --sides: 5rem;
        position: absolute;
        width: calc(100% - var(--sides) * 2);
        height: calc(100% - var(--top) - var(--bottom));
        left: var(--sides);
        top: var(--top);

        :global(main) {
            border-radius: 2rem;
        }
    }
</style>
