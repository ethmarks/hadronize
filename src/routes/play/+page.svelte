<script lang="ts">
    import { slide } from "svelte/transition";
    import Game from "../../lib/components/Game.svelte";
    import InputForm from "../../lib/components/InputForm.svelte";

    import {
        preloadSounds,
        decodeSounds,
        playSound,
    } from "../../lib/ui/sound.svelte.ts";
    import { validatePlayerInits, type PlayerInit } from "../../lib/Player.ts";

    import { mount, onMount, unmount } from "svelte";
    import type { QuarkStyle } from "$lib/components/Quark.svelte";

    let gameContainer: HTMLElement;
    let gameInstance: ReturnType<typeof Game> | undefined = undefined;

    let gameStarted: boolean = $state(false);
    let quarkStyle: QuarkStyle = $state("solid");

    let errorMsg: string = $state("");

    async function submitForm(
        seed: number,
        inits: PlayerInit[],
        speed: number,
        inputQuarkStyle: QuarkStyle,
    ) {
        // This is the first guaranteed user interaction, so we hijack it to
        // decode the sounds
        await decodeSounds();

        errorMsg = "";

        try {
            validatePlayerInits(inits);
        } catch (err) {
            errorMsg =
                "Player names are not valid! Remember that you can't have duplicate player names.";
        }

        // Only mount game if there weren't any error messages
        if (errorMsg !== "") return;

        quarkStyle = inputQuarkStyle;

        mountGame(seed, inits, speed);
    }

    let aborter: AbortController;

    function mountGame(seed: number, inits: PlayerInit[], speed?: number) {
        // Don't start a new game while another one is still running
        if (gameInstance) return;

        gameStarted = true;

        playSound("start.ogg");

        aborter = new AbortController();

        gameInstance = mount(Game, {
            target: gameContainer,
            props: {
                gameParams: [seed, inits],
                speed: speed ?? 1,
                abortSignal: aborter.signal,
            },
        });
    }

    async function exitGame() {
        gameStarted = false;

        playSound("close.ogg");

        aborter.abort();

        // Wait for game close animations to finish
        const ANIMATION_MS = 500;
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_MS));

        if (gameInstance) unmount(gameInstance);
        gameInstance = undefined;
    }

    onMount(() => {
        preloadSounds();
    });
</script>

<svelte:head>
    <title>Play | Hadronize</title>
</svelte:head>

<h2>Play</h2>

<div id="container" class={gameStarted ? "started" : ""}>
    <div id="setup">
        <InputForm {submitForm} />

        {#if errorMsg}
            <blockquote transition:slide class="msg">
                <p class="errorMsg">{errorMsg}</p>
            </blockquote>
        {/if}
    </div>

    <div
        id="gameContainer"
        data-quark-style={quarkStyle}
        bind:this={gameContainer}
    ></div>

    <div id="endGame">
        <button onclick={exitGame}>Exit Game</button>
    </div>
</div>

<style lang="scss">
    #gameContainer {
        --top: 4rem;
        --bottom: 2rem;
        --sides: 5rem;
        position: absolute;
        width: calc(100% - var(--sides) * 2);
        height: calc(100% - var(--top) - var(--bottom));
        left: var(--sides);
        top: var(--top);

        border-radius: 2rem;

        &:not(:has(:global(#game))) {
            pointer-events: none;
        }

        @media (width <= 50rem) {
            --sides: 0.3rem;
        }
    }

    #endGame {
        position: absolute;
        width: 100%;
        top: calc(100% - 3em);
        left: 0;
        display: grid;
        place-content: center;

        z-index: 1000;
    }

    .errorMsg {
        color: #fc0032;
    }

    /* Animation Stuff */

    #setup {
        clip-path: xywh(0 0 100% 100% round 0);
    }

    #gameContainer {
        clip-path: xywh(50% 50% 0 0 round 1rem);
    }

    #endGame {
        clip-path: xywh(50% 0 0 0);
    }

    :global {
        html:has(.started) {
            overflow-y: hidden;

            #content > footer {
                border-top-color: transparent;
                opacity: 0;
            }
        }
    }

    .started {
        #setup {
            clip-path: xywh(50% 95% 0 0 round 2rem);
        }

        #gameContainer {
            clip-path: xywh(0 0 100% 100% round 2rem);
        }

        #endGame {
            clip-path: xywh(0 0 100% 100%);
        }
    }

    @media (prefers-reduced-motion: no-preference) {
        /** In animations */

        .started {
            #setup {
                transition: clip-path 0.5s var(--timing);
            }
            #gameContainer {
                transition: clip-path 0.9s 0.4s var(--timing);
            }
            #endGame {
                transition: clip-path 0.4s 1.1s var(--timing);
            }
        }

        :global(body > #content:has(.started) > footer) {
            transition:
                opacity 0.4s 1s var(--timing),
                border-top-color 0.4s 0.4s var(--timing);
        }

        /** Out animations */

        #setup {
            transition: clip-path 0.5s var(--timing);
        }

        #gameContainer {
            transition: clip-path 0.5s var(--timing);
        }

        #endGame {
            transition: clip-path 0.4s 0.2s var(--timing);
        }

        :global(body > #content > footer) {
            transition: opacity 0.4s 0.2s var(--timing);
        }
    }
</style>
