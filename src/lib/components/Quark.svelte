<script module lang="ts">
    export const QUARK_STYLES = ["solid", "patterned"] as const;
    export type QuarkStyle = (typeof QUARK_STYLES)[number];
</script>

<script lang="ts">
    import type { Flavor, Quark, QuarkStatus } from "../Quark.ts";

    import { blur, fade } from "svelte/transition";
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

    const flavors: (Flavor | "hadron")[] = $derived(
        status === "hadronized"
            ? ["hadron"]
            : status === "collapsed"
              ? [quark.flavor]
              : quark.superposition,
    );

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
    <div class="bgs">
        {#each flavors as flavor, index (`${flavor}-${index}`)}
            <span
                transition:fade={{ duration: 400, easing: cubicOut }}
                class="bg {flavors.length > 1 ? `third-${index}` : undefined}"
                data-flavor={flavor}
            ></span>
        {/each}
    </div>
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
    }

    :global([data-quark-style="patterned"]) {
        .bg {
            background-image: var(--pattern);
        }
    }

    .bg {
        position: absolute;
        z-index: 1;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;

        background-color: var(--color);
        background-size:
            8px 8px,
            cover;
        border: 2px solid color-mix(var(--color) 90%, black);

        &[data-flavor="up"] {
            --color: #5dafef;
            --pattern: repeating-linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.4),
                rgba(255, 255, 255, 0.4) 4px,
                transparent 4px,
                transparent 8px
            );
        }

        &[data-flavor="down"] {
            --color: #e5c07b;
            --pattern: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.15),
                rgba(0, 0, 0, 0.15) 3px,
                transparent 3px,
                transparent 7px
            );
        }

        &[data-flavor="charm"] {
            --color: #4db6ac;
            --pattern:
                linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0.3) 25%,
                    transparent 25%
                ),
                linear-gradient(
                    225deg,
                    rgba(255, 255, 255, 0.3) 25%,
                    transparent 25%
                ),
                linear-gradient(
                    45deg,
                    rgba(255, 255, 255, 0.3) 25%,
                    transparent 25%
                ),
                linear-gradient(
                    315deg,
                    rgba(255, 255, 255, 0.3) 25%,
                    transparent 25%
                );
            background-size: 10px 10px;
        }

        &[data-flavor="strange"] {
            --color: #98c379;
            --pattern:
                linear-gradient(
                    45deg,
                    rgba(0, 0, 0, 0.1) 25%,
                    transparent 25%,
                    transparent 75%,
                    rgba(0, 0, 0, 0.1) 75%
                ),
                linear-gradient(
                    45deg,
                    rgba(0, 0, 0, 0.1) 25%,
                    transparent 25%,
                    transparent 75%,
                    rgba(0, 0, 0, 0.1) 75%
                );
            background-size: 8px 8px;
            background-position:
                0 0,
                2px 2px;
        }

        &[data-flavor="top"] {
            --color: #c678dd;
            --pattern: radial-gradient(rgba(0, 0, 0, 0.2) 15%, transparent 16%);
        }

        &[data-flavor="bottom"] {
            --color: #ef657a;

            --pattern: repeating-radial-gradient(
                circle at center,
                transparent,
                transparent 4px,
                rgba(255, 255, 255, 0.35) 4px,
                rgba(255, 255, 255, 0.35) 7px
            );
        }

        &[data-flavor="hadron"] {
            --color: #dbd9d9;
            --pattern: none;
        }

        &.third-0 {
            mask-image: conic-gradient(
                black 0deg 120deg,
                transparent 120deg 240deg,
                transparent 240deg 360deg
            );
        }

        &.third-1 {
            mask-image: conic-gradient(
                transparent 0deg 120deg,
                black 120deg 240deg,
                transparent 240deg 360deg
            );
        }

        &.third-2 {
            mask-image: conic-gradient(
                transparent 0deg 120deg,
                transparent 120deg 240deg,
                black 240deg 360deg
            );
        }
    }

    .letter {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
        line-height: 1.6;

        color: white;
        text-align: center;
        text-shadow: 1px 1px slategray;

        font-family:
            "Degheest", system-ui, "Segoe UI", Roboto, Helvetica, Arial,
            sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    }
</style>
