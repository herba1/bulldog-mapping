"use client";

import { useRef, useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useSelectionStore } from "../store/useSelectionStore";
import { mockEvents } from "../data";
import EventDetailsModal from "./events/EventDetailsModal"; // ✅ import modal

const INITIAL_CENTER: [number, number] = [-119.74784, 36.81226];
const INITIAL_ZOOM = 15;

export default function Map() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [zoom, setZoom] = useState<number>(INITIAL_ZOOM);
  const [showModal, setShowModal] = useState(false); // ✅ track modal visibility

  const { selectedEvent, setSelectedEvent } = useSelectionStore();

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: "mapbox://styles/mapbox/streets-v11",
    });

    // ✅ Add all event markers
    mapRef.current.on("load", () => {
      mockEvents.forEach((event: any) => {
        const hasValidCoords =
          typeof event.lng === "number" &&
          typeof event.lat === "number" &&
          !isNaN(event.lng) &&
          !isNaN(event.lat);

        if (!hasValidCoords) {
          console.warn("⚠️ Skipping event with invalid coordinates:", event);
          return;
        }

        // ✅ Popup for each marker
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<strong>${event.name}</strong><br>${event.location}`
        );

        // ✅ Marker for each event
        const marker = new mapboxgl.Marker({ color: "#e11d48" })
          .setLngLat([event.lng, event.lat])
          .setPopup(popup)
          .addTo(mapRef.current!);

        // ✅ Click on marker opens modal with details
        marker.getElement().addEventListener("click", () => {
          setSelectedEvent(event);
          setShowModal(true);
        });
      });
    });

    // Track map position
    mapRef.current.on("move", () => {
      if (mapRef.current) {
        const mapCenter = mapRef.current.getCenter();
        const mapZoom = mapRef.current.getZoom();
        setCenter([mapCenter.lng, mapCenter.lat]);
        setZoom(mapZoom);
      }
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, [setSelectedEvent]);

  // ✅ Fly to selected event (when triggered from Event List)
  useEffect(() => {
    if (selectedEvent && mapRef.current) {
      const { lat, lng, name, location } = selectedEvent;

      if (typeof lat !== "number" || typeof lng !== "number") return;

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 17,
        essential: true,
      });

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<strong>${name}</strong><br>${location}`
      );

      markerRef.current = new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapRef.current);

      popup.addTo(mapRef.current);
    }
  }, [selectedEvent]);

  return (
    <>

      {/* Map container */}
      <div
        ref={mapContainerRef}
        id="map-container"
        className="absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-neutral-200"
      ></div>

      {/* ✅ Show event details modal when marker is clicked */}
      {showModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
