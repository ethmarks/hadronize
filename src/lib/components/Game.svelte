<script lang="ts">
    import Quark from "./Quark.svelte";
    import DropIndicator from "./DropIndicator.svelte";
    import Label from "./Label.svelte";
    import { LayoutManager } from "../ui/layout.svelte.ts";
    import { MouseManager } from "../ui/mouse.svelte.ts";
    import { StoreManager } from "../ui/store.svelte.ts";

    import { Hadronize, type Observation, type Result } from "../Hadronize.ts";

    import sl from "../cli/styledLog.ts";
    import {
        getStateChunks,
        logFinalObservation,
        type CliOptions,
    } from "../cli/print.ts";

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

    let result: Result = $state(undefined);
    const getResult: () => Result = () => result;

    const layout = new LayoutManager(
        game,
        store.quarks,
        store.chambers,
        () => store.syncQuarks(),
        getResult,
        LABEL_DEFAULT_COLOR,
        LABEL_ACTIVE_COLOR,
    );

    game.produceQuark();

    const mouse = new MouseManager(
        store.chambers,
        () => store.superposed,
        layout,
        getResult,
    );

    let speed: number = $state(1);

    async function sleep(ms: number) {
        await new Promise((resolve) => setTimeout(resolve, ms / speed));
    }

    async function mainLoop(
        game: Hadronize,
        opt: CliOptions,
    ): Promise<Exclude<Result, undefined>> {
        let result: Result = undefined;
        while (result === undefined) {
            let superposedIndex: number;
            result = await game.executeTurn({
                pre: async (ctx: { game: Hadronize }) => {
                    superposedIndex = ctx.game.superposedIndex!;
                    store.superposed = store.quarks[superposedIndex];
                    store.superposed.x = layout.center.x - 25;
                    store.superposed.y = layout.center.y - 25;
                    layout.update();
                    await sleep(500);
                },
                preDriver: async (ctx: { game: Hadronize }) => {
                    sl(getStateChunks(ctx.game.state!, opt));
                },
                preReaction: async (ctx: { observation: Observation }) => {
                    store.quarks[superposedIndex].owner =
                        ctx.observation.observer;

                    store.syncChambers();
                    layout.update();
                    await sleep(250);
                },
                preChecks: async () => {
                    store.syncChambers();
                    layout.update();
                    await sleep(150);
                },
                post: async () => {
                    store.chambers.forEach((c) => layout.updateChamberLabel(c));
                },
            });
        }
        return result;
    }

    onMount(async () => {
        layout.init();

        result = await mainLoop(game, CLI_OPT);

        logFinalObservation(game, result, CLI_OPT);

        mouse.dropIndicator.active = false;

        const chambersToExplode = store.chambers.filter(
            (c) => c.order !== result,
        );
        chambersToExplode.forEach((c) => layout.explodeChamber(c));

        if (typeof result === "number") {
            const winningChamber = store.chambers[result];
            winningChamber.x = layout.center.x;
            winningChamber.y = layout.center.y;
            winningChamber.showCount = false;
            winningChamber.tooLarge = false;
            layout.updateChamberContent(winningChamber);
            layout.updateChamberLabel(winningChamber);
            winningChamber.label.color = "#98c379";
            winningChamber.label.text += " Wins!";
        }
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
