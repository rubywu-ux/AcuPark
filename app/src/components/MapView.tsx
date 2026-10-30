"use client";

import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { LatLng, ParkingLot, USER_LOCATION, availabilityAt, statusFor } from "@/services/mockData";

const lotIcon = (lot: ParkingLot, selected: boolean) => {
  const { open, total } = availabilityAt(lot, new Date());
  const status = statusFor(open, total).toLowerCase();
  return L.divIcon({
    className: "",
    html: `<div class="lot-pin ${status} ${selected ? "is-selected" : ""}"><span class="p">P</span>${open === 0 ? "Full" : open}</div>`,
    iconSize: [0, 0],
  });
};

const userIcon = L.divIcon({ className: "", html: `<div class="user-dot"></div>`, iconSize: [0, 0] });

const carIcon = (heading: number) =>
  L.divIcon({
    className: "",
    html: `<div class="car-marker"><div style="transform:rotate(${heading}deg)"><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2 L20 21 L12 17 L4 21 Z"/></svg></div></div>`,
    iconSize: [0, 0],
  });

function FlyTo({ center, zoom }: { center?: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 0.6 });
  }, [center, zoom, map]);
  return null;
}

function FitRoute({ route, padBottom }: { route: LatLng[]; padBottom: number }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLngBounds(route), { paddingTopLeft: [40, 140], paddingBottomRight: [40, padBottom] });
    // Fit once per route; the whole drive stays in view so the car never needs following.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route.length]);
  return null;
}

interface MapViewProps {
  lots?: ParkingLot[];
  selectedId?: string | null;
  onSelect?: (lot: ParkingLot) => void;
  focus?: LatLng;
  route?: LatLng[];
  traveled?: LatLng[];
  car?: { at: LatLng; heading: number };
  padBottom?: number;
}

export default function MapView({ lots = [], selectedId, onSelect, focus, route, traveled, car, padBottom = 280 }: MapViewProps) {
  const icons = useMemo(
    () => Object.fromEntries(lots.map((l) => [l.id, lotIcon(l, l.id === selectedId)])),
    [lots, selectedId]
  );

  return (
    <MapContainer
      center={[47.6588, -122.3085]}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {route && (
        <>
          <Polyline positions={route} pathOptions={{ color: "#ffffff", weight: 11, opacity: 0.9, lineJoin: "round" }} />
          <Polyline positions={route} pathOptions={{ color: "#502E83", weight: 6, lineJoin: "round" }} />
          {traveled && traveled.length > 1 && (
            <Polyline positions={traveled} pathOptions={{ color: "#A99BC0", weight: 6, lineJoin: "round" }} />
          )}
          <FitRoute route={route} padBottom={padBottom} />
        </>
      )}

      {!car && <Marker position={USER_LOCATION} icon={userIcon} zIndexOffset={500} interactive={false} />}

      {lots.map((lot) => (
        <Marker
          key={lot.id}
          position={lot.location}
          icon={icons[lot.id]}
          zIndexOffset={lot.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect?.(lot) }}
          keyboard
          title={lot.name}
        />
      ))}

      {car && (
        <Marker position={car.at} icon={carIcon(car.heading)} zIndexOffset={2000} interactive={false} />
      )}

      <FlyTo center={focus} zoom={16} />
    </MapContainer>
  );
}
