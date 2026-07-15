<script lang="ts">
    import { MIN_PLAYERS, MAX_PLAYERS } from "../Hadronize.ts";
    import type { PlayerInit } from "../Player.ts";

    import { prngDriver } from "../drivers/prng.ts";
    import { evDriver } from "../drivers/ev.ts";
    import { manualDriver } from "../drivers/manual.ts";
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";

    interface Props {
        submitForm: (seed: number, inits: PlayerInit[], speed?: number) => void;
        enableSpeed?: boolean;
    }

    let { submitForm, enableSpeed }: Props = $props();

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

    let overrideSeed: boolean = $state(false);

    function onsubmit() {
        const inits = playerInputs.slice(0, playerCount).map((p) => ({
            name: p.name,
            driver: p.type === "Human" ? manualDriver : evDriver,
        }));

        submitForm(seed, inits, speed);
    }

    $effect(() => {
        if (overrideSeed === false) {
            seed = Math.floor(Math.random() * 2 ** 32);
        }
    });
</script>

<form {onsubmit}>
    <fieldset>
        <legend>Hadronize Setup</legend>

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
            {#each playerInputs.slice(0, playerCount) as player, index (index)}
                <div transition:slide class="player" id={`player${index}`}>
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
                        <select
                            id={`player${index}-type`}
                            bind:value={player.type}
                        >
                            <option value="Human">Human</option>
                            <option value="Bot">Bot</option>
                        </select>
                    </div>
                </div>
            {/each}
        </div>

        {#if enableSpeed}
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

        <details>
            <summary>Advanced </summary>

            <div class="overrideSeedContainer">
                <label for="seed">Override seed</label>

                <input
                    id="overrideSeed"
                    type="checkbox"
                    bind:checked={overrideSeed}
                />
            </div>

            <input
                id="seed"
                type="number"
                min="0"
                max={2 ** 32}
                step="1"
                disabled={!overrideSeed}
                bind:value={seed}
            />
        </details>

        <button type="submit">Start Game</button>
    </fieldset>
</form>

<style lang="scss">
    fieldset {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    #players {
        display: flex;
        flex-direction: column;
        padding: 0.5rem;

        border: var(--border-width) solid var(--border-color);
        border-radius: var(--border-radius);

        .player {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 0.2rem;

            .player-input {
                display: flex;
                flex: 1;
                flex-direction: column;
            }
        }
    }

    .overrideSeedContainer {
        display: flex;
        align-items: center;
        justify-content: start;

        input[type="checkbox"] {
            width: 1em;
            height: 1em;
        }

        label {
            margin-top: 0;
            margin-right: 0.7rem;
            width: fit-content;
        }
    }
</style>
