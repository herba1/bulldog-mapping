"use client";

import { useRef, useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const INTITIAL_CENTER: [number, number] = [-119.74784, 36.81226];
const INITIAL_ZOOM = 15;

// Define the prop types
interface Map2Props {
  events: any[]; // Replace 'any[]' with your actual event type
}

// map will take building and polygon data and event data as props =)
export default function Map2({ events}: Map2Props) {
  const mapRef = useRef<mapboxgl.Map>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [center, setCenter] = useState<[number, number]>(INTITIAL_CENTER);
  const [zoom, setZoom] = useState<number>(INITIAL_ZOOM);

  useEffect(() => {
    // add your public token here
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: INTITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });

    events.forEach((event) => {
  const marker = new mapboxgl.Marker()
    .setLngLat([event.longitude, event.latitude])
    .addTo(mapRef.current!);

  const popup = new mapboxgl.Popup({ offset: 25 })
    .setHTML(`
      <div class="p-2">
        <h3 class="font-bold">${event.name}</h3>
        <p>${event.description}</p>
        <p>${event.datePosted}</p>
        <p>${event.dateStart}</p>
        <p>${event.dateEnd}</p>
      </div>
    `);

  marker.setPopup(popup);
});

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
    
  }, []);

  return (
    <>
      {/* <div className="absolute top-4 left-4 bg-white p-4 w-xs rounded-lg inset-shadow-2xs  shadow-sm border-1 border-neutral-300 z-10">
        <div>Longitude: {center[0].toFixed(5)}</div>
        <div>Latitude: {center[1].toFixed(5)}</div>
        <div>Zoom: {zoom.toFixed(2)}</div>
      </div> */}
      <div
        ref={mapContainerRef}
        id="map-container"
        className="bg-neutral-200 absolute w-full h-full top-0 left-0 right-0 bottom-0 "
      ></div>
    </>
  );
}
