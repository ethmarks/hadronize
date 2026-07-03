<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Game from "../../lib/components/Game.svelte";

    import type { PlayerInit } from "../../lib/Player.ts";

    import { prngDriver } from "../../lib/drivers/prng.ts";
    import { evDriver } from "../../lib/drivers/ev.ts";
    import { manualDriver } from "../../lib/drivers/manual.ts";

    import { mount, onMount, unmount } from "svelte";
    import { MAX_PLAYERS, MIN_PLAYERS } from "../../lib/Hadronize.ts";

    const PLAYERS: PlayerInit[] = [
        { name: "Arthur", driver: manualDriver },
        { name: "Ford", driver: manualDriver },
        { name: "Marvin", driver: evDriver },
    ];

    const ENABLE_SPEED = false;

    let seed: number = $state(1);

    let playerCount: number = $state(3);
    let playerInputs: { name: string; type: "Human" | "Bot" }[] = $state([
        { name: "Alice", type: "Human" },
        { name: "Bob", type: "Bot" },
        { name: "Charlie", type: "Bot" },
        { name: "David", type: "Bot" },
        { name: "Eve", type: "Bot" },
        { name: "Frank", type: "Bot" },
    ]);
    let playerInits: PlayerInit[] = $derived(
        playerInputs.slice(0, playerCount).map((p) => {
            return {
                name: p.name,
                driver: p.type === "Human" ? manualDriver : prngDriver,
            };
        }),
    );

    let speed: number = $state(1);

    let gameContainer: HTMLElement;
    let gameInstance: ReturnType<typeof Game>;

    function mountGame() {
        if (gameInstance) unmount(gameInstance);

        gameInstance = mount(Game, {
            target: gameContainer,
            props: { gameParams: [seed, playerInits], speed },
        });
    }

    onMount(() => {
        seed = Math.floor(Math.random() * 2 ** 32);
    });
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

    <label for="playerCount"
        >Player count (min is {MIN_PLAYERS}, max is {MAX_PLAYERS})</label
    >
    <input
        type="number"
        id="playerCount"
        min={MIN_PLAYERS}
        max={MAX_PLAYERS}
        step="1"
        bind:value={playerCount}
    />

    <div id="players">
        {#each playerInputs.slice(0, playerCount) as player, index}
            <div class="player" id={`player${index}`}>
                <div class="player-input">
                    <label for={`player${index}-name`}
                        >Player {index}'s name</label
                    >
                    <input
                        type="text"
                        id={`player${index}-name`}
                        bind:value={player.name}
                    />
                </div>

                <div class="player-input">
                    <label for={`player${index}-type`}
                        >{player.name}'s type</label
                    >
                    <select id={`player${index}-type`} bind:value={player.type}>
                        <option value="Human">Human</option>
                        <option value="Bot">Bot</option>
                    </select>
                </div>
            </div>
        {/each}
    </div>

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
