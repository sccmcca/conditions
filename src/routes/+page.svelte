<script lang="ts">
  import type { PageData } from './$types';
  
  export let data: PageData;
</script>

<main>
  <div class="gallery-container">
    <div class="gallery">
      {#each { length: Math.ceil(data.thumbnails.length / 2) } as _, rowIndex}
        {@const i = rowIndex * 2}
        <div class="row" class:right={rowIndex % 2 === 1}>
          {#if data.thumbnails[i]}
            <img src={data.thumbnails[i]} alt="Thumbnail {i + 1}" loading="lazy" />
          {/if}
          {#if data.thumbnails[i + 1]}
            <img src={data.thumbnails[i + 1]} alt="Thumbnail {i + 2}" loading="lazy" />
          {/if}
        </div>
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
    display: flex;
    flex-direction: column;
    gap: 10vw;
    width: 100%;
    padding-top: 2rem;
  }
  
  .row {
    display: flex;
    gap: calc((50% - 0.5rem) * .1)  ;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
  }
  
  .row.right {
    justify-content: center;
  }
  
  .row img {
    width: calc(50% - 0.5rem);
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }
</style>
