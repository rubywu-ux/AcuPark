"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ParkingLot } from "@/services/mockData";
import { useEffect } from "react";

// Fix for default Leaflet markers in Next.js
const iconRetinaUrl = 'leaflet/dist/images/marker-icon-2x.png';
const iconUrl = 'leaflet/dist/images/marker-icon.png';
const shadowUrl = 'leaflet/dist/images/marker-shadow.png';

// Custom Marker Component to render the colored "P" circles
const createCustomIcon = (status: string) => {
  let colorClass = "bg-green-600";
  let glowClass = "shadow-green-500/40";
  
  if (status === "Busy") {
    colorClass = "bg-orange-500";
    glowClass = "shadow-orange-500/40";
  }
  if (status === "Full") {
    colorClass = "bg-red-600";
    glowClass = "shadow-red-500/40";
  }

  return L.divIcon({
    className: "custom-marker",
    html: `<div class="${colorClass} w-10 h-10 rounded-full border-2 border-white shadow-lg ${glowClass} flex items-center justify-center text-white font-bold text-lg transition-transform hover:scale-110">P</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

interface MapProps {
  lots: ParkingLot[];
  selectedLot: ParkingLot | null;
  onLotSelect: (lot: ParkingLot) => void;
}

// Component to update map center when selected lot changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16);
  }, [center, map]);
  return null;
}

export default function Map({ lots, selectedLot, onLotSelect }: MapProps) {
  const defaultCenter: [number, number] = [47.6553, -122.3035]; // UW Seattle

  return (
    <MapContainer
      center={defaultCenter}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {lots.map((lot) => (
        <Marker
          key={lot.id}
          position={[lot.location.lat, lot.location.lng]}
          icon={createCustomIcon(lot.status)}
          eventHandlers={{
            click: () => onLotSelect(lot),
          }}
        >
        </Marker>
      ))}

      {selectedLot && (
        <MapUpdater center={[selectedLot.location.lat, selectedLot.location.lng]} />
      )}
    </MapContainer>
  );
}
