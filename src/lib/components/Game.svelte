<script module lang="ts">
    export interface QuarkDatum {
        x: number;
        y: number;
        index: number;
        status: QuarkStatus;
        text: string;
        owner: number | undefined;
    }

    export interface ChamberDatum {
        order: number;
        showCount: boolean;
        tooLarge: boolean;
        x: number;
        y: number;
        label: LabelProps;
        quarksByFlavor: Record<Flavor | "hadron", number[]>;
        quarkRadius: number;
    }
</script>

<script lang="ts">
    import Quark from "./Quark.svelte";
    import DropIndicator from "./DropIndicator.svelte";
    import Label, { type LabelProps } from "./Label.svelte";
    import { LayoutManager } from "../ui/layout.svelte.ts";
    import { MouseManager } from "../ui/mouse.svelte.ts";

    import {
        Hadronize,
        TURN_LIMIT,
        WINNING_HADRON_COUNT,
        type Result,
    } from "../Hadronize.ts";
    import type { Flavor, QuarkStatus } from "../Quark.ts";
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

    // Game params will never change after component mounting so it's fine if
    // we only capture the initial value.
    // svelte-ignore state_referenced_locally
    let game = $state(new Hadronize(...gameParams));

    let result: Result = $state(undefined);
    const getResult: () => Result = () => result;

    let quarks: QuarkDatum[] = $state(
        game.quarks.map((q) => {
            let owner: number | undefined = undefined;
            for (const player of game.players) {
                if (player.chamber.indices.some((index) => index === q.index)) {
                    owner = player.order;
                    break;
                }
            }
            return {
                index: q.index,
                status: q.status,
                text: "",
                x: 0,
                y: 0,
                owner,
            };
        }),
    );

    const LABEL_DEFAULT_COLOR = "black";
    const LABEL_ACTIVE_COLOR = "#f2b74b";

    let chambers: ChamberDatum[] = $state(
        game.players.map((p, index) => {
            const quarksByFlavor: ChamberDatum["quarksByFlavor"] = {
                up: [],
                down: [],
                strange: [],
                charm: [],
                top: [],
                bottom: [],
                hadron: [],
            };
            p.chamber.indices.forEach((i) =>
                quarksByFlavor[game.quarks[i].flavor].push(i),
            );

            return {
                order: p.order,
                count: 0,
                showCount: false,
                tooLarge: false,
                x: -9999,
                y: -9999,
                quarksByFlavor,
                quarkRadius: 75,
                label: {
                    x: 0,
                    y: 0,
                    text: game.players[p.order].name,
                    color: LABEL_DEFAULT_COLOR,
                    fontSizeRem: 2,
                },
            };
        }),
    );

    const layout = new LayoutManager(
        game,
        quarks,
        chambers,
        getResult,
        LABEL_DEFAULT_COLOR,
        LABEL_ACTIVE_COLOR,
    );

    game.produceQuark();

    let superposed = $derived(quarks[game.superposedIndex!]);
    const getSuperposed: () => QuarkDatum = () => superposed;

    const mouse = new MouseManager(chambers, getSuperposed, layout, getResult);

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
            superposed = quarks[superposedIndex];
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

            game.observeQuark(game.players[observerOrder], game.activePlayer);

            const observation = game.mostRecentObservation;

            if (observation === undefined) throw new Error();

            const chamber = chambers[observerOrder];
            chamber.quarksByFlavor[observation.activeFlavor].push(
                superposed.index,
            );
            superposed.owner = chamber.order;
            game.superposedIndex = undefined;
            layout.update();

            await sleep(250);

            if (observation.reaction === "tunneled") {
                // Sync chambers
                [observerOrder, game.activePlayer.order].forEach((order) => {
                    chambers[order].quarksByFlavor[observation.activeFlavor] =
                        game.players[order].chamber.indices.filter(
                            (i) =>
                                game.quarks[i].flavor ===
                                observation.activeFlavor,
                        );
                });

                chambers[observerOrder].tooLarge = false;
            } else if (observation.reaction === "hadronized") {
                const hadronIndices =
                    chambers[observerOrder].quarksByFlavor[
                        observation.activeFlavor
                    ];
                chambers[observerOrder].quarksByFlavor["hadron"].push(
                    ...hadronIndices,
                );

                // Clear quarks from original flavor array
                chambers[observerOrder].quarksByFlavor[
                    observation.activeFlavor
                ] = [];
            }

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
            chambers.forEach((c) => layout.updateChamberLabel(c));
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
                ? chambers.filter((c) => c.order !== result)
                : chambers;

        chambersToExplode.forEach((c) => {
            const flatIndicies: number[] = Object.values(
                c.quarksByFlavor,
            ).flat();

            flatIndicies.forEach((quarkIndex) => {
                const quark = quarks[quarkIndex];
                quark.x =
                    Math.round(Math.random()) * (layout.center.x * 2 + 100) -
                    50;
                quark.y = layout.center.y * 2;
            });

            c.label.color = "transparent";
        });

        if (typeof result === "number") {
            const winningChamber = chambers[result];
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
        {#each quarks as q, index}
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
        {#each chambers as chamber}
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
