<script lang="ts">
    import { base } from "$app/paths";
    import terminalScreenshot from "$lib/assets/terminal_screenshot.png";
    import consoleScreenshot from "$lib/assets/console_screenshot.png";
</script>

<svelte:head>
    <title>CLI | Hadronize</title>
</svelte:head>

<h2>CLI</h2>

<p>
    You can play Hadronize in a terminal or even a browser console if you want!
</p>

<img
    alt="Screenshot of Hadronize CLI in terminal"
    src={terminalScreenshot}
    width="1920"
    height="1080"
/>

<h3>Quickstart</h3>

<p>
    To play Hadronize CLI in your terminal, you can just use the command below.
    No installation or repo cloning needed!
</p>

<pre id="deno"><code
        >deno run -A http://ethmarks.github.io/hadronize/cli.ts</code
    ></pre>

<p>
    If you don't have <a href="https://deno.com/">Deno</a> installed, you can
    also run it using any of the other JS package managers via the
    <a href="https://www.npmjs.com/package/deno">Deno binary on npm</a>.
</p>

<ul>
    <li>
        npm
        <pre><code
                >npx deno run -A http://ethmarks.github.io/hadronize/cli.ts</code
            ></pre>
    </li>
    <li>
        pnpm
        <pre><code
                >pnpm dlx deno run -A http://ethmarks.github.io/hadronize/cli.ts</code
            ></pre>
    </li>
    <li>
        bun
        <pre><code
                >bunx deno run -A http://ethmarks.github.io/hadronize/cli.ts</code
            ></pre>
    </li>
</ul>

<h3>Native</h3>

<p>
    If you want to run it natively (i.e. not proxied through Deno if you're
    using Node or Bun), you can clone the repo and run the `cli` script:
</p>

<pre><code
        >git clone https://github.com/ethmarks/hadronize.git
cd hadronize</code
    ></pre>

<ul>
    <li id="npm">
        npm
        <pre><code
                >npm install
npm run cli</code
            ></pre>
    </li>
    <li id="pnpm">
        pnpm
        <pre><code
                >pnpm install
pnpm run cli</code
            ></pre>
    </li>
    <li id="bun">
        bun
        <pre><code
                >bun install
bun run cli</code
            ></pre>
    </li>
    <li>
        deno
        <pre><code>deno run cli</code></pre>
    </li>
</ul>

<h3>Browser</h3>

<p>
    You can also play Hadronize in the browser console. Just <a
        href="{base}/play">start a browser game</a
    >, open your browser console with <kbd>F12</kbd>, and type the name of the
    player you want to target on your turn into the console.
</p>

<img
    alt="Screenshot of Hadronize CLI in browser console"
    src={consoleScreenshot}
    width="1920"
    height="1080"
/>
