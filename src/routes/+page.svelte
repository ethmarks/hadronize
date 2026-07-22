<script lang="ts">
    import banner from "$lib/assets/banner2.png";
</script>

<svelte:head>
    <title>Hadronize</title>
</svelte:head>

<main>
    <h2>Welcome to Hadronize!</h2>

    <figure>
        <img
            alt="Hadronize setup form"
            src={banner}
            width="1711"
            height="762"
        />
    </figure>

    <p>
        Quark-themed set collection game where players combine quarks to form
        hadrons. Playable in your <a href="./how">browser</a>,
        <a href="./cli">terminal</a>, or even
        <a href="./cli#browser-console">browser console</a> (!).
    </p>

    <blockquote>
        To get started, head to the <a href="./how">How to Play</a> page.
    </blockquote>
</main>

<style lang="scss">
    img {
        border-radius: 1rem;
    }
</style>
