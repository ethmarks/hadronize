<script lang="ts">
    import { base } from "$app/paths";
    import { main } from "$lib/cli";
    import { consoleDriver } from "$lib/utils/consoleDriver";

    import { onMount } from "svelte";

    onMount(async () => {
        await main(
            {
                abbreviate: false,
                showEmpty: false,
                showPlayerOrder: true,
                showPreviousObservation: true,
            },
            [
                Math.floor(Math.random() * 2 ** 32),
                [
                    { name: "alice", driver: consoleDriver },
                    { name: "bob", driver: consoleDriver },
                ],
            ],
        );
    });
</script>

<svelte:head>
    <title>Hadronize CLI</title>
</svelte:head>

<h1>Hadronize CLI</h1>
<a href="{base}/">Go home</a>
<p>
    <strong
        >Open your browser console (<kbd>F12</kbd>) to play Hadronize CLI.</strong
    >
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
</ol>

<style>
    /** This hides the mobile-only*/
    @media (pointer: fine) {
        .finehide {
            display: none;
        }
    }
</style>
