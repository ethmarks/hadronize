<script module lang="ts">
    export interface DropIndicatorDTO {
        active: boolean;
        x: number;
        y: number;
        radius: number;
    }
</script>

<script lang="ts">
    let { active, x, y, radius }: DropIndicatorDTO = $props();
</script>

<div
    class="dropIndicator {active ? 'active' : ''}"
    style:left="{x - radius}px"
    style:top="{y - radius}px"
    style:width="{radius * 2}px"
    style:height="{radius * 2}px"
></div>

<style lang="scss">
    .dropIndicator {
        position: absolute;

        z-index: 0;

        border-radius: 50%;
        background: rgba(0, 0, 0, 0.3);
        border: dashed slategray;

        opacity: 0;
        transform: scale(0.5);
        transition-duration: 0.3s;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-property: transform, opacity;

        &.active {
            transform: scale(1);
            opacity: 1;
        }
    }
</style>
