import { memo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons (Leaflet's bundled URLs break under bundlers)
const DefaultIcon = L.icon({
iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const STROKE = '#2f6a52';
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const STREET_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function FlyController({ center }) {
const map = useMap();
useEffect(() => {
if (center && !isNaN(center.lat) && !isNaN(center.lng)) {
map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 15), { duration: 0.9 });
}
}, [center?.lat, center?.lng]);
return null;
}

function ClickCapture({ enabled, onClick }) {
useMapEvents({
click(e) {
if (enabled) onClick([e.latlng.lat, e.latlng.lng]);
},
});
return null;
}

function MapPanel({ center, vertices, onVertexClick, drawEnabled, basemap = 'satellite' }) {
const tileUrl = basemap === 'street' ? STREET_URL : SATELLITE_URL;
return (
<MapContainer
center={[20, 0]}
zoom={3}
minZoom={2}
maxZoom={19}
className="h-full w-full"
zoomControl={true}
scrollWheelZoom={true}
worldCopyJump
>
<TileLayer url={tileUrl} attribution='&copy; Esri, Maxar, Earthstar Geographics' maxZoom={19} />
{basemap === 'satellite' && <TileLayer url={LABELS_URL} maxZoom={19} />}
<FlyController center={center} />
<ClickCapture enabled={drawEnabled} onClick={onVertexClick} />
{vertices.length >= 3 && (
<Polygon positions={vertices} pathOptions={{ color: STROKE, weight: 2.5, fillColor: STROKE, fillOpacity: 0.2 }} />
)}
{vertices.length >= 2 && vertices.length < 3 && (
<Polygon positions={vertices} pathOptions={{ color: STROKE, weight: 2, dashArray: '6 6', fillOpacity: 0 }} />
)}
{vertices.map((v, i) => (
<CircleMarker key={i} center={v} radius={5} pathOptions={{ color: '#1a201d', fillColor: STROKE, fillOpacity: 1, weight: 2 }} />
))}
{center && <Marker position={[center.lat, center.lng]} interactive={false} keyboard={false} />}
</MapContainer>
);
}

// memoized so typing in the search box / unrelated state changes don't re-render the map
export default memo(MapPanel);
