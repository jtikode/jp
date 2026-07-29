"use client";

import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

export interface VisitPoint {
  sequence: number;
  storeName: string;
  time: string;
  lat: number;
  lng: number;
}

const SEQUENCE_COLORS = ["#1d4ed8", "#b91c1c", "#15803d", "#a16207", "#6d28d9", "#0e7490"];

function numberedIcon(sequence: number): L.DivIcon {
  const color = SEQUENCE_COLORS[(sequence - 1) % SEQUENCE_COLORS.length];
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,0.4);border:2px solid #fff;">${sequence}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function VisitSequenceMap({ points }: { points: VisitPoint[] }) {
  const center = useMemo((): [number, number] => {
    if (points.length === 0) return [19.076, 72.8777];
    const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
    return [lat, lng];
  }, [points]);

  const path = useMemo((): [number, number][] => points.map((p) => [p.lat, p.lng]), [points]);

  return (
    <MapContainer center={center} zoom={12} style={{ height: "500px", width: "100%" }} className="rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={path} pathOptions={{ color: "#1d4ed8", weight: 3, dashArray: "6 6" }} />
      {points.map((p) => (
        <Marker key={p.sequence} position={[p.lat, p.lng]} icon={numberedIcon(p.sequence)}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">
                #{p.sequence} {p.storeName}
              </p>
              <p className="text-slate-500">{p.time}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
