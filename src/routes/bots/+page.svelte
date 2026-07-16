<script module lang="ts">
    /** Doesn't do anything, just makes my IDE do syntax highlighting */
    const js = (strings: TemplateStringsArray): string => strings[0];

    const INJECT_EXAMPLE_SNIPPET = js`const state = {
  turn: 1,
  activePlayer: 0,
  superposedQuark: ["charm", "top", "strange"],
  players: [
      {
          order: 0,
          name: "Alice",
          chamber: ["strange", "strange", "top", "top"],
          score: 0,
      },
      {
          order: 1,
          name: "Bob",
          chamber: ["up", "up", "down", "charm"],
          score: 0,
      },
  ],
  timeline: [],
};

const pad = {
  read: () => _scratchpadContent;
  write: (newContent) => _scratchpadContent = newContent;
};`;
</script>

<script lang="ts">
    import type { DriverProgram } from "../../lib/drivers/stockDrivers.ts";
    import {
        fetchPlayerTypes,
        resetPlayerTypes,
        setPlayerTypes,
    } from "../../lib/ui/playerTypes.ts";

    import Editor from "../../lib/components/Editor.svelte";

    let playerTypes: DriverProgram[] = $state(fetchPlayerTypes());

    let focus: number = $state(0);
    let program = $derived(playerTypes[focus]);

    const GET_EMPTY_PROGRAM: () => DriverProgram = () => ({
        name: "My bot",
        id: `bot${playerTypes.length + 1}`,
        description: "I am the description! Edit me!",
        code: js`
// remember, the state and pad variables are injected when the bot runs.

// this bot tries to hadronize every single time. Doesn't even try to tunnel.
const me = state.activePlayer;
return me;
          `,
    });

    const stripNewlinePrefix = <T extends string | undefined>(str: T): T => {
        if (typeof str === "undefined") return undefined as T;

        return (str[0] === "\n" ? str.substring(1) : str) as T;
    };

    function onUpdate(val: string) {
        program.code = val;
    }

    $effect(() => {
        program.name;
        program.code;
        program.id;

        setPlayerTypes(playerTypes);
    });
</script>

<h2>Bots</h2>

<p>You can create your own Hadronize bots and play against them!</p>

<h3>Instructions</h3>

<p>
    Hadronize bots are basically just JavaScript functions that take the current
    game state as their input and output what action the player should take. To
    create a new bot, all you need to do is create a new function that
    implements the strategy that you want your bot to have.
</p>

<p>
    You can change the title, ID, and description of a bot just by editing the
    elements on the page. The elements have the <code
        ><a
            href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable"
            >contenteditable</a
        ></code
    >
    attribute so that you can edit them, and they automatically save all updates to
    <code
        ><a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
            >localStorage</a
        ></code
    >.
</p>

<p>
    To change the code, just use the code editor (built with <a
        href="https://prism-code-editor.netlify.app/">Prism</a
    >). Remember to <code>return</code> your output at the end. You can
    reference the current state of the game through the <code>state</code>
    variable, and you can read and write a persistent scratchpad through the
    <code>pad</code> variable. To see an example of the format, click on the collapsible
    below.
</p>

<details>
    <summary><code>state</code> and <code>pad</code> example</summary>
    <Editor initialValue={INJECT_EXAMPLE_SNIPPET} readOnly />
</details>

<p>
    Once you're finished with your bot, go back to the <a href="./play"
        >play page</a
    > and set a player to use your new bot.
</p>

<div class="buttons">
    <button
        type="reset"
        onclick={() => {
            resetPlayerTypes();
            playerTypes = fetchPlayerTypes();
            focus = 0;
        }}>Reset All Bots</button
    >
    <button
        onclick={() => {
            playerTypes.push(GET_EMPTY_PROGRAM());
            focus = playerTypes.length - 1;
        }}>Create New Bot</button
    >
</div>

<fieldset class="botedit">
    <legend>Bot Editor</legend>

    <select bind:value={focus}>
        {#each playerTypes as program, index}
            <option value={index}>{program.name} ({program.id})</option>
        {/each}
    </select>

    <h2>
        <span contenteditable spellcheck="false" bind:textContent={program.name}
        ></span>
        (<code contenteditable spellcheck="false" bind:textContent={program.id}
        ></code>)
    </h2>
    <p contenteditable bind:innerText={program.description}></p>

    {#key program}
        <Editor
            initialValue={stripNewlinePrefix(program.code)}
            readOnly={false}
            {onUpdate}
        />
    {/key}
</fieldset>

<style lang="scss">
    div {
        margin-block: 0.5rem;
    }

    .buttons {
        display: flex;
        flex-direction: row;
        justify-content: right;
        gap: 0.5rem;
    }

    .botedit > p {
        font-style: italic;
    }
</style>
