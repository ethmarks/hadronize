<script module lang="ts">
    export interface LabelProps {
        text: string;
        x: number;
        y: number;
        status: "passive" | "active" | "hidden" | "yay" | "popup";
        fontSizeRem: number;
    }
</script>

<script lang="ts">
    import { Spring } from "svelte/motion";
    import { fade } from "svelte/transition";

    let { text, x, y, status, fontSizeRem }: LabelProps = $props();

    // svelte-ignore state_referenced_locally
    let pos = new Spring({ x, y }, { stiffness: 0.08, damping: 0.6 });

    $effect(() => {
        pos.set({ x, y });
    });
</script>

<p
    class="label"
    style:left="{pos.current.x}px"
    style:top="{pos.current.y}px"
    style:font-size="{fontSizeRem}rem"
    data-status={status}
    transition:fade={{ duration: 300 }}
>
    {text}
</p>

<style lang="scss">
    .label {
        margin: 0;
        position: absolute;
        transform: translate(-50%, -50%);

        text-shadow: 2px 2px rgba(0, 0, 0, 0.2);

        transition:
            color 0.3s var(--timing),
            text-shadow 0.3s var(--timing);
        user-select: none;
    }

    [data-status="passive"] {
        color: #111;
    }
    [data-status="active"] {
        color: #f2b74b;
    }
    [data-status="hidden"] {
        color: transparent;
        text-shadow: none;
    }
    [data-status="yay"] {
        color: #98c379;
    }
    [data-status="popup"] {
        color: rgb(68, 147, 248);
    }
</style>
