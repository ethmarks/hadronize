<script lang="ts">
    import Game from "../../lib/components/Game.svelte";
    import InputForm from "../../lib/components/InputForm.svelte";

    import type { PlayerInit } from "../../lib/Player.ts";

    import { mount, unmount } from "svelte";

    let gameContainer: HTMLElement;
    let gameInstance: ReturnType<typeof Game>;

    let gameStarted: boolean = $state(false);

    const ENABLE_SPEED = false;

    function mountGame(
        seed: number,
        playerInits: PlayerInit[],
        speed?: number,
    ) {
        gameStarted = true;

        if (gameInstance) unmount(gameInstance);

        gameInstance = mount(Game, {
            target: gameContainer,
            props: { gameParams: [seed, playerInits], speed: speed ?? 1 },
        });
    }

    async function exitGame() {
        gameStarted = false;

        // Wait for game close animations to finish
        const ANIMATION_MS = 1300;
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_MS));

        if (gameInstance) unmount(gameInstance);
    }
</script>

<svelte:head>
    <title>Play Hadronize</title>
</svelte:head>

<main class={gameStarted ? "started" : ""}>
    <div id="endGame">
        <button onclick={exitGame}>Exit Game</button>
    </div>

    <div id="setup">
        <InputForm submitForm={mountGame} enableSpeed={ENABLE_SPEED} />
    </div>

    <div id="gameContainer" bind:this={gameContainer}></div>
</main>

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
        body > #content {
            footer {
                transition:
                    opacity 0.4s 1s cubic-bezier(0.4, 0, 0.2, 1),
                    border-top-color 0.4s 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            &:has(.started) {
                footer {
                    border-top-color: transparent;
                    opacity: 0;
                }
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
        #setup {
            transition: clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #gameContainer {
            transition: clip-path 0.9s 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #endGame {
            transition: clip-path 0.4s 1.1s cubic-bezier(0.4, 0, 0.2, 1);
        }
    }
</style>
