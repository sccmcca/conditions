<script lang="ts">
  import type { PageData } from './$types';
  
  export let data: PageData;
</script>

<svelte:head>
  <title>Color - Conditions of Observation</title>
</svelte:head>

<main>
  <div class="gallery-container">
    <div class="gallery">
      {#each data.images as image}
        <img src={image.thumbnail} alt="Hue {image.hue}" loading="lazy" />
      {/each}
    </div>
  </div>
</main>

<style>
  main {
    padding: 0;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    overflow-x: hidden;
  }
  
  .gallery-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
    box-sizing: border-box;
  }
  
  .gallery {
    display: grid;
    grid-template-columns: repeat(23, 1fr);
    gap: 0;
    width: 100%;
    padding-top: 2rem;
  }
  
  .gallery img {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    .gallery {
      grid-template-columns: repeat(12, 1fr);
    }
  }
  
  @media (max-width: 499px) {
    .gallery {
      grid-template-columns: repeat(8, 1fr);
    }
  }
</style>
