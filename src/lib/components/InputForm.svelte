<script lang="ts">
    import { MIN_PLAYERS, MAX_PLAYERS } from "../Hadronize.ts";
    import type { Driver, PlayerInit } from "../Player.ts";
    import { QUARK_STYLES, type QuarkStyle } from "./Quark.svelte";

    import { manualDriver } from "../drivers/manual.ts";
    import { fetchPlayerTypes } from "../ui/playerTypes.ts";
    import { type DriverProgram } from "../drivers/stockDrivers.ts";
    import { quickjsDriverFactory } from "../drivers/quickjs.ts";

    import { slide } from "svelte/transition";

    interface Props {
        submitForm: (
            seed: number,
            inits: PlayerInit[],
            speed: number,
            quarkStyle: QuarkStyle,
        ) => void;
    }

    let { submitForm }: Props = $props();

    let playerCount: number = $state(3);
    let playerInputs: { name: string; type: string }[] = $state([
        { name: "Alice", type: "manual" },
        { name: "Bob", type: "ev" },
        { name: "Charlie", type: "ev" },
        { name: "David", type: "ev" },
        { name: "Eve", type: "ev" },
        { name: "Frank", type: "ev" },
    ]);

    let seed: number = $state(1);
    let overrideSeed: boolean = $state(false);
    const randomizeSeed = () => (seed = Math.floor(Math.random() * 2 ** 32));

    let speed: number = $state(1);

    let quarkStyle: QuarkStyle = $state("solid");

    // this will run once on the server during prerendering and once every time
    // the user loads the page. During prerendering it will return the stock
    // programs, and at runtime it will return the localstorage contents.
    let playerTypes: DriverProgram[] = fetchPlayerTypes();

    const capitalizer = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1);

    const getDriver = (id: string): Driver => {
        const program = playerTypes.find((program) => program.id === id);
        if (program === undefined)
            throw new Error(`couldn't find driver program for '${id}'`);
        return quickjsDriverFactory(program.code);
    };

    function onsubmit() {
        const inits = playerInputs.slice(0, playerCount).map((p) => ({
            name: p.name,
            driver: p.type === "manual" ? manualDriver : getDriver(p.type),
        }));

        submitForm(seed, inits, speed, quarkStyle);

        if (overrideSeed === false) randomizeSeed();
    }

    $effect(() => {
        if (overrideSeed === false) randomizeSeed();
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
                            <option
                                value="manual"
                                title="Manually controlled player. Drag the quark on desktop or tap a chamber on mobile, or you can use the browser console."
                                >Human</option
                            >
                            {#each playerTypes as program}
                                <option
                                    value={program.id}
                                    title={program.description}
                                    >{program.name} (bot)</option
                                >
                            {/each}
                        </select>
                    </div>
                </div>
            {/each}
        </div>

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

            <label for="speed">Animation speed</label>
            <input
                id="speed"
                type="number"
                min="0"
                max="50"
                step="1"
                bind:value={speed}
            />

            <label for="quark-style">Quark style</label>
            <select id="quark-style" bind:value={quarkStyle}>
                {#each QUARK_STYLES as style}
                    <option value={style}>{capitalizer(style)}</option>
                {/each}
            </select>
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
