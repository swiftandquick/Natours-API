export const displayMap = (locations) => {
    // Add map to web site.  
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlbnltYTE2IiwiYSI6ImNsbm1meThoMzA2ZG0ybGxtZnM4MGF0ZzIifQ._Z6yFLAq7uGg4u_nmD6Tww';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        scrollZoom: false
    });

    // bounds is the area that will be displayed on the map, the area should contain all locations on the map.  
    const bounds = new mapboxgl.LngLatBounds();

    // Create marker, add popup and add marker for each location.  
    locations.forEach(loc => {
        const el = document.createElement('div'); 
        el.className = 'marker';
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
        new mapboxgl.Popup()
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}:  ${loc.description}</p>`)
            .addTo(map);
        bounds.extend(loc.coordinates);
    });

    // Zoom the map to bounds, which should be around the tour locations on the map.  
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}