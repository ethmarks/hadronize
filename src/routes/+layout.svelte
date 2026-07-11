<script lang="ts">
    import { base } from "$app/paths";
    import favicon from "$lib/assets/favicon.svg";
    import "$lib/assets/holiday.css";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<header>
    <h1>Hadronize</h1>
</header>

<nav>
    <ul>
        <li><a href="{base}/">Home</a></li>
        <li><a href="{base}/cli">CLI</a></li>
        <li><a href="{base}/play">Play</a></li>
    </ul>
</nav>

{@render children()}

<footer>
    By <a href="https://github.com/ethmarks">Ethan Marks</a>
</footer>
