<script lang="ts">
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  let activeFilters = new Set(['all', 'nature', 'urban', 'abstract', 'architecture', 'people']);
  
  const filters = ['All', 'Nature', 'Urban', 'Abstract', 'Architecture', 'People'];
  
  function toggleFilter(filter: string) {
    const filterLower = filter.toLowerCase();
    if (activeFilters.has(filterLower)) {
      activeFilters.delete(filterLower);
    } else {
      activeFilters.add(filterLower);
    }
    activeFilters = activeFilters; // trigger reactivity
  }
</script>

<main>
  <div class="gallery-container">
    <div class="filter-buttons">
      {#each filters as filter}
        <button 
          class:active={activeFilters.has(filter.toLowerCase())}
          on:click={() => toggleFilter(filter)}
        >
          {filter}
        </button>
      {/each}
    </div>
    
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
  
  .filter-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 3rem;
    justify-content: center;
  }
  
  .filter-buttons button {
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: 1px solid #e0e0e0;
    color: #333;
    cursor: pointer;
    font-size: 0.9rem;
    font-family: inherit;
    opacity: 1;
  }
  
  .filter-buttons button:hover {
    opacity: 0.7;
  }
  
  .filter-buttons button:not(.active) {
    opacity: 0.3;
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
