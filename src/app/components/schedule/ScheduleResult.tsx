"use client";

import { useState } from "react";
import { ArrowLeft, MapPin, Clock, Route, Eye, EyeOff, AlertTriangle, X, Save, Check } from "lucide-react";
import { useMapContext } from "@/context/MapContext";
import { MatchResult } from "@/types/schedule";
import { formatDistance, formatWalkTime } from "@/utils/pathfinding/geoUtils";
import { saveRoute } from "@/app/actions/savedRouteActions";
import { DayOfWeek, DAYS_OF_WEEK, DAY_LABELS } from "@/types/savedRoute";
import { User } from "@supabase/supabase-js";
import ClassCard from "./ClassCard";

interface ScheduleResultProps {
  results: MatchResult[];
  onBack: () => void;
  user: User | null;
  buildingNames: string[];
  parkingLotName: string | null;
}

export default function ScheduleResult({ results, onBack, user, buildingNames, parkingLotName }: ScheduleResultProps) {
  const { scheduleRoute, toggleRouteVisibility, clearScheduleRoute, flyTo, buildingPolygons } = useMapContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const { route, isVisible } = scheduleRoute;

  // Sort results by class time
  const sortedResults = [...results].sort((a, b) => {
    const timeA = a.parsedClass.startTime || "";
    const timeB = b.parsedClass.startTime || "";
    return timeA.localeCompare(timeB);
  });

  const matchedCount = results.filter((r) => r.match !== null).length;
  const unmatchedCount = results.length - matchedCount;

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    // Reset save status when changing selection
    if (saveStatus === "saved") setSaveStatus("idle");
  };

  const handleSaveRoute = async () => {
    if (!user || buildingNames.length === 0 || selectedDays.length === 0) return;
    setIsSaving(true);
    try {
      await Promise.all(
        selectedDays.map((day) => saveRoute(buildingNames, parkingLotName, day))
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to save route:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowOnMap = () => {
    if (route && route.stops.length > 0) {
      const firstStop = route.stops[0];
      flyTo(firstStop.coordinates[0], firstStop.coordinates[1], 16);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="button-depth group p-2 rounded-lg border border-transparent hover:border-highlight-hover hover:bg-highlight transition-[transform_background-color_border-color] duration-150 ease-out-2 cursor-pointer hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 group-hover:text-white transition-colors duration-150 ease-out-2" />
        </button>
        <h2 className="text-xl font-semibold">Your Schedule</h2>
      </div>

      {/* Summary Stats */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">
              {matchedCount} class{matchedCount !== 1 ? "es" : ""} found
            </span>
          </div>
        </div>
        {unmatchedCount > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {unmatchedCount} unmatched
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Route Summary */}
      {route && route.stops.length > 1 && (
        <div className="mb-4 p-3 bg-highlight/10 rounded-lg border border-highlight/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-highlight font-medium">
              <Route className="w-4 h-4" />
              <span>Walking Route</span>
            </div>
            <button
              onClick={toggleRouteVisibility}
              className="p-1.5 rounded hover:bg-highlight/20 transition-colors"
              title={isVisible ? "Hide route" : "Show route"}
            >
              {isVisible ? (
                <Eye className="w-4 h-4 text-highlight" />
              ) : (
                <EyeOff className="w-4 h-4 text-neutral-400" />
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-neutral-600">
              <MapPin className="w-3.5 h-3.5" />
              <span>{formatDistance(route.totalDistance)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-600">
              <Clock className="w-3.5 h-3.5" />
              <span>~{formatWalkTime(route.totalWalkTime)}</span>
            </div>
          </div>
          <button
            onClick={handleShowOnMap}
            className="mt-3 w-full py-2 bg-highlight text-white text-sm rounded-lg hover:bg-highlight-hover transition-colors"
          >
            Show on Map
          </button>
        </div>
      )}

      {/* Class List */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        <div className="space-y-2">
          {sortedResults.map((result, index) => (
            <ClassCard
              key={result.parsedClass.id}
              result={result}
              index={index + 1}
              buildingPolygons={buildingPolygons}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        {/* Save Route with Day Picker */}
        {user && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <p className="text-xs font-medium text-neutral-600 mb-2">Save for which days?</p>
            <div className="flex gap-1.5 mb-3">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedDays.includes(day)
                      ? "bg-highlight text-white"
                      : "bg-white border border-neutral-300 text-neutral-600 hover:border-highlight hover:text-highlight"
                  }`}
                >
                  {DAY_LABELS[day].short}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveRoute}
              disabled={isSaving || buildingNames.length === 0 || selectedDays.length === 0}
              className={`w-full py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                saveStatus === "saved"
                  ? "bg-green-50 border border-green-200 text-green-600"
                  : "bg-highlight text-white hover:bg-highlight-hover border border-highlight-hover"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saveStatus === "saved" ? (
                <>
                  <Check className="w-4 h-4" />
                  Route Saved!
                </>
              ) : isSaving ? (
                <>
                  <Save className="w-4 h-4 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {selectedDays.length === 0
                    ? "Select days to save"
                    : `Save for ${selectedDays.map((d) => DAY_LABELS[d].short).join(", ")}`}
                </>
              )}
            </button>
          </div>
        )}
        <button
          onClick={() => {
            clearScheduleRoute();
            onBack();
          }}
          className="w-full py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Clear Route
        </button>
        <button
          onClick={onBack}
          className="w-full py-2 border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
        >
          Upload New Schedule
        </button>
      </div>
    </div>
  );
}
