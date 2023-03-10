/* eslint-disable */

export const displayMap = locations => {
  var map = new mapboxgl.Map({
    accessToken :
    'pk.eyJ1IjoiYmhhcmF0aGNzMjAxMyIsImEiOiJjbGVtZ3FtaHIwOTdhM3FvZmM5OGJucHNzIn0.Z3-McT1lP6LV-OmzYeYVcQ',

      container: 'map',
      style: 'mapbox://styles/bharathcs2013/cl1m37sic002u14lfb57q4rua',
      scrollZoom: false
      // center: [-118.113491, 34.111745],
      // zoom: 10,
      // interactive: false
    });
  
     const bounds = new mapboxgl.LngLatBounds();
   

    locations.forEach(loc => {
      // Create marker
      const el = document.createElement('div');
      el.className = 'marker';
  
      // Add marker
       new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat(loc.coordinates)
        .addTo(map);
  
      // Add popup
       new mapboxgl.Popup({
        offset: 30
      })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);
  
      // Extend map bounds to include current location
      bounds.extend(loc.coordinates);
    });
    
  

    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
      }
    });
  };

 