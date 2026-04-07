<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  export let data: PageData;

  let mapContainer: HTMLDivElement;
  let map: any;

  onMount(async () => {
    // Dynamically import MapLibre to avoid SSR issues
    const { Map, Marker, Popup, LngLatBounds } = await import('maplibre-gl');
    await import('maplibre-gl/dist/maplibre-gl.css');

    // Initialize map
    map = new Map({
      container: mapContainer,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-73.5673, 45.5017], // [lng, lat] - Default to Montreal
      zoom: 2
    });

    // Wait for the map style to load
    map.on('style.load', () => {
      console.log('Map style loaded, adding heatmap with', data.geotaggedImages.length, 'images');

      // Create GeoJSON for heatmap
      const geojson = {
        type: 'FeatureCollection',
        features: data.geotaggedImages.map((img: any) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [img.longitude, img.latitude]
          },
          properties: {
            filename: img.filename,
            weight: 1
          }
        }))
      };

      // Add heatmap source
      map.addSource('heatmap-source', {
        type: 'geojson',
        data: geojson
      });

      // Add heatmap layer
      map.addLayer({
        id: 'heatmap',
        type: 'heatmap',
        source: 'heatmap-source',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            0,
            0,
            1,
            1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            1,
            9,
            3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.1,
            'rgba(150,150,150,0.3)',
            0.3,
            'rgba(120,120,120,0.5)',
            0.5,
            'rgba(100,100,100,0.7)',
            0.7,
            'rgba(70,70,70,0.9)',
            1,
            'rgba(30,30,30,1)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            15,
            9,
            40
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            1,
            9,
            0.5
          ]
        }
      });
    });

    // Fit map to show all markers if there are any
    if (data.geotaggedImages.length > 0) {
      const lngLatArray = data.geotaggedImages.map((img: any) => [img.longitude, img.latitude]);
      const bounds = new LngLatBounds();
      lngLatArray.forEach((lngLat: any) => {
        bounds.extend(lngLat);
      });
      map.fitBounds(bounds, { padding: 50 });
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
</style>
