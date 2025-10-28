import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { mockEvents } from "../data/mockEvents";
import { useSelectionStore } from "../store/useSelectionStore";
import EventDetailsModal from "./EventDetailsModal";

const INITIAL_CENTER = [-119.74784, 36.81226];
const INITIAL_ZOOM = 15;

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN; // <-- use your token here

export default function MapBox() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [showModal, setShowModal] = useState(false);
  const { selectedEvent, setSelectedEvent } = useSelectionStore();

  useEffect(() => {
    if (mapRef.current) return; // initialize only once

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: "mapbox://styles/mapbox/streets-v11",
    });

    mapRef.current.on("load", () => {
      mockEvents.forEach((event) => {
        if (
          typeof event.lat === "number" &&
          typeof event.lng === "number" &&
          !isNaN(event.lat) &&
          !isNaN(event.lng)
        ) {
          const marker = new mapboxgl.Marker({ color: "#e11d48" })
            .setLngLat([event.lng, event.lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<strong>${event.name}</strong><br>${event.location}`
              )
            )
            .addTo(mapRef.current);

          marker.getElement().addEventListener("click", () => {
            setSelectedEvent(event);
            setShowModal(true);
          });
        }
      });
    });

    mapRef.current.on("move", () => {
      const c = mapRef.current.getCenter();
      setCenter([c.lng, c.lat]);
      setZoom(mapRef.current.getZoom());
    });
  }, []);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "white",
          padding: "10px",
          borderRadius: "8px",
          zIndex: 5,
        }}
      >
        <div>Lng: {center[0].toFixed(5)}</div>
        <div>Lat: {center[1].toFixed(5)}</div>
        <div>Zoom: {zoom.toFixed(2)}</div>
      </div>

      <div
        ref={mapContainer}
        style={{
          height: "100vh",
          width: "100%",
        }}
      ></div>

      {showModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
