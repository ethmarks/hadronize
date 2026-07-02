<script lang="ts">
    import Quark from "./Quark.svelte";
    import DropIndicator from "./DropIndicator.svelte";
    import Label from "./Label.svelte";
    import { LayoutManager } from "../ui/layout.svelte.ts";
    import { MouseManager } from "../ui/mouse.svelte.ts";
    import { StoreManager } from "../ui/store.svelte.ts";
    import { LoopManager } from "../ui/loop.svelte.ts";

    import { Hadronize } from "../Hadronize.ts";

    import { type CliOptions } from "../cli/print.ts";

    import { onMount } from "svelte";

    interface Props {
        gameParams: ConstructorParameters<typeof Hadronize>;
    }

    let { gameParams }: Props = $props();

    const LABEL_DEFAULT_COLOR = "black";
    const LABEL_ACTIVE_COLOR = "#f2b74b";

    const CLI_OPT: CliOptions = {
        abbreviate: false,
        showEmpty: false,
        showPlayerOrder: true,
        showPreviousObservation: true,
    };

    // Game params will never change after component mounting so it's fine if
    // we only capture the initial value.
    // svelte-ignore state_referenced_locally
    let game = $state(new Hadronize(...gameParams));

    const store = new StoreManager(game, LABEL_DEFAULT_COLOR);

    const layout = new LayoutManager(
        game,
        store.quarks,
        store.chambers,
        () => store.syncQuarks(),
        () => store.result,
        LABEL_DEFAULT_COLOR,
        LABEL_ACTIVE_COLOR,
    );

    game.produceQuark();

    const mouse = new MouseManager(
        store.chambers,
        () => store.superposed,
        layout,
        () => store.result,
    );

    let speed = 1;

    const loop = new LoopManager(speed, game, store, layout, mouse, CLI_OPT);

    onMount(async () => {
        layout.init();

        // It's important that we invoke the async start function without an
        // await so that it doesn't block onMount.
        loop.start();
    });
</script>

<svelte:window
    on:mousemove={(e: MouseEvent) => mouse.handleMouseMove(e)}
    onmouseup={() => {
        mouse.superposedQuarkPressed = false;
        mouse.detectDrop();
    }}
/>

<main class={mouse.superposedQuarkPressed ? "grabbing" : ""}>
    <div id="quarks">
        {#each store.quarks as q, index}
            <Quark
                quark={game.quarks[q.index]}
                status={q.status}
                text={q.text}
                x={q.x}
                y={q.y}
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

    <DropIndicator {...mouse.dropIndicator} />
</main>

<style lang="scss">
    main {
        min-height: 100vh;

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
