<script lang="ts">
    import Quark from "./Quark.svelte";
    import DropIndicator from "./DropIndicator.svelte";
    import Label, { type LabelProps } from "./Label.svelte";
    import { LayoutManager } from "../ui/layout.svelte.ts";
    import { MouseManager } from "../ui/mouse.svelte.ts";
    import { StoreManager } from "../ui/store.svelte.ts";

    import {
        Hadronize,
        TURN_LIMIT,
        WINNING_HADRON_COUNT,
        type Result,
    } from "../Hadronize.ts";

    import sl from "../cli/styledLog.ts";
    import {
        getEndgameChunks,
        getObservationChunks,
        getStateChunks,
        type CliOptions,
    } from "../cli/print.ts";

    import { onMount } from "svelte";

    interface Props {
        gameParams: ConstructorParameters<typeof Hadronize>;
    }

    let { gameParams }: Props = $props();

    const LABEL_DEFAULT_COLOR = "black";
    const LABEL_ACTIVE_COLOR = "#f2b74b";

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

    let superposed = $derived(store.quarks[game.superposedIndex!]);
    const getSuperposed = () => superposed;

    const mouse = new MouseManager(
        store.chambers,
        getSuperposed,
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
            const superposedIndex = game.superposedIndex ?? game.produceQuark();
            superposed = store.quarks[superposedIndex];
            superposed.x = window.innerWidth / 2 - 25;
            superposed.y = window.innerHeight / 2 - 25;
            layout.update();

            await sleep(500);

            const state = game.updateState();

            sl(getStateChunks(state, opt));

            const observerOrder = await game.activePlayer.driver(
                state,
                game.activePlayer.scratchpad,
            );

            game.executeObservation(
                game.players[observerOrder],
                game.activePlayer,
            );

            const observation = game.mostRecentObservation;

            if (observation === undefined) throw new Error();

            const chamber = store.chambers[observerOrder];
            chamber.quarksByFlavor[observation.activeFlavor].push(
                superposed.index,
            );
            superposed.owner = chamber.order;
            game.superposedIndex = undefined;
            layout.update();

            await sleep(250);

            store.syncChambers();
            layout.update();

            await sleep(150);

            // Check for winners _before_ we check if the turn limit has been exceeded.
            for (const player of game.players) {
                if (player.score >= WINNING_HADRON_COUNT) {
                    result = player.order;
                    break;
                }
            }

            // Check if the turn limit has been exceeded.
            if (
                game.turn >= TURN_LIMIT ||
                game.usedQuarks >= game.quarks.length
            ) {
                result = "too many turns";
                break;
            }

            game.turn++;
            store.chambers.forEach((c) => layout.updateChamberLabel(c));
        }
        return result;
    }

    onMount(async () => {
        layout.init();

        const opt: CliOptions = {
            abbreviate: false,
            showEmpty: false,
            showPlayerOrder: true,
            showPreviousObservation: true,
        };

        result = await mainLoop(game, opt);

        // Log final observation
        const observation = game.mostRecentObservation!;
        const active = game.state!.players[game.state!.activePlayer];
        const observer = game.state!.players[observation.observer];
        sl(getObservationChunks(active, observer, observation, opt));
        sl(["\n---\n"]);

        // Log endgame chunks
        const endgameChunks = getEndgameChunks(game, result, opt);
        sl(endgameChunks);

        mouse.dropIndicator.active = false;

        const chambersToExplode =
            typeof result === "number"
                ? store.chambers.filter((c) => c.order !== result)
                : store.chambers;

        chambersToExplode.forEach((c) => {
            const flatIndicies: number[] = Object.values(
                c.quarksByFlavor,
            ).flat();

            flatIndicies.forEach((quarkIndex) => {
                const quark = store.quarks[quarkIndex];
                quark.x =
                    Math.round(Math.random()) * (layout.center.x * 2 + 100) -
                    50;
                quark.y = layout.center.y * 2;
            });

            c.label.color = "transparent";
        });

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
                    if (index === superposed.index)
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
