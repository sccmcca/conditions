<script lang="ts">
  import { base } from "$app/paths";
</script>

<main>
  <div class="landing-container">
    <!-- <h1><i>Conditions of Observation</i></h1> -->
    <nav class="links">
      <a href="{base}/diptychs">Diptychs</a>
      <a href="{base}/map">Map</a>
      <a href="{base}/color">Color</a>
      <a href="{base}/info">Info</a>
    </nav>
  </div>
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  .landing-container {
    text-align: center;
  }

  h1 {
    font-size: 3rem;
    font-weight: 300;
    margin: 0 0 2rem 0;
    letter-spacing: -0.5px;
  }

  .links {
    display: flex;
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  a {
    font-size: 1.25rem;
    font-style: italic;
    text-decoration: none;
    color: currentColor;
    cursor: pointer;
  }

  a:hover {
    filter: blur(4px);
    -webkit-filter: blur(4px);
  }

  @media (max-width: 700px) {
    h1 {
      font-size: 2rem;
      margin-bottom: 1.5rem;
    }

    .links {
      gap: 1rem;
    }

    a {
      font-size: 1rem;
      padding: 0.4rem 1rem;
    }
  }
</style>
