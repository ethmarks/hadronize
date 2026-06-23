<script lang="ts">
    import { MAX_PLAYERS, MIN_PLAYERS } from "$lib/Hadronize";
    import { validatePlayerInits, type PlayerInit } from "$lib/Player";
    import { prngDriver, manualDriver } from "$lib/drivers";

    import { main } from "$lib/cli/main";
    import sl from "$lib/cli/styledLog";
    import { getValidatedUserInput } from "$lib/cli/input";

    import { base } from "$app/paths";
    import { onMount } from "svelte";

    let seed: number = $state(0);

    let playerCount: number = $state(2);

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

    // For storing error messages from any source to display in the errorMsg
    // text at the Bottom of the fieldset.
    let errorMsg: string = $state("");

    // For storing the resolve function for all Promise<void> tricks.
    let resumeExecution: () => void;

    // Pretty self-explanatory, yeah?
    const specialValueString: string =
        "string that no user will enter that can be used as a special value but that is still a string type.";

    async function startMain() {
        errorMsg = "";

        if (typeof resumeExecution !== "undefined") resumeExecution();

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

    /**
     * Helper to solicit user input in the browser console via the
     * `window.r` property.
     */
    async function browserConsoleInput(): Promise<string> {
        let userInput: string = "";

        function respond(input: unknown) {
            if (typeof input === "string") {
                userInput = input;
            } else if (typeof input === "number") {
                userInput = input.toString();
            } else if (typeof input === "undefined") {
                userInput = "";
            } else {
                userInput = specialValueString;
            }

            resumeExecution();
        }

        // I would have liked to use the anonymous getter trick that I used
        // in the NBR CLI, but I don't think that setting `window.0` is a
        // good idea, especially because we'd have to do it for all 32-bit
        // numbers in order to allow all possible seed inputs to be inputted.
        //
        (window as any).r = respond;

        // Alternative syntax
        // Object.defineProperty(window, "r", {
        //     set(val) {
        //         respond(val);
        //     },
        //     configurable: true,
        // });

        await new Promise<void>((resolve) => {
            resumeExecution = resolve;
        });

        // Clean up
        delete (window as any)["r"];

        return userInput;
    }

    /**
     * Get the setup values from the console using getBrowserConsoleInput,
     * allowing users to set up a Hadronize game entirely from the browser
     * console without interacting with the webpage form.
     */
    async function setupViaConsole(): Promise<void> {
        // Seed
        const seedInput: string = await getValidatedUserInput(
            browserConsoleInput,
            [
                "What seed to use?",
                [" (enter an integer or leave blank for random)", "gray"],
            ],
            [
                ["Invalid seed!", "red"],
                " Enter a positive integer to use as the seed or leave blank for a random seed.",
            ],
            (input: string): boolean => {
                if (input === specialValueString) return false;
                if (input === "") return true;
                const num = Number(input);
                if (Number.isNaN(num)) return false;
                if (num < 1) return false;
                return true;
            },
        );
        if (seedInput !== "") {
            seed = Number(seedInput);
        }
        sl([
            ["Using seed ", "gray"],
            [seed.toString(), "yellow"],
            [".\n", "gray"],
        ]);

        // Player Count
        const playerCountInput: string = await getValidatedUserInput(
            browserConsoleInput,
            [
                "How many players?",
                [
                    ` (enter an integer between ${MIN_PLAYERS} and ${MAX_PLAYERS})`,
                    "gray",
                ],
            ],
            [
                ["Invalid player count!", "red"],
                ` Enter an integer between ${MIN_PLAYERS} and ${MAX_PLAYERS})`,
            ],
            (input: string): boolean => {
                if (input === specialValueString) return false;
                const num = Number(input);
                if (Number.isNaN(num)) return false;
                if (num < MIN_PLAYERS) return false;
                if (num > MAX_PLAYERS) return false;
                return true;
            },
        );
        playerCount = Number(playerCountInput);

        // Player Inits
        for (let i: number = 0; i < playerCount; i++) {
            const playerName: string = await getValidatedUserInput(
                browserConsoleInput,
                [
                    `What is the name of `,
                    [`player ${i}`, "magenta"],
                    "?",
                    [` (enter an string)`, "gray"],
                ],
                [
                    ["Invalid player name!", "red"],
                    ` Try only using letters, and ensure that there isn't already a player with that name.`,
                ],
                (input: string): boolean => {
                    if (input === specialValueString) return false;
                    if (
                        playerInputs.some(
                            (p, index) => p.name === input && index !== i,
                        )
                    )
                        return false;
                    return true;
                },
            );
            playerInputs[i].name = playerName;
            playerInputs = playerInputs;
            const playerType: string = await getValidatedUserInput(
                browserConsoleInput,
                [
                    `What player type is `,
                    [playerName, "magenta"],
                    "?",
                    [` (enter either "Human" or "Bot")`, "gray"],
                ],
                [
                    ["Invalid player type!", "red"],
                    ` Enter either "Human" or "Bot".`,
                ],
                (input: string): boolean => {
                    if (input === specialValueString) return false;
                    if (input.toLowerCase() === "human") return true;
                    if (input.toLowerCase() === "bot") return true;
                    return false;
                },
            );
            playerInputs[i].type =
                playerType.toLowerCase() === "human" ? "Human" : "Bot";
            playerInputs = playerInputs;

            sl([
                [`Player ${i} is named `, "gray"],
                [playerInputs[i].name, "yellow"],
                [" and is a ", "gray"],
                [playerInputs[i].type, "yellow"],
                [".\n", "gray"],
            ]);
        }

        await startMain();
    }

    onMount(async () => {
        seed = Math.floor(Math.random() * 2 ** 32);

        // Welcome to Hadronize!
        // To setup Hadronize in the console, use the r(myinput) syntax.
        // For example, to respond to the query below about setting the seed,
        // you could type r(42) to set the seed to the number 42. Remember to
        // add quotes for string inputs.
        sl([["Welcome to Hadronize!", "blue"]]);
        sl([
            ["To setup Hadronize in the console, use the ", "gray"],
            ["r", "magenta"],
            ["(", "white"],
            ["myinput", "blue"],
            [")", "white"],
            [" syntax.", "gray"],
        ]);
        sl([
            [
                "For example, to respond to the query below about setting the seed, \nyou could type ",
                "gray",
            ],
            ["r", "magenta"],
            ["(", "white"],
            ["42", "blue"],
            [")", "white"],
            [
                " to set the seed to the number 42. Remember to \nadd quotes for string inputs.",
                "gray",
            ],
        ]);

        await setupViaConsole();
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
        Complete out the setup, such as choosing a seed and specifying the
        players. You can either do this using the form below or in the browser
        console.
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
                            <option value="Human">Human</option>
                            <option value="Bot">Bot</option>
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
        Open your browser console with <kbd>F12</kbd> to start playing Hadronize.
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
