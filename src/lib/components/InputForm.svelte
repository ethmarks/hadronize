<script lang="ts">
    import { MIN_PLAYERS, MAX_PLAYERS } from "../Hadronize.ts";
    import type { PlayerInit } from "../Player.ts";

    import { prngDriver } from "../drivers/prng.ts";
    import { evDriver } from "../drivers/ev.ts";
    import { manualDriver } from "../drivers/manual.ts";
    import { onMount } from "svelte";

    interface Props {
        submitForm: (seed: number, inits: PlayerInit[], speed?: number) => void;

        disabled?: boolean;
        enableSpeed?: boolean;
    }

    let { submitForm, disabled, enableSpeed }: Props = $props();

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

        submitForm(seed, inits, speed);
    }

    onMount(() => {
        seed = Math.floor(Math.random() * 2 ** 32);
    });
</script>

<form {onsubmit}>
    <fieldset>
        <legend>Hadronize Setup</legend>
        <label for="seed">Seed (defaults to a random value)</label>

        <input
            id="seed"
            type="number"
            min="0"
            max={2 ** 32}
            step="1"
            required
            bind:value={seed}
            {disabled}
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
            {disabled}
        />

        <div id="players" class={disabled ? "disabled" : ""}>
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
                            {disabled}
                        />
                    </div>

                    <div class="player-input">
                        <label for={`player${index}-type`}
                            >{player.name}'s type</label
                        >
                        <select
                            id={`player${index}-type`}
                            bind:value={player.type}
                            {disabled}
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

        <button type="submit" {disabled}>Start Game</button>
    </fieldset>
</form>

<style lang="scss">
    fieldset {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;

        &:has([disabled]) {
            label {
                opacity: 0.5;
            }
        }
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
</style>
