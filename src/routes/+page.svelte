<script lang="ts">
    import banner from "$lib/assets/banner2.png";
</script>

<svelte:head>
    <title>Hadronize</title>
</svelte:head>

<main>
    <h2>Welcome to Hadronize!</h2>

    <p>
        Hadronize is a quark-themed set collection game. On each turn, a player
        gets to decide who will observe a quark in superposition. Choose wisely,
        and you can score your quarks by hadronizing them, or you can steal
        another player's quarks by quantum-tunneling them. Choose poorly, and
        you might wind up gifting the quark to an opponent!
    </p>

    <figure>
        <img
            alt="Hadronize setup form"
            src={banner}
            width="1711"
            height="762"
        />
    </figure>

    <p>
        To get started, head to the <a href="./how">How to Play page</a>.
    </p>
</main>

<style lang="scss">
    img {
        border-radius: 1rem;
    }
</style>
