"use client";

import { MapPin, Clock, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { useMapContext } from "@/context/MapContext";
import { MatchResult } from "@/types/schedule";
import { Tables } from "@/types/supabase";
import { getCenterFromPolygon } from "@/utils/pathfinding/geoUtils";

type BuildingPolygon = Tables<"building_polygons">;

interface ClassCardProps {
  result: MatchResult;
  index: number;
  buildingPolygons: BuildingPolygon[];
}

export default function ClassCard({ result, index, buildingPolygons }: ClassCardProps) {
  const { flyTo, highlightRouteStop } = useMapContext();
  const { parsedClass, match } = result;

  const getConfidenceColor = () => {
    if (!match) return "bg-red-500";
    if (match.confidence >= 90) return "bg-green-500";
    if (match.confidence >= 70) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getConfidenceIcon = () => {
    if (!match) return <AlertCircle className="w-3.5 h-3.5" />;
    if (match.confidence >= 90) return <CheckCircle className="w-3.5 h-3.5" />;
    return <HelpCircle className="w-3.5 h-3.5" />;
  };

  const handleClick = () => {
    if (match) {
      // Find building polygon to get coordinates
      const polygon = buildingPolygons.find(
        (bp) => bp.building_id === match.building.id
      );
      if (polygon?.geojson) {
        try {
          const [lng, lat] = getCenterFromPolygon(polygon.geojson);
          flyTo(lng, lat, 17);
          highlightRouteStop(index - 1);
        } catch {
          console.warn("Could not get building coordinates");
        }
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-3 rounded-lg border transition-all duration-150 ease-out-2
        ${match ? "cursor-pointer hover:border-highlight hover:shadow-sm" : "opacity-75"}
        ${match ? "bg-white border-neutral-200" : "bg-neutral-50 border-neutral-200"}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Order Number */}
        <div
          className={`
            w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0
            ${match ? "bg-highlight" : "bg-neutral-400"}
          `}
        >
          {index}
        </div>

        {/* Class Info */}
        <div className="flex-1 min-w-0">
          {/* Course Code / Name */}
          <div className="font-medium text-neutral-800 truncate">
            {parsedClass.courseCode || parsedClass.courseName || `Class ${index}`}
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {parsedClass.startTime}
              {parsedClass.endTime && ` - ${parsedClass.endTime}`}
            </span>
            {parsedClass.daysOfWeek.length > 0 && (
              <span className="text-neutral-400">
                ({parsedClass.daysOfWeek.join(", ")})
              </span>
            )}
          </div>

          {/* Building / Room */}
          <div className="flex items-center gap-1.5 text-sm mt-1">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            {match ? (
              <span className="text-neutral-700 truncate">
                {match.building.name}
                {parsedClass.roomRaw && (
                  <span className="text-neutral-400"> • {parsedClass.roomRaw}</span>
                )}
              </span>
            ) : (
              <span className="text-neutral-500 italic truncate">
                {parsedClass.buildingRaw || "Unknown location"}
              </span>
            )}
          </div>
        </div>

        {/* Confidence Indicator */}
        <div
          className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white
            ${getConfidenceColor()}
          `}
          title={match ? `${match.confidence}% confidence` : "No match found"}
        >
          {getConfidenceIcon()}
        </div>
      </div>

      {/* Suggestions for low confidence */}
      {match && match.confidence < 70 && result.suggestions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-100 text-xs text-neutral-500">
          <span>Did you mean: </span>
          {result.suggestions.slice(0, 2).map((s, i) => (
            <span key={s.building.id}>
              {i > 0 && ", "}
              <span className="text-highlight">{s.building.name}</span>
            </span>
          ))}
          ?
        </div>
      )}
    </div>
  );
}
