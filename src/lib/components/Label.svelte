<script module lang="ts">
    export interface LabelProps {
        text: string;
        x: number;
        y: number;
        color: string;
        fontSizeRem: number;
    }
</script>

<script lang="ts">
    import { Spring } from "svelte/motion";

    let { text, x, y, color, fontSizeRem }: LabelProps = $props();

    let pos = new Spring({ x: 0, y: 0 }, { stiffness: 0.08, damping: 0.6 });

    $effect(() => {
        pos.set({ x, y });
    });
</script>

<p
    class="label"
    style:left="{pos.current.x}px"
    style:top="{pos.current.y}px"
    style:color
    style:font-size="{fontSizeRem}rem"
>
    {text}
</p>

<style lang="scss">
    .label {
        margin: 0;
        position: absolute;
        transform: translate(-50%, -50%);

        transition: color 0.3s var(--timing);
        user-select: none;
    }
</style>
