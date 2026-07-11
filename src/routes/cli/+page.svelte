<script lang="ts">
    import { type Result } from "../../lib/Hadronize.ts";
    import { validatePlayerInits, type PlayerInit } from "../../lib/Player.ts";

    import { main } from "../../lib/cli/main.ts";
    import sl, { type slChunk } from "../../lib/cli/styledLog.ts";

    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import InputForm from "$lib/components/InputForm.svelte";

    // For storing error messages from any source to display in the errorMsg
    // text at the Bottom of the fieldset.
    let errorMsg: string = $state("");

    let status: "not started" | Result = $state("not started");

    let endgameChunks: slChunk[] = $state([]);

    async function startMain(seed: number, inits: PlayerInit[]) {
        errorMsg = "";

        sl([["Setup form submitted! Starting Hadronize...", "gray"]]);

        try {
            validatePlayerInits(inits);
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

        status = undefined;

        endgameChunks = await main(
            {
                abbreviate: false,
                showEmpty: false,
                showPlayerOrder: true,
                showPreviousObservation: true,
            },
            [seed, inits],
            (result: Result) => (status = result),
        );
    }

    function printWelcome() {
        sl([["Welcome to Hadronize!", "blue"]]);
        sl([["Waiting on setup form...", "gray"]]);
    }

    onMount(() => {
        printWelcome();
    });
</script>

<svelte:head>
    <title>Hadronize CLI</title>
</svelte:head>

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
        Complete the setup, such as choosing a seed and specifying the player
        names and types. You can either do this using the form below or in the
        browser console.
    </li>

    <InputForm submitForm={startMain} disabled={status !== "not started"} />

    {#if errorMsg || status !== "not started"}
        <blockquote class="msg">
            {#if errorMsg !== ""}
                <p class="errorMsg">{errorMsg}</p>
            {:else if status === undefined}
                <p>
                    Hadronize is running! Open your browser console with <kbd
                        >F12</kbd
                    >
                </p>
            {:else if status !== "not started"}
                <p>
                    {@html sl(endgameChunks, "html", false)}
                </p>
            {/if}
        </blockquote>
    {/if}

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

    .errorMsg {
        color: #dc143c;
    }
</style>
