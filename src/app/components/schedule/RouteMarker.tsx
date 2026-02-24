"use client";

import { RouteStop } from "@/types/schedule";

interface RouteMarkerProps {
  stop: RouteStop;
  isStart: boolean;
  isEnd: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

export default function RouteMarker({
  stop,
  isStart,
  isEnd,
  isHighlighted,
  onClick,
}: RouteMarkerProps) {
  const getBackgroundColor = () => {
    if (isStart) return "bg-green-500";
    if (isEnd) return "bg-red-500";
    return "bg-highlight";
  };

  const getBorderColor = () => {
    if (isHighlighted) return "ring-4 ring-highlight/30";
    return "";
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer transition-transform duration-150 ease-out-2
        hover:scale-110 active:scale-95
        ${isHighlighted ? "scale-125" : ""}
      `}
    >
      {/* Main marker */}
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center
          text-white font-bold text-sm shadow-lg
          ${getBackgroundColor()}
          ${getBorderColor()}
        `}
      >
        {stop.order}
      </div>

      {/* Tooltip - shows on hover via CSS */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 -bottom-8
          whitespace-nowrap bg-white px-2 py-1 rounded-md
          text-xs shadow-md border border-neutral-200
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity duration-150
        `}
      >
        <div className="font-medium text-neutral-800">{stop.building.name}</div>
        {stop.className && (
          <div className="text-neutral-500">{stop.className}</div>
        )}
      </div>
    </div>
  );
}

// Simple marker for zoomed out view
interface SimpleRouteMarkerProps {
  stop: RouteStop;
  isStart: boolean;
  isEnd: boolean;
}

export function SimpleRouteMarker({ stop, isStart, isEnd }: SimpleRouteMarkerProps) {
  const getBackgroundColor = () => {
    if (isStart) return "bg-green-500";
    if (isEnd) return "bg-red-500";
    return "bg-highlight";
  };

  return (
    <div
      className={`
        w-5 h-5 rounded-full flex items-center justify-center
        text-white font-bold text-[10px] shadow-md
        ${getBackgroundColor()}
      `}
    >
      {stop.order}
    </div>
  );
}
