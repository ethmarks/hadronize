<script module>
    import { FLAVORS } from "../Quark.ts";

    export const SECTIONS = [...FLAVORS, "hadron"] as const;
    export type Section = (typeof SECTIONS)[number];

    export interface Rect {
        width: number;
        height: number;
        top: number;
        left: number;
    }

    const emptyRect: () => Rect = () => {
        return {
            width: 0,
            height: 0,
            top: 0,
            left: 0,
        };
    };

    function elToRect(el: Element): Rect {
        const bound = el.getBoundingClientRect();
        return {
            width: bound.width,
            height: bound.height,
            top: bound.top,
            left: bound.left,
        };
    }
</script>

<script lang="ts">
    import type { Player } from "../Player.ts";

    interface Props {
        owner: Player;
        setSections: (rects: Partial<Record<Section, Rect>>) => void;
    }

    let { owner, setSections }: Props = $props();

    let els = $state<Partial<Record<Section, Element>>>({});

    let sections = $derived.by(() => {
        const sections: Partial<Record<Section, Rect>> = {};

        for (const key in els) {
            const el = els[key as Section];
            if (el) {
                sections[key as Section] = elToRect(el);
            }
        }
        return sections;
    });

    $effect(() => {
        setSections(sections);
    });
</script>

<div class="chamber" id="chamber-{owner.order}">
    {#each SECTIONS as section}
        <div
            bind:this={els[section]}
            class="section"
            id="chamber-{owner.order}-section-{section}"
        ></div>
    {/each}
</div>

<style lang="scss">
    .chamber {
        width: fit-content;
        height: calc(170px);
        border-radius: 1rem;
        background-color: slategray;

        display: flex;

        .section {
            width: 50px;
            margin: 1rem;
            display: flex;
            flex: 1;
        }
    }
</style>
