<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  
  export let data: PageData;
  
  let mapContainer: HTMLDivElement;
  let map: any;
  
  onMount(async () => {
    // Dynamically import Leaflet to avoid SSR issues
    const L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');
    
    // Initialize map
    map = L.map(mapContainer).setView([45.5017, -73.5673], 2); // Default to Montreal
    
    // Add CartoDB Positron tiles (minimal grayscale basemap)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    
    // Add markers for each geotagged image
    data.geotaggedImages.forEach((img: any) => {
      // Create custom icon using thumbnail image
      const customIcon = L.divIcon({
        html: `<img src="${img.thumbnail}" style="width: 40px; height: 53px; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" />`,
        iconSize: [40, 53],
        iconAnchor: [20, 53], // Point of the icon which will correspond to marker's location
        popupAnchor: [0, -53], // Point from which the popup should open relative to the iconAnchor
        className: 'custom-thumbnail-marker'
      });
      
      const marker = L.marker([img.latitude, img.longitude], { icon: customIcon }).addTo(map);
      
      // Create popup with proper image sizing
      const popupContent = `
        <div style="width: 240px; height: 320px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <img src="${img.thumbnail}" 
               style="width: 100%; height: 100%; object-fit: contain;" 
               alt="${img.filename}" />
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        maxWidth: 240,
        minWidth: 240
      });
    });
    
    // Fit map to show all markers if there are any
    if (data.geotaggedImages.length > 0) {
      const bounds = L.latLngBounds(
        data.geotaggedImages.map((img: any) => [img.latitude, img.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  });
</script>

<svelte:head>
  <title>Map - Conditions of Observation</title>
</svelte:head>

<div class="map-page">
  <div class="map-container" bind:this={mapContainer}></div>
  <div class="info">
    <p>{data.geotaggedImages.length} geotagged images</p>
  </div>
</div>

<style>
  .map-page {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding-top: 4rem;
    padding-bottom: 3rem;
    width: 100%;
  }
  
  .map-container {
    width: 100%;
    height: 100%;
  }
  
  .info {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: white;
    padding: 0.5rem 1rem;
    border: 1px solid #e0e0e0;
    font-style: italic;
    z-index: 1000;
  }
  
  .info p {
    margin: 0;
  }
  
  :global(.custom-thumbnail-marker) {
    background: none !important;
    border: none !important;
  }
</style>
