import React from 'react';
import { createRoot } from 'react-dom/client';
import MapComponent from './MapComponent.jsx';

/**
 * mountLeafletMap(containerId)
 *
 * Called from app.js via window.mountLeafletMap(containerId).
 * Mounts the React-Leaflet MapComponent into the specified DOM element.
 */
window.mountLeafletMap = function (containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`mountLeafletMap: element #${containerId} not found`);
    return;
  }
  // Avoid double-mounting
  if (container._leafletRootMounted) return;
  container._leafletRootMounted = true;

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MapComponent onLocationChange={(data) => {
        window.currentLocationData = data;
      }} />
    </React.StrictMode>
  );
};

// Notify app.js that mountLeafletMap is now available
window.dispatchEvent(new Event('leaflet-map-ready'));
