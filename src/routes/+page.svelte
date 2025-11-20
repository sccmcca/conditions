<script lang="ts">
  import type { PageData } from './$types';
  import { base } from '$app/paths';
  export let data: PageData;
</script>

<main>
  <div class="gallery-container">
    <div class="info-sidebar">
      <p>
  <em><strong><span class="blur">Conditions of Observation</span></strong></em> is a photographic research tool developed for my Master of Architecture thesis at the University of Toronto. All photographs are my own, taken primarily with my iPhone between 2017 and 2025 as part of my ongoing practice of <span class="noticing">noticing</span>.<br /><br />
        The thesis (forthcoming) explores the role of contemporary vernacular materials and contingent urban conditions in shaping architectural culture. By studying formal and material conditions, this thesis will engage directly with contingent urban context through observation, documentation, and interpretive making to examine how the overlooked artifacts of everyday life are the result of informal participation in the production of space and contemporary design culture.<br /><br />
        This thesis foregrounds adaptive reuse and economies of construction, treating discarded, provisional, and improvised material conditions as resources for contextual architectural invention. Drawing on discourses of semiology, contemporary material culture, deconstructivism, and spatial production, the research proposes techniques of observation and making that highlight chance encounters, circumstantial geometries, and the aesthetics of contemporaneity as a productive force in design.<br /><br />
        Warmly,<br />
  <span class="blur"><em>Scott Christian McCallum</em></span>
      </p>
    </div>
    <div class="gallery single-column">
      {#each data.imgDipList as imgPath}
        <div class="img-row">
          <img src={`${base}${imgPath}`} alt={imgPath.split('/').pop()} loading="lazy" />
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
  @media (max-width: 700px) {
    .content-layout {
      flex-direction: column;
      margin-top: 0;
      margin-bottom: 0;
    }
    .sidebar {
      width: 100vw;
      border-right: none;
      padding: 1rem;
      position: static;
      height: auto;
    }
    .gallery-scroll {
      margin-left: 0;
      background: #fafafa;
      padding-top: 1rem;
      padding-bottom: 1rem;
      height: auto;
    }
    .info-container p {
      max-width: 100vw;
    }
    .img-row img {
      max-width: 100%;
    }
  }
  .gallery-container {
    display: flex;
    flex-direction: row;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    box-sizing: border-box;
    padding-top: 0;
    gap: 2rem;
  }
  @media (max-width: 1215px) {
    .gallery-container {
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }
    .info-sidebar {
      position: static !important;
      width: 100% !important;
      max-width: 700px !important;
      margin: 0 auto !important;
      left: unset !important;
      top: unset !important;
      z-index: unset !important;
    }
    .gallery.single-column {
      margin-left: 0 !important;
      width: 100% !important;
      max-width: 700px !important;
      min-width: unset !important;
      margin: 0 auto !important;
    }
  }
  .info-sidebar {
    width: 320px;
    flex-shrink: 0;
    position: fixed;
    left: calc((100vw - 1135px) / 2);
    top: 4rem;
    height: fit-content;
    z-index: 20;
  }
  .gallery.single-column {
    margin-left: 360px;
  }
  .info-sidebar p {
    max-width: 100%;
    text-align: justify;
    line-height: 1.36;
    font-size: 0.95rem;
  }
  @media (max-width: 1215px) {
    .info-sidebar p {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  }
  .gallery.single-column {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 700px;
    max-width: 700px;
    min-width: 700px;
    padding-top: 0;
  }
  .img-row {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  .img-row img {
    width: 100%;
    max-width: 1000px;
    height: auto;
    object-fit: contain;
    /* box-shadow removed */
    border-radius: 8px;
    background: #f8f8f8;
    display: block;
  }
  .info-container p {
    max-width: 340px;
    text-align: justify;
    line-height: 1.6;
  }
  .blur {
    transition: filter 0.05s;
    will-change: filter;
    -webkit-backface-visibility: hidden;
    -webkit-transform: translateZ(0);
    /* pointer-events: none; removed to enable hover */
    pointer-events: auto;
  }
  /* .no-pointer class removed */
  .blur:hover {
    filter: blur(4px);
    -webkit-filter: blur(4px);
  }
  .no-pointer {
    pointer-events: none;
  }
  .noticing {
    text-decoration: none;
    background-image: linear-gradient(to right, currentColor 33%, transparent 33%);
    background-position: bottom;
    background-size: 4px 1px;
    background-repeat: repeat-x;
  }
  @media (max-width: 700px) {
    .sidebar {
      position: static;
      width: 100vw;
      height: auto;
      border-right: none;
      padding: 1rem;
    }
    .gallery-scroll {
      margin-left: 0;
      height: auto;
      background: #fafafa;
    }
    .info-container p {
      max-width: 100vw;
    }
  }
  @media (max-width: 700px) {
    .img-row img {
      max-width: 100%;
    }
  }
</style>
