<script lang="ts">
    import Reset from "../../lib/components/Reset.svelte";
    import Quark from "../../lib/components/Quark.svelte";
    import Chamber, {
        type Section,
        type Rect,
    } from "../../lib/components/Chamber.svelte";

    import { Hadronize } from "../../lib/Hadronize.ts";
    import { prngDriver } from "../../lib/drivers/prng.ts";
    import { onMount } from "svelte";
    import type { QuarkStatus } from "../../lib/Quark.ts";

    const game = new Hadronize(2, [
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
        sections: Partial<Record<Section, Rect>>;
    }

    let chambers: ChamberDatum[] = $state(
        game.players.map((p) => {
            return {
                order: p.order,
                sections: {},
            };
        }),
    );

    game.produceQuark();

    let superposed = $derived(quarks[game.superposedIndex!]);

    let superposedQuarkPressed: boolean = $state(false);
    let mouse: { x: number; y: number } = $state({ x: 0, y: 0 });

    function handleMouseMove(event: MouseEvent) {
        mouse = { x: event.clientX, y: event.clientY };

        if (superposedQuarkPressed) {
            superposed.x = mouse.x - 25;
            superposed.y = mouse.y - 25;

            chambers.forEach((chamber) => {
                if (!chamber.sections.top || !chamber.sections.hadron) return;

                const leftEdge = chamber.sections.top.left;
                const rightEdge =
                    chamber.sections.hadron.left +
                    chamber.sections.hadron.width;
                const topEdge = chamber.sections.top.top;
                const bottomEdge =
                    chamber.sections.top.top + chamber.sections.top.height;

                if (
                    superposed.x > leftEdge &&
                    superposed.x < rightEdge &&
                    superposed.y > topEdge &&
                    superposed.y < bottomEdge
                ) {
                    const quark = game.quarks[superposed.index];
                    quark.collapse();
                    superposed.owner = chamber.order;

                    game.players[chamber.order].chamber.indices.push(
                        quark.index,
                    );
                    superposedQuarkPressed = false;
                    game.superposedIndex = undefined;

                    game.produceQuark();
                    game.superposedIndex = game.superposedIndex;
                    superposed = quarks[game.superposedIndex!];

                    update();
                }
            });
        }
    }

    function update() {
        chambers.forEach((c) => {
            if (c.sections) {
                const indicies = game.players[c.order].chamber.indices;
                const hadrons = game.players[c.order].chamber.hadrons;
                hadrons.forEach((h) => {
                    h.indices.forEach((index) => {
                        const q = quarks[index];
                        const rect = c.sections["hadron"];
                        if (rect) {
                            q.x =
                                Math.random() * (rect.width - 50) +
                                rect.left -
                                25;
                            q.y =
                                Math.random() * (rect.height - 50) +
                                rect.top -
                                25;
                        }
                    });
                });
                indicies.forEach((index) => {
                    const q = quarks[index];
                    const rect = c.sections[game.quarks[q.index].flavor];
                    if (rect) {
                        q.x = rect.left + rect.width / 2 - 25;
                        q.y = rect.top;
                    }
                });
            }
        });
        quarks.forEach((q) => {
            q.status = game.quarks[q.index].status;
        });
    }

    onMount(update);
</script>

<svelte:head>
    <title>Play Hadronize</title>
</svelte:head>

<svelte:window
    on:mousemove={handleMouseMove}
    onmouseup={() => (superposedQuarkPressed = false)}
/>

<Reset />

{JSON.stringify(game.players[0].chamber)}

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

<div id="chambers">
    {#each chambers as chamber}
        <Chamber
            owner={game.players[chamber.order]}
            setSections={(sections: Partial<Record<Section, Rect>>) =>
                (chamber.sections = sections)}
        />
    {/each}
</div>

<h1>Play Hadronize</h1>
<p>This page is for playing Hadronize</p>

<style lang="scss">
    #chambers {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
</style>
