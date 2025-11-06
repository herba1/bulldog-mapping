"use client";

import { useRef, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const INTITIAL_CENTER: [number, number] = [-119.74784, 36.81226];
const INITIAL_ZOOM = 15;

// Define the prop types
interface Map2Props {
  events: any[]; // Replace 'any[]' with your actual event type
}

// Custom marker component
interface EventMarkerProps {
  event: any;
  onClick: () => void;
}

function getTimeUntilStart(dateStart: string | Date) {
  const now = new Date();
  const start = new Date(dateStart);
  const diffMs = start.getTime() - now.getTime();
  
  // Event has already started or passed
  if (diffMs < 0) {
    return { text: 'Started', color: 'text-gray-500', urgent: false };
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Less than 1 hour - show minutes (URGENT)
  if (diffHours < 1) {
    return { 
      text: `${diffMinutes} min`, 
      color: 'text-red-600', 
      urgent: true 
    };
  }
  
  // Less than 24 hours - show hours (SOON)
  if (diffDays < 1) {
    return { 
      text: `${diffHours} hours`, 
      color: 'text-orange-600', 
      urgent: true 
    };
  }
  
  // Less than 7 days - show days
  if (diffDays < 7) {
    return { 
      text: `${diffDays} days`, 
      color: 'text-blue-600', 
      urgent: false 
    };
  }
  
  // More than 7 days - show weeks
  const diffWeeks = Math.floor(diffDays / 7);
  return { 
    text: `${diffWeeks} week${diffWeeks > 1 ? 's' : ''}`, 
    color: 'text-gray-600', 
    urgent: false 
  };
}

function EventMarker({ event, onClick }: EventMarkerProps) {
  const [timeUntil, setTimeUntil] = useState(() => 
    event.dateStart ? getTimeUntilStart(event.dateStart) : null
  );

  useEffect(() => {
    if (!event.dateStart) return;
    
    // Update every minute
    const interval = setInterval(() => {
      setTimeUntil(getTimeUntilStart(event.dateStart));
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(interval);
  }, [event.dateStart]);

  return (
    <div
      onClick={onClick}
      className={`bg-white border-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all min-w-[200px] max-w-[250px] ${
        timeUntil?.urgent ? 'border-red-500' : 'border-blue-500'
      }`}
    >
      {/* Header with event name and countdown */}
      <div className={`px-3 py-2 rounded-t-lg ${
        timeUntil?.urgent ? 'bg-red-500' : 'bg-blue-500'
      } text-white`}>
        <div className="font-semibold text-sm">{event.name || 'Event'}</div>
        {timeUntil && (
          <div className="text-xs opacity-90 mt-0.5">
            {timeUntil.text === 'Started' ? '🔴 Started' : `⏱️ in ${timeUntil.text}`}
          </div>
        )}
      </div>
      
      {/* Content area */}
      <div className="px-3 py-2 space-y-1">
        {/* Date Start with time */}
        {event.dateStart && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Starts:</span>
            <span className={timeUntil?.color || 'text-gray-700'}>
              {new Date(event.dateStart).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
        
        {/* Date Posted */}
        {event.datePosted && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Posted:</span>
            <span className="text-gray-400">{new Date(event.datePosted).toLocaleDateString()}</span>
          </div>
        )}
        
        {/* Description */}
        {event.description && (
          <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
            <p className="line-clamp-2">{event.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// map will take building and polygon data and event data as props =)
export default function Map2({ events }: Map2Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Array<{ marker: mapboxgl.Marker; root: any }>>([]);

  const [center, setCenter] = useState<[number, number]>(INTITIAL_CENTER);
  const [zoom, setZoom] = useState<number>(INITIAL_ZOOM);

  // Handle event click
  const handleEventClick = (event: any) => {
    console.log('Clicked event:', event);
    // Add your custom logic here (e.g., show modal, navigate, etc.)
  };

  // Initialize map
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: INTITIAL_CENTER,
      zoom: INITIAL_ZOOM,
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
      // Clean up markers
      markersRef.current.forEach(({ marker, root }) => {
        root.unmount();
        marker.remove();
      });
      markersRef.current = [];

      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Add/update markers when events change
  useEffect(() => {
    if (!mapRef.current || !events) return;

    // Clean up existing markers
    markersRef.current.forEach(({ marker, root }) => {
      root.unmount();
      marker.remove();
    });
    markersRef.current = [];

    // Add new markers
    events.forEach((event) => {
      // Ensure event has coordinates
      if (!event.longitude || !event.latitude) {
        console.warn('Event missing coordinates:', event);
        return;
      }

      // Create a DOM element for the marker
      const el = document.createElement('div');
      el.className = 'custom-marker';

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([event.longitude, event.latitude])
        .addTo(mapRef.current!);

      // Create React root and render component
      const root = createRoot(el);
      root.render(
        <EventMarker 
          event={event} 
          onClick={() => handleEventClick(event)} 
        />
      );

      // Store reference for cleanup
      markersRef.current.push({ marker, root });
    });

    // Cleanup function for this effect
    return () => {
      markersRef.current.forEach(({ marker, root }) => {
        root.unmount();
        marker.remove();
      });
      markersRef.current = [];
    };
  }, [events]);

  return (
    <>
      {/* <div className="absolute top-4 left-4 bg-white p-4 w-xs rounded-lg inset-shadow-2xs shadow-sm border-1 border-neutral-300 z-10">
        <div>Longitude: {center[0].toFixed(5)}</div>
        <div>Latitude: {center[1].toFixed(5)}</div>
        <div>Zoom: {zoom.toFixed(2)}</div>
      </div> */}
      <div
        ref={mapContainerRef}
        id="map-container"
        className="bg-neutral-200 absolute w-full h-full top-0 left-0 right-0 bottom-0"
      ></div>
    </>
  );
}