<script lang="ts">
    import type { Flavor, Quark } from "../Quark.ts";

    interface Props {
        quark: Quark;
    }

    let { quark }: Props = $props();

    const COLOR_MAP: Record<Flavor, string> = {
        up: "#5dafef", // blue
        down: "#e5c07b", // yellow
        charm: "#4db6ac", // cyan
        strange: "#98c379", // green
        top: "#c678dd", // magenta
        bottom: "#ef657a", // red
    };

    let flavorColor: string = $derived(COLOR_MAP[quark.flavor]);
    const visibleClass: string = $derived(quark.isProduced ? "visible" : "");

    const letter = $derived(quark.flavor.slice(0, 1));
</script>

<span
    id="quark-{quark.index}"
    style:--flavor-color={flavorColor}
    class={["quark", visibleClass].join(" ")}
>
    <span class="letter">{letter}</span>
</span>

<style lang="scss">
    .quark {
        display: flex;
        width: 50px;
        height: 50px;

        background-color: var(--flavor-color);
        border-radius: 50%;

        &:not(.visible) {
            display: none;
        }

        .letter {
            width: 100%;
            text-align: center;
            color: white;
            font-size: 2rem;
        }
    }
</style>
