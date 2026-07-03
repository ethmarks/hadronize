<script lang="ts">
    import { MIN_PLAYERS, MAX_PLAYERS } from "../Hadronize.ts";
    import type { PlayerInit } from "../Player.ts";

    import { prngDriver } from "../drivers/prng.ts";
    import { evDriver } from "../drivers/ev.ts";
    import { manualDriver } from "../drivers/manual.ts";
    import { onMount } from "svelte";

    interface Props {
        mountGame: (seed: number, inits: PlayerInit[], speed: number) => void;
    }

    const ENABLE_SPEED = false;

    let { mountGame }: Props = $props();

    let seed: number = $state(1);
    let speed: number = $state(1);

    let playerCount: number = $state(3);
    let playerInputs: { name: string; type: "Human" | "Bot" }[] = $state([
        { name: "Alice", type: "Human" },
        { name: "Bob", type: "Bot" },
        { name: "Charlie", type: "Bot" },
        { name: "David", type: "Bot" },
        { name: "Eve", type: "Bot" },
        { name: "Frank", type: "Bot" },
    ]);

    function onsubmit() {
        const inits = playerInputs.slice(0, playerCount).map((p) => {
            return {
                name: p.name,
                driver: p.type === "Human" ? manualDriver : evDriver,
            };
        });

        mountGame(seed, inits, speed);
    }

    onMount(() => {
        seed = Math.floor(Math.random() * 2 ** 32);
    });
</script>

<form {onsubmit}>
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
