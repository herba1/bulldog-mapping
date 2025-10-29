"use client";

import { useRef, useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useSelectionStore } from "../store/useSelectionStore";
import { mockEvents } from "../data";
import EventDetailsModal from "./events/EventDetailsModal";
import BuildingInfo from "./buildings/BuildingInfo"; // make sure you created this component!

const INITIAL_CENTER: [number, number] = [-119.74784, 36.81226];
const INITIAL_ZOOM = 15;

export default function Map() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null); // for blue selected marker

  const [showModal, setShowModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

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

    // Load event markers and buildings when map loads
    mapRef.current.on("load", async () => {
      // --- Add event markers ---
      markerRefs.current = mockEvents
        .map((event) => {
          const hasValidCoords =
            typeof event.lng === "number" &&
            typeof event.lat === "number" &&
            !isNaN(event.lng) &&
            !isNaN(event.lat);

          if (!hasValidCoords) return null;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="color:#000;font-weight:500;">
               <strong>${event.name}</strong><br>${event.location}
             </div>`
          );

          const marker = new mapboxgl.Marker({ color: "#e11d48" })
            .setLngLat([event.lng, event.lat])
            .setPopup(popup)
            .addTo(mapRef.current!);

          marker.getElement().addEventListener("click", () => {
            setSelectedEvent(event);
            setShowModal(true);
          });

          return marker;
        })
        .filter(Boolean) as mapboxgl.Marker[];

      // --- Load campus building outlines ---
      const response = await fetch("/map.geojson");
      const geojson = await response.json();

      if (!mapRef.current!.getSource("buildings")) {
        mapRef.current!.addSource("buildings", {
          type: "geojson",
          data: geojson,
        });
      }

      // Fill color for buildings
      mapRef.current!.addLayer({
        id: "building-fills",
        type: "fill",
        source: "buildings",
        paint: {
          "fill-color": "#1d4ed8", // Fresno State blue
          "fill-opacity": 0.3,
        },
      });

      // Border for buildings
      mapRef.current!.addLayer({
        id: "building-borders",
        type: "line",
        source: "buildings",
        paint: {
          "line-color": "#1e3a8a",
          "line-width": 1.5,
        },
      });

      // Click handler for buildings
      mapRef.current!.on("click", "building-fills", (e: any) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const properties = feature.properties || {};
        setSelectedBuilding(properties);
      });

      // Hover effects for buildings
      mapRef.current!.on("mouseenter", "building-fills", () => {
        mapRef.current!.getCanvas().style.cursor = "pointer";
      });
      mapRef.current!.on("mouseleave", "building-fills", () => {
        mapRef.current!.getCanvas().style.cursor = "";
      });
    });

    // Hide/Show pins based on zoom level
    mapRef.current.on("zoom", () => {
      const currentZoom = mapRef.current!.getZoom();

      if (currentZoom >= 14) {
        markerRefs.current.forEach(
          (marker) => (marker.getElement().style.display = "block")
        );
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.getElement().style.display = "block";
        }
      } else {
        markerRefs.current.forEach(
          (marker) => (marker.getElement().style.display = "none")
        );
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.getElement().style.display = "none";
        }
      }

      // Fully remove selected marker when zoomed too far out
      if (currentZoom < 10 && selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
        selectedMarkerRef.current = null;
      }
    });

    // Cleanup
    return () => {
      mapRef.current?.remove();
    };
  }, [setSelectedEvent]);

  // Fly to selected event from sidebar
  useEffect(() => {
    if (selectedEvent && mapRef.current) {
      const { lat, lng, name, location } = selectedEvent;
      if (typeof lat !== "number" || typeof lng !== "number") return;

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 17,
        essential: true,
      });

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="color:#000;font-weight:500;">
           <strong>${name}</strong><br>${location}
         </div>`
      );

      // Remove existing selected marker if any
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
      }

      // Create new blue marker
      selectedMarkerRef.current = new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapRef.current);

      selectedMarkerRef.current.togglePopup();
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

      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Building Info Sidebar */}
      {selectedBuilding && (
        <BuildingInfo
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
        />
      )}
    </>
  );
}
