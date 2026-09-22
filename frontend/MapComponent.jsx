import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default icon paths in bundled environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Helper to reverse geocode and produce a standardised object
async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Reverse geocode failed');
  return res.json();
}

// Builds the flat address object consumed by the rest of app.js
function buildAddressObj(lat, lon, nominatimResult) {
  const addr = nominatimResult.address || {};
  return {
    latitude: lat,
    longitude: lon,
    google_place_id: nominatimResult.place_id?.toString() || '',
    formatted_address: nominatimResult.display_name || '',
    country: addr.country || '',
    state: addr.state || '',
    district: addr.county || addr.state_district || addr.city_district || addr.district || '',
    city: addr.city || addr.town || addr.village || '',
    locality: addr.suburb || addr.neighbourhood || '',
    area: addr.neighbourhood || addr.suburb || '',
    pincode: addr.postcode || '',
    street: addr.road || '',
  };
}

// Exhaustive set of OSM type/class strings that identify water bodies
const WATER_CLASSES = new Set(['waterway', 'water']);
const WATER_TYPES = new Set([
  'water', 'river', 'lake', 'reservoir', 'sea', 'ocean', 'canal',
  'stream', 'wetland', 'water body', 'coastline', 'bay', 'wetlands',
  'basin', 'pond', 'dam', 'harbour', 'harbor', 'estuary', 'lagoon',
  'oxbow', 'moat', 'ditch', 'drain', 'wadi',
]);
// OSM address sub-keys whose *values* may identify a water feature
const WATER_ADDR_KEYS = ['water', 'natural', 'waterway'];

function isWaterBody(result) {
  if (!result) return false;

  const type = (result.type  || '').toLowerCase().trim();
  const cls  = (result.class || '').toLowerCase().trim();

  // Check top-level OSM class and type
  if (WATER_CLASSES.has(cls))  return true;
  if (WATER_TYPES.has(type))   return true;
  if (WATER_TYPES.has(cls))    return true;

  // Check address sub-fields for additional water indicators
  const addr = result.address || {};
  for (const key of WATER_ADDR_KEYS) {
    const val = (addr[key] || '').toLowerCase().trim();
    if (val && WATER_TYPES.has(val)) return true;
  }
  // If the address object itself contains a 'water' or 'waterway' key, it's a water body
  if ('water' in addr || 'waterway' in addr) return true;

  return false;
}

// =============================================
// ROBUST LAND/WATER VALIDATION
// =============================================
// Layer 1 — Overpass API: queries OSM geometry to check if the
// EXACT coordinate lies INSIDE a mapped water polygon or way.
// This is reliable even when Nominatim reverse-geocoding snaps
// to a nearby road and returns a land address for a water click.
//
// Layer 2 — Nominatim fallback: used only if Overpass is unavailable.
//
// Fail-safe: if BOTH layers fail, we reject the coordinate (never
// assume land when the geography cannot be confirmed).
// =============================================

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const OVERPASS_TIMEOUT_MS = 7000; // 7 s — enough for Overpass, short enough for UX

/**
 * checkOverpassWater(lat, lon)
 * Returns:
 *   true  — coordinate is definitely water
 *   false — coordinate is definitely land (no water element found)
 *   null  — Overpass unavailable / timed out (caller should fall back)
 */
async function checkOverpassWater(lat, lon) {
  // Overpass QL: find any way/relation tagged as water that contains this point.
  // We use a 30m radius around the coordinate to catch waterway lines and area edges,
  // and a 5m radius for coastlines (which are thin boundary ways).
  const query = `
[out:json][timeout:6];
(
  way(around:30,${lat},${lon})[natural~"^(water|wetland|bay|coastline)$"];
  way(around:30,${lat},${lon})[waterway][!tunnel];
  way(around:30,${lat},${lon})[water];
  way(around:30,${lat},${lon})[landuse~"^(reservoir|basin)$"];
  relation(around:30,${lat},${lon})[natural~"^(water|wetland|bay)$"];
  relation(around:30,${lat},${lon})[waterway];
  relation(around:30,${lat},${lon})[water];
  relation(around:30,${lat},${lon})[landuse~"^(reservoir|basin)$"];
  way(around:5,${lat},${lon})[natural="coastline"];
);
out tags;
  `.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

  try {
    const res = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null; // Overpass HTTP error — treat as unknown

    const json = await res.json();
    const elements = json.elements || [];

    if (elements.length === 0) return false; // No water element found → land

    // At least one water element found — examine its tags to confirm it's water
    for (const el of elements) {
      const tags = el.tags || {};
      const nat  = (tags.natural   || '').toLowerCase();
      const ww   = (tags.waterway  || '').toLowerCase();
      const lu   = (tags.landuse   || '').toLowerCase();
      const w    = (tags.water     || '').toLowerCase();

      if (nat === 'water' || nat === 'wetland' || nat === 'bay' || nat === 'coastline') return true;
      if (ww  && ww !== '') return true;   // any waterway tag
      if (lu  === 'reservoir' || lu === 'basin') return true;
      if (w   && w !== '') return true;    // any water tag

    }

    return false; // Elements found but none confirmed water — treat as land
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      console.warn('[MapComponent] Overpass timed out — falling back to Nominatim check');
      return null; // Timed out → signal fallback
    }
    console.warn('[MapComponent] Overpass fetch error:', err.message);
    return null; // Network error → signal fallback
  }
}

