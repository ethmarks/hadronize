<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Game from "../../lib/components/Game.svelte";

    import type { PlayerInit } from "../../lib/Player.ts";

    import { mount, unmount } from "svelte";
    import InputForm from "$lib/components/InputForm.svelte";

    let gameContainer: HTMLElement;
    let gameInstance: ReturnType<typeof Game>;

    function mountGame(seed: number, playerInits: PlayerInit[], speed: number) {
        if (gameInstance) unmount(gameInstance);

        gameInstance = mount(Game, {
            target: gameContainer,
            props: { gameParams: [seed, playerInits], speed },
        });
    }
</script>

<svelte:head>
    <title>Play Hadronize</title>
</svelte:head>

<Reset />

<header>
    <nav>
        <a href="/">Home</a>
        <a href="https://github.com/ethmarks/hadronize">GitHub</a>
    </nav>
    <h1>Hadronize</h1>
</header>

<InputForm {mountGame} />

<div id="gameContainer" bind:this={gameContainer}></div>

<style lang="scss">
    :global(body) {
        overflow: hidden;
        height: 100vh;

        background: rgb(32, 33, 36);
        color: white;
    }

    header {
        --margin-sides: 1rem;
        margin-inline: var(--margin-sides);
        width: calc(100% - var(--margin-sides) * 2);

        display: flex;
        flex-direction: row;
        align-items: center;
        height: 2.5rem;
        position: relative;

        h1 {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 2.5rem;
            z-index: 0;
        }

        nav {
            z-index: 1;
        }
    }

    #gameContainer {
        --top: 3rem;
        --bottom: 2rem;
        --sides: 5rem;
        position: absolute;
        width: calc(100% - var(--sides) * 2);
        height: calc(100% - var(--top) - var(--bottom));
        left: var(--sides);
        top: var(--top);

        &:not(:has(:global(main))) {
            pointer-events: none;
        }

        :global(main) {
            border-radius: 2rem;
            animation: gameEntrance 0.9s 0.4s cubic-bezier(0.4, 0, 0.2, 1)
                backwards;
        }
    }

    @keyframes gameEntrance {
        from {
            clip-path: xywh(50% 50% 0 0 round 1rem);
        }
        to {
            clip-path: xywh(0 0 100% 100% round 1rem);
        }
    }
</style>
