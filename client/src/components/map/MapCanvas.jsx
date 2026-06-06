import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import MarkerLayer from "./MarkerLayer.jsx";
import { defaultMapCenter, demoWaterResponseZones, getIssueCoordinates } from "../../data/mapInsights.js";
import "leaflet/dist/leaflet.css";

function MapViewportController({ issues }) {
  const map = useMap();

  useEffect(() => {
    const points = issues.map((issue) => getIssueCoordinates(issue)).filter(Boolean);

    if (points.length === 0) {
      map.setView(defaultMapCenter, 10);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    const bounds = latLngBounds(points);
    map.fitBounds(bounds.pad(0.2), {
      animate: true,
      maxZoom: 13,
    });
  }, [issues, map]);

  return null;
}

export default function MapCanvas({ issues, selectedIssueId, onSelectIssue }) {
  const visibleIssues = useMemo(() => {
    if (issues.length > 0) return issues;
    return demoWaterResponseZones;
  }, [issues]);

  return (
    <MapContainer center={defaultMapCenter} zoom={10} className="explore-map-canvas">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewportController issues={visibleIssues} />
      <MarkerLayer
        issues={visibleIssues}
        selectedIssueId={selectedIssueId}
        onSelectIssue={onSelectIssue}
      />
    </MapContainer>
  );
}