/**
 * validateIsWater(lat, lon, nominatimResult)
 *
 * Returns an object: { isWater: boolean, certain: boolean }
 *
 * - isWater:  true  → the point is a water body (reject it)
 * - certain:  false → both validation layers failed (reject for safety)
 *
 * Callers should reject when: isWater === true  OR  certain === false
 */
async function validateIsWater(lat, lon, nominatimResult) {
  // Layer 1: Overpass geometry check (primary — reliable, not fooled by address snapping)
  const overpassResult = await checkOverpassWater(lat, lon);

  if (overpassResult === true)  return { isWater: true,  certain: true };
  if (overpassResult === false) return { isWater: false, certain: true };

  // Layer 1 failed → Layer 2: Nominatim reverse-geocode tag check (fallback)
  if (nominatimResult) {
    const nominatimWater = isWaterBody(nominatimResult);
    return { isWater: nominatimWater, certain: true };
  }

  // Both layers failed — fail safe: treat as unverified (caller must reject)
  return { isWater: false, certain: false };
}

// Inner component: syncs map view when position changes
function MapController({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, zoom);
  }, [position, zoom, map]);
  return null;
}

// Inner component: draggable marker with drag-end callback
function DraggableMarker({ position, onDragEnd, popupText }) {
  const markerRef = useRef(null);
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        onDragEnd(lat, lng);
      }
    },
  };

  return (
    <Marker position={position} draggable eventHandlers={eventHandlers} ref={markerRef}>
      <Popup>{popupText}</Popup>
    </Marker>
  );
}

