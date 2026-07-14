<script lang="ts">
    import type { Flavor, Quark, QuarkStatus } from "../Quark.ts";

    import { blur } from "svelte/transition";
    import { Spring } from "svelte/motion";
    import { cubicOut } from "svelte/easing";

    interface Props {
        quark: Quark;
        status: QuarkStatus;
        text: string;
        x: number;
        y: number;
        size: number;
        onmousedown?: () => void;
    }

    let { quark, status, text, x, y, size, onmousedown }: Props = $props();

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

    let pos = new Spring({ x: 0, y: 0 }, { stiffness: 0.08, damping: 0.6 });

    $effect(() => {
        pos.set({ x, y });
    });
</script>

<span
    id="quark-{quark.index}"
    class="quark"
    data-status={status}
    style:left="{pos.current.x}px"
    style:top="{pos.current.y}px"
    style:width="{size}px"
    style:height="{size}px"
    {onmousedown}
    role="button"
    tabindex="0"
>
    <span class="bg" style:--flavor-color={flavorColor}></span>
    <span
        class="superposed-bg"
        style:--superpos1={superpos1}
        style:--superpos2={superpos2}
        style:--superpos3={superpos3}
    >
    </span>
    {#key text}
        <span
            transition:blur={{
                duration: 240,
                easing: cubicOut,
                amount: "2px",
                delay: 0,
            }}
            class="letter"
            style:font-size="{size / 25}rem">{text}</span
        >
    {/key}
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

        transform: scale(1);
        opacity: 1;
        transition-duration: 0.3s;
        transition-timing-function: var(--timing);
        transition-property: transform, opacity;

        &[data-status="latent"] {
            transform: scale(0);
            opacity: 0;
        }

        .bg,
        .superposed-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            transition: opacity 0.4s var(--timing);
        }

        .bg {
            opacity: 0;
            z-index: 1;
            background: var(--flavor-color);
            border: 2px solid color-mix(var(--flavor-color) 90%, black);
            transition-property: background, opacity, border;
        }

        .superposed-bg {
            z-index: 2;

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

        &[data-status="collapsed"],
        &[data-status="hadronized"] {
            .bg {
                opacity: 1;
            }
            .superposed-bg {
                opacity: 0;
            }
        }

        &[data-status="hadronized"] {
            .bg {
                background: #dbd9d9;
                border: 2px dashed #595757;
            }
        }

        .letter {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;

            color: white;
            text-align: center;
            text-shadow: 1px 1px slategray;
        }
    }
</style>
