<script lang="ts">
    import Quark from "./Quark.svelte";
    import DropIndicator from "./DropIndicator.svelte";
    import Label, { type LabelProps } from "./Label.svelte";
    import { LayoutManager } from "../ui/layout.svelte.ts";
    import { MouseManager } from "../ui/mouse.svelte.ts";
    import { StoreManager } from "../ui/store.svelte.ts";
    import { LoopManager } from "../ui/loop.svelte.ts";

    import { Hadronize } from "../Hadronize.ts";

    import { type CliOptions } from "../cli/print.ts";

    import { mount, onMount, unmount } from "svelte";

    interface Props {
        gameParams: ConstructorParameters<typeof Hadronize>;
        speed: number;
        abortSignal?: AbortSignal;
    }

    let { gameParams, speed, abortSignal }: Props = $props();

    const CLI_OPT: CliOptions = {
        abbreviate: true,
        showEmpty: false,
        showPlayerOrder: true,
        showPreviousObservation: true,
    };

    // Game params will never change after component mounting so it's fine
    // if we only capture the initial value.
    //
    // svelte-ignore state_referenced_locally
    let game = new Hadronize(...gameParams);

    // We produce a superposed quark immediately because some of the
    // managers use a non-null assertion operator on game.superposedIndex.
    game.produceQuark();

    const store = new StoreManager(game);

    const layout = new LayoutManager(
        game,
        store.quarks,
        store.chambers,
        () => store.syncQuarks(),
        () => store.result,
    );

    const mouse = new MouseManager(
        store.chambers,
        () => store.superposed,
        layout,
        () => store.result,
    );

    let popupLabelContainer: HTMLElement;

    function makePopupLabel(text: string, ms: number = 500): void {
        // init
        const popupLabelProps: LabelProps = $state({
            text,
            status: "popup",
            x: layout.container.x,
            y: layout.container.y,
            fontSizeRem: 2.9,
        });
        const instance = mount(Label, {
            target: popupLabelContainer,
            props: popupLabelProps,
            intro: false,
        });

        // rise up
        popupLabelProps.y = layout.container.y - 70;

        // end
        setTimeout(() => {
            unmount(instance, { outro: true });
        }, ms);
    }

    const loop = new LoopManager(
        game,
        store,
        layout,
        mouse,
        () => speed,
        CLI_OPT,
        makePopupLabel,
        // svelte-ignore state_referenced_locally
        abortSignal,
    );

    onMount(async () => {
        layout.init();

        // It's important that we invoke the async start function without an
        // await so that it doesn't block onMount.
        loop.start();
    });
</script>

<svelte:window
    on:mousemove={(e: MouseEvent) => mouse.handleMouseEvent(e)}
    onmouseup={() => {
        mouse.superposedQuarkPressed = false;
        mouse.handleMouseUp();
    }}
/>

<div id="game" class={mouse.superposedQuarkPressed ? "grabbing" : ""}>
    <div id="quarks">
        {#each store.quarks as q, index}
            <Quark
                quark={game.quarks[q.index]}
                status={q.status}
                text={q.text}
                x={q.x}
                y={q.y}
                size={layout.quarkSize}
                onmousedown={() => {
                    if (index === store.superposed.index)
                        mouse.superposedQuarkPressed = true;
                }}
            />
        {/each}
    </div>

    <div class="chamberLabels">
        {#each store.chambers as chamber}
            <Label {...chamber.label} />
        {/each}
    </div>

    <div class="popupLabel" bind:this={popupLabelContainer}></div>

    <DropIndicator {...mouse.dropIndicator} />
</div>

<style lang="scss">
    #game {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;

        /* Cool dot grid background */
        --bg-color: #fffff8;
        background-color: var(--bg-color);
        background-image:
            radial-gradient(circle, transparent 10%, var(--bg-color) 80%),
            radial-gradient(rgba(0, 0, 0, 0.4) 1px, transparent 1px);
        background-size:
            100% 100%,
            30px 30px;
    }
    .grabbing {
        cursor: grabbing !important;
    }
</style>
