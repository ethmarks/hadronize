<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Quark from "../../lib/components/Quark.svelte";
    import DropIndicator, {
        type DropIndicatorDTO,
    } from "../../lib/components/DropIndicator.svelte";

    import { Hadronize } from "../../lib/Hadronize.ts";
    import { prngDriver } from "../../lib/drivers/prng.ts";
    import { onMount } from "svelte";
    import type { Flavor, QuarkStatus } from "../../lib/Quark.ts";
    import {
        getVertexPos,
        getVertexDistance,
    } from "../../lib/utils/polygon.ts";

    const game = new Hadronize(1, [
        { name: "p1", driver: prngDriver },
        { name: "p2", driver: prngDriver },
        { name: "p3", driver: prngDriver },
        { name: "p4", driver: prngDriver },
    ]);

    interface QuarkDatum {
        x: number;
        y: number;
        index: number;
        status: QuarkStatus;
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
            return { index: q.index, status: q.status, x: 0, y: 0, owner };
        }),
    );

    interface ChamberDatum {
        order: number;
        showCount: boolean;
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
        for (const chamber of chambers) {
            const distance = Math.sqrt(
                Math.abs(chamber.x - superposed.x) ** 2 +
                    Math.abs(chamber.y - superposed.y) ** 2,
            );

            if (distance < chamber.quarkRadius + DROP_PADDING) {
                hoveredChamber = chamber;

                // Multiple chambers can't be hovered over simultaneously, so we
                // skip checking the others.
                break;
            }

            hoveredChamber = undefined;
            dropIndicator.active = false;
        }

        if (hoveredChamber !== undefined) {
            if (superposedQuarkPressed) {
                dropIndicator.active = true;
                dropIndicator.radius =
                    hoveredChamber.quarkRadius + DROP_PADDING;
                dropIndicator.x = hoveredChamber.x;
                dropIndicator.y = hoveredChamber.y;
            } else {
                // Collapse the quark into the selected chamber

                // Update game state
                const gameQuark = game.quarks[superposed.index];
                gameQuark.collapse();
                game.players[hoveredChamber.order].chamber.indices.push(
                    gameQuark.index,
                );

                // Update UI state
                hoveredChamber.quarksByFlavor[gameQuark.flavor].push(
                    superposed.index,
                );
                superposed.owner = hoveredChamber.order;

                // Make new superposed quark
                game.superposedIndex = undefined;
                game.produceQuark();
                game.superposedIndex = game.superposedIndex;
                superposed = quarks[game.superposedIndex!];
                update();
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
            );
            c.x = chamberPos.x;
            c.y = chamberPos.y;

            if (c.showCount === false) {
                const flatIndicies: number[] = Object.values(
                    c.quarksByFlavor,
                ).flat();

                const sides = flatIndicies.length;

                let spacing: number = getVertexDistance(sides, c.quarkRadius);

                while (spacing < 60) {
                    c.quarkRadius += 1;
                    spacing = getVertexDistance(sides, c.quarkRadius);
                }
                while (spacing > 80) {
                    c.quarkRadius -= 1;
                    spacing = getVertexDistance(sides, c.quarkRadius);
                }

                flatIndicies.forEach((quarkIndex, i) => {
                    const quarkPos = getVertexPos(
                        c.x,
                        c.y,
                        sides,
                        i,
                        c.quarkRadius,
                    );
                    quarks[quarkIndex].x = quarkPos.x - 25;
                    quarks[quarkIndex].y = quarkPos.y - 25;
                });
            }
        });

        quarks.forEach((q) => {
            q.status = game.quarks[q.index].status;
        });
    }

    onMount(() => {
        update();

        window.addEventListener("resize", (_) => {
            update();
        });
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
