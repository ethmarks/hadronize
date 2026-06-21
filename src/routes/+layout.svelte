<script lang="ts">
    import favicon from "$lib/assets/favicon.svg";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/holiday.css" />
</svelte:head>

<main>
    {@render children()}
</main>
