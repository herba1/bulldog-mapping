"use client";

import { useRef, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const INTITIAL_CENTER: [number, number] = [-119.74784, 36.81226];
const INITIAL_ZOOM = 15;
const DETAIL_ZOOM_THRESHOLD = 18; // Zoom level below which markers become simple dots

// Define the prop types
interface Map2Props {
  events: any[]; // Replace 'any[]' with your actual event type
}

// Custom React component for the marker
interface EventMarkerProps {
  event: any;
  onClick: () => void;
  isSimple: boolean;
}

// Helper function to calculate time until start
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

function EventMarker({ event, onClick, isSimple }: EventMarkerProps) {
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

  // Simple dot marker for zoomed out view
  if (isSimple) {
    return (
      <div
        onClick={onClick}
        className={`w-4 h-4 rounded-full cursor-pointer shadow-md transition-transform hover:scale-125 ${
          timeUntil?.urgent ? 'bg-red-500' : 'bg-blue-500'
        }`}
        style={{
          border: '2px solid white',
        }}
      />
    );
  }

  // Detailed marker for zoomed in view
  return (
    <div
      onClick={onClick}
      className={`bg-white border-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${
        timeUntil?.urgent ? 'border-red-500' : 'border-blue-500'
      }`}
      style={{
        width: '200px', // Fixed width
        maxWidth: '200px',
      }}
    >
      {/* Header with event name and countdown */}
      <div className={`px-3 py-2 rounded-t-lg ${
        timeUntil?.urgent ? 'bg-red-500' : 'bg-blue-500'
      } text-white`}>
        <div className="font-semibold text-sm truncate">{event.name || 'Event'}</div>
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
            <span className={`${timeUntil?.color || 'text-gray-700'} truncate`}>
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
            <span className="text-gray-400 truncate">
              {new Date(event.datePosted).toLocaleDateString()}
            </span>
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
  const markersRef = useRef<{ marker: mapboxgl.Marker; root: any }[]>([]);

  const [center, setCenter] = useState<[number, number]>(INTITIAL_CENTER);
  const [zoom, setZoom] = useState<number>(INITIAL_ZOOM);
  const [isSimpleView, setIsSimpleView] = useState<boolean>(false);

  // Handle marker click
  const handleEventClick = (event: any) => {
    console.log("Event clicked:", event);
    
    // Zoom to event location if in simple view
    if (isSimpleView && mapRef.current) {
      mapRef.current.flyTo({
        center: [event.longitude, event.latitude],
        zoom: DETAIL_ZOOM_THRESHOLD + 1,
        duration: 1000
      });
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: INTITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });

    mapRef.current.on("move", () => {
      if (mapRef.current) {
        const mapCenter = mapRef.current.getCenter();
        const mapZoom = mapRef.current.getZoom();
        setCenter([mapCenter.lng, mapCenter.lat]);
        setZoom(mapZoom);
        
        // Update simple view state based on zoom
        setIsSimpleView(mapZoom < DETAIL_ZOOM_THRESHOLD);
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

  // Add/update markers when events or view mode changes
  useEffect(() => {
    if (!mapRef.current || !events) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker, root }) => {
      root.unmount();
      marker.remove();
    });
    markersRef.current = [];

    // Add new markers
    events.forEach((event) => {
      // Create a div element for the marker
      const el = document.createElement("div");
      el.className = "custom-marker";
      // Prevent map panning when clicking marker
      el.style.pointerEvents = 'auto';

      // Create marker with no offset for simple view, offset for detailed view
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: isSimpleView ? 'center' : 'top'
      })
        .setLngLat([event.longitude, event.latitude])
        .addTo(mapRef.current!);

      // Create React root and render component
      const root = createRoot(el);
      root.render(
        <EventMarker 
          event={event} 
          onClick={() => handleEventClick(event)}
          isSimple={isSimpleView}
        />
      );

      // Store reference for cleanup
      markersRef.current.push({ marker, root });
    });

    // Cleanup function
    return () => {
      markersRef.current.forEach(({ marker, root }) => {
        root.unmount();
        marker.remove();
      });
      markersRef.current = [];
    };
  }, [events, isSimpleView]);

  return (
    <>
      {/* Optional: Show zoom level indicator */}
      {/* <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-sm border border-neutral-300 z-10">
        <div>Zoom: {zoom.toFixed(2)}</div>
        <div>View: {isSimpleView ? 'Simple' : 'Detailed'}</div>
      </div> */}
      <div
        ref={mapContainerRef}
        id="map-container"
        className="bg-neutral-200 absolute w-full h-full top-0 left-0 right-0 bottom-0"
      ></div>
    </>
  );
}