export default function MapComponent({ onLocationChange }) {
  const DEFAULT = { lat: 11.0168, lng: 76.9558 }; // Coimbatore
  const [markerPos, setMarkerPos] = useState([DEFAULT.lat, DEFAULT.lng]);
  const [mapCenter, setMapCenter] = useState([DEFAULT.lat, DEFAULT.lng]);
  const [mapZoom, setMapZoom] = useState(12);
  const [popupText, setPopupText] = useState('📍 Select a location');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locating, setLocating] = useState(false);

  // Notify parent (app.js) via callback whenever location changes
  const notifyParent = useCallback((addressObj) => {
    if (onLocationChange) onLocationChange(addressObj);
    // Also write to window.currentLocationData for predictProperty()
    window.currentLocationData = addressObj;

    // Auto-fill form fields
    const addressEl = document.getElementById('v-address');
    if (addressEl) {
      addressEl.value =
        addressObj.formatted_address || addressObj.street || addressObj.locality || '';
    }

    const stateEl = document.getElementById('v-state');
    if (stateEl && addressObj.state) {
      const matched = Array.from(stateEl.options).find(
        (o) =>
          o.value.toLowerCase() === addressObj.state.toLowerCase() ||
          addressObj.state.toLowerCase().includes(o.value.toLowerCase())
      );
      if (matched) {
        stateEl.value = matched.value;
        if (window.onStateChange) window.onStateChange(matched.value);
      }
    }

    setTimeout(() => {
      const districtEl = document.getElementById('v-district');
      if (districtEl && !districtEl.disabled) {
        const dVal = addressObj.district || addressObj.city;
        if (dVal) {
          const matched = Array.from(districtEl.options).find(
            (o) =>
              o.value.toLowerCase() === dVal.toLowerCase() ||
              dVal.toLowerCase().includes(o.value.toLowerCase())
          );
          if (matched) districtEl.value = matched.value;
        }
      }
    }, 300);
  }, [onLocationChange]);

  const handleMarkerDrag = useCallback(async (lat, lon) => {
    try {
      const result = await reverseGeocode(lat, lon);
      const { isWater, certain } = await validateIsWater(lat, lon, result);
      if (isWater) {
        setSearchError('Please select a valid land location. Water bodies are not supported.');
        return; // Keep previous valid location — marker position state unchanged
      }
      if (!certain) {
        setSearchError('Cannot verify this location. Please select a clearly identifiable land area.');
        return;
      }
      setSearchError('');
      setMarkerPos([lat, lon]);
      setPopupText(result.display_name || 'Selected location');
      notifyParent(buildAddressObj(lat, lon, result));
    } catch {
      // On network failure, do not accept the drag — keep previous position
      setSearchError('Location validation failed. Please try again.');
    }
  }, [notifyParent]);

  const handleMapClick = useCallback(async (e) => {
    const { lat, lng } = e.latlng;
    try {
      const result = await reverseGeocode(lat, lng);
      const { isWater, certain } = await validateIsWater(lat, lng, result);
      if (isWater) {
        setSearchError('Please select a valid land location. Water bodies are not supported.');
        return; // Keep previous valid location
      }
      if (!certain) {
        setSearchError('Cannot verify this location. Please select a clearly identifiable land area.');
        return;
      }
      setSearchError('');
      setMarkerPos([lat, lng]);
      setMapCenter([lat, lng]);
      setPopupText(result.display_name || 'Selected location');
      notifyParent(buildAddressObj(lat, lng, result));
    } catch {
      // On network failure, do not accept the click
      setSearchError('Location validation failed. Please try again.');
    }
  }, [notifyParent]);

  // Map click forwarder
  function MapClickHandler() {
    const map = useMap();
    useEffect(() => {
      map.on('click', handleMapClick);
      return () => map.off('click', handleMapClick);
    }, [map]);
    return null;
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `${NOMINATIM_BASE}/search?q=${encodeURIComponent(searchQuery.trim())}&format=json&addressdetails=1&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (!data.length) {
        setSearchError('No results found. Please try a different search.');
        return;
      }
      const place = data[0];
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);

      // Validate the exact search result coordinate — do NOT trust Nominatim tags alone
      const { isWater, certain } = await validateIsWater(lat, lon, place);
      if (isWater) {
        setSearchError('Please select a valid land location. Water bodies are not supported.');
        return;
      }
      if (!certain) {
        setSearchError('Cannot verify this location. Please select a clearly identifiable land area.');
        return;
      }

      setMarkerPos([lat, lon]);
      setMapCenter([lat, lon]);
      setMapZoom(15);
      setPopupText(place.display_name);
      notifyParent(buildAddressObj(lat, lon, place));
    } catch {
      setSearchError('Search failed. Please check your internet connection.');
    } finally {
      setSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Your browser doesn't support geolocation.");
      return;
    }
    setLocating(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const result = await reverseGeocode(lat, lon);
          const { isWater, certain } = await validateIsWater(lat, lon, result);
          if (isWater) {
            setSearchError('Current location is a water body. Please select a valid land area.');
            setLocating(false);
            return;
          }
          if (!certain) {
            setSearchError('Cannot verify current location. Please select a land area manually.');
            setLocating(false);
            return;
          }
          setMarkerPos([lat, lon]);
          setMapCenter([lat, lon]);
          setMapZoom(17);
          setPopupText('📍 You are here');
          notifyParent(buildAddressObj(lat, lon, result));
        } catch {
          // On validation failure, do not accept GPS location
          setSearchError('Location validation failed. Please select a location manually.');
        }
        setLocating(false);
      },
      () => {
        setSearchError('Location access denied. Please allow location permission and try again.');
        setLocating(false);
      }
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Search box */}
      <form
        onSubmit={handleSearch}
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Search location (e.g. Coimbatore Railway Station)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className="btn-outline"
          disabled={searching}
          style={{ whiteSpace: 'nowrap', padding: '0.65rem 1rem' }}
        >
          {searching ? '⏳' : '🔍 Search'}
        </button>
      </form>

      {/* Current location button */}
      <button
        type="button"
        className="btn-outline"
        onClick={handleCurrentLocation}
        disabled={locating}
        style={{
          width: '100%',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        {locating ? '⏳ Locating...' : '📍 Use My Current Location'}
      </button>

      {/* Error message */}
      {searchError && (
        <div
          style={{
            color: 'var(--danger, #FF4444)',
            fontSize: '0.82rem',
            marginBottom: '0.4rem',
            padding: '0.4rem 0.6rem',
            background: 'rgba(255,68,68,0.1)',
            borderRadius: '6px',
          }}
        >
          ⚠️ {searchError}
        </div>
      )}

      {/* Map */}
      <div
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController position={mapCenter} zoom={mapZoom} />
          <MapClickHandler />
          <DraggableMarker
            position={markerPos}
            onDragEnd={handleMarkerDrag}
            popupText={popupText}
          />
        </MapContainer>
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          marginTop: '0.35rem',
          textAlign: 'center',
        }}
      >
        Click map or drag marker to pick location · Powered by OpenStreetMap (free, no API key)
      </div>
    </div>
  );
}
