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

<InputForm {mountGame} />

<div id="gameContainer" bind:this={gameContainer}></div>

<style lang="scss">
    :global(body) {
        overflow: hidden;
        height: 100vh;

        background: rgb(32, 33, 36);
        color: white;
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
