<script lang="ts">
    import { onMount } from "svelte";
    import type { Flavor, Quark, QuarkStatus } from "../Quark.ts";
    import { Spring } from "svelte/motion";

    interface Props {
        quark: Quark;
        status: QuarkStatus;
        x: number;
        y: number;
        onmousedown?: () => void;
    }

    let { quark, status, x, y, onmousedown }: Props = $props();

    const COLOR_MAP: Record<Flavor, string> = {
        up: "#5dafef", // blue
        down: "#e5c07b", // yellow
        charm: "#4db6ac", // cyan
        strange: "#98c379", // green
        top: "#c678dd", // magenta
        bottom: "#ef657a", // red
    };

    let flavorColor: string = $derived(COLOR_MAP[quark.flavor]);

    let superpos1: string = $derived(COLOR_MAP[quark.superposition[0]]);
    let superpos2: string = $derived(COLOR_MAP[quark.superposition[1]]);
    let superpos3: string = $derived(COLOR_MAP[quark.superposition[2]]);

    let letter = $derived(quark.flavor.slice(0, 1));

    let pos = new Spring({ x: 0, y: 0 }, { stiffness: 0.08, damping: 0.6 });

    $effect(() => {
        pos.set({ x, y });
    });

    onMount(() => {
        pos.set({
            x: window.innerWidth / 2 - 25,
            y: window.innerHeight / 2 - 25,
        });
    });
</script>

<span
    id="quark-{quark.index}"
    class="quark"
    data-status={status}
    style:left="{pos.current.x}px"
    style:top="{pos.current.y}px"
    {onmousedown}
    role="button"
    tabindex="0"
>
    <span
        class="bg"
        style:--flavor-color={flavorColor}
        style:--superpos1={superpos1}
        style:--superpos2={superpos2}
        style:--superpos3={superpos3}
    ></span>
    <span class="letter">{letter}</span>
</span>

<style lang="scss">
    * {
        user-select: none;
    }

    :global(main:not(.grabbing) .quark[data-status="superposed"]:hover) {
        cursor: grab;
    }

    .quark {
        position: absolute;
        display: flex;

        width: 50px;
        height: 50px;

        &[data-status="latent"] {
            display: none;
        }

        &[data-status="superposed"] {
            .bg {
                /* This looks much nicer, but IMO it's more difficult to distinguish between colors and is less useful for UX. */
                /* background: conic-gradient(
                    var(--superpos1),
                    var(--superpos2),
                    var(--superpos3),
                    var(--superpos1)
                ); */

                background: conic-gradient(
                    var(--superpos1) 0deg 120deg,
                    var(--superpos2) 120deg 240deg,
                    var(--superpos3) 240deg 360deg
                );
                filter: blur(2px);
            }
        }

        .bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            border-radius: 50%;
            background-color: var(--flavor-color);
        }

        .letter {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;

            color: white;
            font-size: 2rem;
            text-align: center;
            text-shadow: 1px 1px slategray;
        }
    }
</style>
