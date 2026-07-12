<script lang="ts">
    import favicon from "$lib/assets/favicon.svg";
    import "$lib/assets/holiday.css";

    import { base } from "$app/paths";
    import { page } from "$app/state";

    let { children } = $props();

    let pathname = $derived(page.url.pathname.substring(base.length + 1));

    type Title = string;
    type URL = string;

    const navLinks: [Title, URL][] = [
        ["Home", "/"],
        ["Play", "/play"],
        ["CLI", "/cli"],
        ["Rules", "/rules"],
        ["Source", "https://github.com/ethmarks/hadronize"],
    ];
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<header>
    <h1>Hadronize</h1>
</header>

<nav>
    <ul>
        {#each navLinks as link}
            <li>
                <a
                    href="{base}{link[1]}"
                    aria-current={link[1] === pathname ? "page" : undefined}
                    >{link[0]}</a
                >
            </li>
        {/each}
    </ul>
</nav>

<main>
    {@render children()}
</main>

<footer>
    By <a href="https://github.com/ethmarks">Ethan Marks</a>
</footer>
