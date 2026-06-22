<script lang="ts">
    import { base } from "$app/paths";
    import { main } from "$lib/cli";
    import { MAX_PLAYERS, MIN_PLAYERS } from "$lib/Hadronize";
    import {
        validatePlayerInits,
        type Driver,
        type PlayerInit,
    } from "$lib/Player";
    import { consoleDriver } from "$lib/utils/consoleDriver";
    import { hadronizeDriver } from "$lib/utils/hadronizeDriver";
    import sl from "$lib/utils/styledLog";

    import { onMount } from "svelte";

    let seed: number = $state(0);

    let playerCount: number = $state(2);

    let playerInputs: { name: string; type: "human" | "bot" }[] = $state([
        { name: "Alice", type: "human" },
        { name: "Bob", type: "bot" },
        { name: "Charlie", type: "bot" },
        { name: "David", type: "bot" },
        { name: "Eve", type: "bot" },
        { name: "Frank", type: "bot" },
    ]);

    let playerInits: PlayerInit[] = $derived(
        playerInputs.slice(0, playerCount).map((p) => {
            return {
                name: p.name,
                driver: p.type === "human" ? consoleDriver : hadronizeDriver,
            };
        }),
    );

    let errorMsg: string = $state("");

    async function startMain() {
        errorMsg = "";

        sl([["Setup form submitted! Starting Hadronize...", "gray"]]);

        try {
            validatePlayerInits(playerInits);
        } catch (err) {
            errorMsg =
                "Player names are not valid! Remember that you can't have duplicate player names.";
        }

        // Return early if there was an error message.
        if (errorMsg !== "") {
            sl([["Setup form was not valid!", "red"]]);
            return;
        }

        sl([["Have fun!", "green"]]);
        sl([""]);

        await main(
            {
                abbreviate: false,
                showEmpty: false,
                showPlayerOrder: true,
                showPreviousObservation: true,
            },
            [seed, playerInits],
        );
    }

    onMount(async () => {
        seed = Math.floor(Math.random() * 2 ** 32);

        sl([["Welcome to Hadronize!", "blue"]]);
        sl([["Waiting on setup form...", "gray"]]);
    });
</script>

<svelte:head>
    <title>Hadronize CLI</title>
</svelte:head>

<h1>Hadronize CLI</h1>
<a href="{base}/">Go home</a>
<p>
    Hadronize CLI is a tool that lets you play Hadronize entirely in your
    browser console!
</p>

<blockquote class="finehide">
    <p>
        NOTE: Your device appears to lack a mouse pointer, which suggests that
        you're using a mobile browser. Most mobile browsers do not allow you to
        open the console, which at this stage is required to use Hadronize CLI.
    </p>
    <p>
        I'm sorry if this is inconvenient, but please remember that Hadronize is
        still under heavy development and mobile support is not a priority for
        me right now.
    </p>
</blockquote>

<h2>Instructions</h2>
<ol>
    <li>
        Learn the Hadronize rules. These are not explained in the CLI, so you'll
        want to check out the <a
            href="https://github.com/ethmarks/hadronize#rules">README</a
        >.
    </li>
    <li>
        Fill out the setup form below. Decide how many players you want, then
        come up with names for each of them and specify whether they should be
        controlled by a human or by a bot.
    </li>
    <fieldset>
        <legend>Hadronize Setup</legend>

        <label for="seed">Seed (defaults to a random value)</label>
        <input type="number" id="seed" min="0" step="1" bind:value={seed} />

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
                        <select
                            id={`player${index}-type`}
                            bind:value={player.type}
                        >
                            <option value="human">Human</option>
                            <option value="bot">Bot</option>
                        </select>
                    </div>
                </div>
            {/each}
        </div>

        <button onclick={startMain}>Start Hadronize</button>

        {#if errorMsg !== ""}
            <p class="errorMsg">{errorMsg}</p>
        {/if}
    </fieldset>
    <li>
        Open your browser console with <kbd>F12</kbd>.
    </li>
    <li>
        On each turn, info about the current game state will be logged to the
        console.
    </li>
    <li>
        To take a turn, just type the name of the player that you want to select
        to be the observer into the console. It should Just Work™, but keep in
        mind that it is case-sensitive.
    </li>
    <li>Keep taking turns until someone wins.</li>
</ol>

<style lang="scss">
    /** This is only visible on mobile */
    @media (pointer: fine) {
        .finehide {
            display: none;
        }
    }

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

    .errorMsg {
        color: #dc143c;
    }
</style>
