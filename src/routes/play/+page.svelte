<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Quark from "../../lib/components/Quark.svelte";
    import DropIndicator, {
        type DropIndicatorDTO,
    } from "../../lib/components/DropIndicator.svelte";

    import {
        Hadronize,
        TURN_LIMIT,
        WINNING_HADRON_COUNT,
        type Result,
    } from "../../lib/Hadronize.ts";
    import { onMount } from "svelte";
    import type { Flavor, QuarkStatus } from "../../lib/Quark.ts";
    import {
        getVertexPos,
        getVertexDistance,
    } from "../../lib/utils/polygon.ts";
    import sl from "../../lib/cli/styledLog.ts";
    import {
        getEndgameChunks,
        getObservationChunks,
        getStateChunks,
        type CliOptions,
    } from "../../lib/cli/print.ts";

    import { prngDriver } from "../../lib/drivers/prng.ts";
    import { evDriver } from "../../lib/drivers/ev.ts";
    import { manualDriver } from "../../lib/drivers/manual.ts";

    const game = new Hadronize(1, [
        { name: "p1", driver: evDriver },
        { name: "p2", driver: prngDriver },
        { name: "p3", driver: prngDriver },
        { name: "p4", driver: prngDriver },
        { name: "p5", driver: prngDriver },
    ]);

    interface QuarkDatum {
        x: number;
        y: number;
        index: number;
        status: QuarkStatus;
        text: string;
        owner: number | undefined;
    }

    let quarks: QuarkDatum[] = $state(
        game.quarks.map((q) => {
            let owner = undefined;
            game.players.forEach((player) => {
                player.chamber.indices.forEach((index) => {
                    if (index === q.index) owner = player.order;
                });
            });
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

    interface ChamberDatum {
        order: number;
        showCount: boolean;
        nearScreenEdge: boolean;
        x: number;
        y: number;
        quarksByFlavor: Record<Flavor | "hadron", number[]>;
        quarkRadius: number;
    }

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
                nearScreenEdge: false,
                x: -9999,
                y: -9999,
                quarksByFlavor,
                quarkRadius: 75,
            };
        }),
    );

    game.produceQuark();

    let superposed = $derived(quarks[game.superposedIndex!]);

    let superposedQuarkPressed: boolean = $state(false);
    let mouse: { x: number; y: number } = $state({ x: 0, y: 0 });

    /**
     * The pixels
     */
    const DROP_PADDING = 50;

    let hoveredChamber: ChamberDatum | undefined = $state(undefined);
    let dropIndicator: DropIndicatorDTO = $state({
        active: false,
        radius: 0,
        x: 0,
        y: 0,
    });

    function detectDrop() {
        let isSuperposedOverHovered = false;
        for (const chamber of chambers) {
            const mouseDistance = Math.sqrt(
                Math.abs(chamber.x - mouse.x) ** 2 +
                    Math.abs(chamber.y - mouse.y) ** 2,
            );
            const superposedDistance = Math.sqrt(
                Math.abs(chamber.x - superposed.x) ** 2 +
                    Math.abs(chamber.y - superposed.y) ** 2,
            );

            if (superposedDistance < chamber.quarkRadius + DROP_PADDING) {
                isSuperposedOverHovered = true;
            }

            if (mouseDistance < chamber.quarkRadius + DROP_PADDING) {
                hoveredChamber = chamber;

                // Multiple chambers can't be hovered over simultaneously, so we
                // skip checking the others.
                break;
            }

            hoveredChamber = undefined;
            dropIndicator.active = false;
        }

        if (hoveredChamber === undefined) {
            chambers.forEach((c) => {
                if (c.showCount === true) {
                    c.showCount = false;
                    update();
                }
            });
        } else {
            if (superposedQuarkPressed) {
                dropIndicator.active = true;
                dropIndicator.radius =
                    hoveredChamber.quarkRadius + DROP_PADDING;
                dropIndicator.x = hoveredChamber.x;
                dropIndicator.y = hoveredChamber.y;
            } else {
                if (isSuperposedOverHovered) {
                    // Collapse the quark into the selected chamber
                    const turnEvent = new CustomEvent("takeTurn", {
                        detail: { playerOrder: hoveredChamber.order },
                    });
                    window.dispatchEvent(turnEvent);
                } else {
                    if (hoveredChamber.showCount === false) {
                        hoveredChamber.showCount = true;
                        update();
                    }
                }
            }
        }
    }

    function handleMouseMove(event: MouseEvent) {
        mouse = { x: event.clientX, y: event.clientY };

        if (superposedQuarkPressed) {
            superposed.x = mouse.x - 25;
            superposed.y = mouse.y - 25;
        }

        detectDrop();
    }

    let centerX = $state(0);
    let centerY = $state(0);
    let chamberRadius = $derived(Math.min(centerX, centerY) * 0.7);

    function update() {
        centerX = window.innerWidth / 2;
        centerY = window.innerHeight / 2;

        chambers.forEach((c, chamberIndex) => {
            const chamberPos = getVertexPos(
                centerX,
                centerY,
                chambers.length,
                chamberIndex,
                chamberRadius,
                (game.turn - 1) / chambers.length - 0.25,
            );
            c.x = chamberPos.x;
            c.y = chamberPos.y;

            if (c.showCount === false && c.nearScreenEdge === false) {
                const flatIndicies: number[] = Object.values(
                    c.quarksByFlavor,
                ).flat();

                const sides = flatIndicies.length;

                let spacing: number = getVertexDistance(sides, c.quarkRadius);

                // Will cause an infinite loop if run with 1 or fewer sides
                if (sides > 1) {
                    while (spacing < 60) {
                        c.quarkRadius += 1;
                        spacing = getVertexDistance(sides, c.quarkRadius);
                    }
                    while (spacing > 80) {
                        c.quarkRadius -= 1;
                        spacing = getVertexDistance(sides, c.quarkRadius);
                    }
                }

                flatIndicies.forEach((quarkIndex, i) => {
                    const quarkPos = getVertexPos(
                        c.x,
                        c.y,
                        sides,
                        i,
                        c.quarkRadius,
                        chamberIndex / chambers.length,
                    );

                    if (
                        quarkPos.x > centerX * 2 - 25 ||
                        quarkPos.x < 0 + 25 ||
                        quarkPos.y > centerY * 2 - 25 ||
                        quarkPos.y < 0 + 25
                    ) {
                        c.nearScreenEdge = true;
                    }

                    const UIquark = quarks[quarkIndex];
                    const gameQuark = game.quarks[quarkIndex];
                    UIquark.x = quarkPos.x - 25;
                    UIquark.y = quarkPos.y - 25;

                    UIquark.text = gameQuark.isHadronized
                        ? "h"
                        : gameQuark.flavor.slice(0, 1);
                });
            } else {
                const nonEmptyByFlavor = Object.entries(
                    c.quarksByFlavor,
                ).filter(([_, indices]) => indices.length > 0) as [
                    Flavor | "hadron",
                    number[],
                ][];

                const hasHadrons = nonEmptyByFlavor.some(
                    ([flavor, _]) => flavor === "hadron",
                );

                const sides = hasHadrons
                    ? nonEmptyByFlavor.length - 1
                    : nonEmptyByFlavor.length;

                let spacing: number = getVertexDistance(sides, c.quarkRadius);

                // Will cause an infinite loop if run with 1 or fewer sides
                if (sides > 1) {
                    while (spacing < 100) {
                        c.quarkRadius += 1;
                        spacing = getVertexDistance(sides, c.quarkRadius);
                    }
                    while (spacing > 120) {
                        c.quarkRadius -= 1;
                        spacing = getVertexDistance(sides, c.quarkRadius);
                    }
                }

                nonEmptyByFlavor.forEach(([flavor, indices], i) => {
                    const quarkPos =
                        flavor === "hadron"
                            ? { x: c.x, y: c.y }
                            : getVertexPos(c.x, c.y, sides, i, c.quarkRadius);
                    indices.forEach((quarkIndex) => {
                        const UIquark = quarks[quarkIndex];
                        UIquark.x = quarkPos.x - 25;
                        UIquark.y = quarkPos.y - 25;
                        UIquark.text = indices.length.toString();
                    });
                });
            }
        });

        quarks.forEach((q) => {
            q.status = game.quarks[q.index].status;

            if (q.status === "latent" || q.status === "superposed") {
                q.text = "?";
                q.x = window.innerWidth / 2 - 25;
                q.y = window.innerHeight / 2 - 25;
            }
        });
    }

    onMount(async () => {
        window.addEventListener("resize", (_) => {
            update();
        });
        update();

        const opt: CliOptions = {
            abbreviate: false,
            showEmpty: false,
            showPlayerOrder: true,
            showPreviousObservation: true,
        };

        let result: Result = undefined;

        while (result === undefined) {
            const superposedIndex = game.superposedIndex ?? game.produceQuark();
            superposed = quarks[superposedIndex];
            superposed.x = window.innerWidth / 2 - 25;
            superposed.y = window.innerHeight / 2 - 25;
            update();

            await new Promise((resolve) => setTimeout(resolve, 500));

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
            update();

            await new Promise((resolve) => setTimeout(resolve, 250));

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

                chambers[observerOrder].nearScreenEdge = false;
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

            update();

            await new Promise((resolve) => setTimeout(resolve, 150));

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
        }

        // Log final observation
        const observation = game.mostRecentObservation!;
        const active = game.state!.players[game.state!.activePlayer];
        const observer = game.state!.players[observation.observer];
        sl(getObservationChunks(active, observer, observation, opt));
        sl(["\n---\n"]);

        // Log endgame chunks
        const endgameChunks = getEndgameChunks(game, result, opt);
        sl(endgameChunks);

        return endgameChunks;
    });
</script>

<svelte:head>
    <title>Play Hadronize</title>
</svelte:head>

<svelte:window
    on:mousemove={handleMouseMove}
    onmouseup={() => {
        superposedQuarkPressed = false;
        detectDrop();
    }}
/>

<Reset />

<main class={superposedQuarkPressed ? "grabbing" : ""}>
    <div id="quarks">
        {#each quarks as q, index}
            <Quark
                quark={game.quarks[q.index]}
                status={q.status}
                text={q.text}
                x={q.x}
                y={q.y}
                onmousedown={() => {
                    if (index === game.superposedIndex!)
                        superposedQuarkPressed = true;
                }}
            />
        {/each}
    </div>

    <DropIndicator
        x={dropIndicator.x}
        y={dropIndicator.y}
        radius={dropIndicator.radius}
        active={dropIndicator.active}
    />
</main>

<style lang="scss">
    main {
        min-height: 100vh;
    }
    .grabbing {
        cursor: grabbing !important;
    }
</style>
