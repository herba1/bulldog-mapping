 "use client";

import { useState, useRef } from "react";
import {
  Upload,
  X,
  Loader,
  ArrowLeft,
  AlertCircle,
  ImageIcon,
  MapPin,
  Plus,
  Trash2,
  Camera,
  BookMarked,
  Download,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useMapContext } from "@/context/MapContext";
import { extractTextFromImage } from "@/utils/ocr/scheduleOCR";
import { parseScheduleText } from "@/utils/schedule/scheduleParser";
import { matchAllClasses } from "@/utils/schedule/buildingMatcher";
import { buildCampusGraph } from "@/utils/pathfinding/campusGraph";
import { planScheduleRoute } from "@/utils/pathfinding/routePlanner";
import ScheduleResult from "./ScheduleResult";
import { MatchResult } from "@/types/schedule";
import { SavedRoute, DayOfWeek, DAYS_OF_WEEK, DAY_LABELS } from "@/types/savedRoute";
import { deleteSavedRoute } from "@/app/actions/savedRouteActions";
import { User } from "@supabase/supabase-js";

type InputMode = "manual" | "screenshot";

interface ScheduleUploadProps {
  savedRoutes: SavedRoute[];
  user: User | null;
}

export default function ScheduleUpload({ savedRoutes, user }: ScheduleUploadProps) {
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null);
  const [ocrProgress, setOcrProgress] = useState<string>("");

  // Manual entry state
  const [buildingEntries, setBuildingEntries] = useState<string[]>([""]);
  const [startFromParking, setStartFromParking] = useState(false);
  const [selectedParkingLot, setSelectedParkingLot] = useState("");

  // Saved routes state
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setView } = useSidebar();
  const { buildings, buildingPolygons, parkingLots: parkingLotsData, parkingPolygons, constructionZones, setScheduleRoute } = useMapContext();

  // Get parking lot names from context
  const parkingLots = parkingLotsData.map((lot) => lot.name);

  // Build a map of day → saved route for quick lookups
  const savedRoutesByDay = new Map<DayOfWeek, SavedRoute>();
  for (const route of savedRoutes) {
    savedRoutesByDay.set(route.dayOfWeek, route);
  }

  const selectedSavedRoute = selectedDay ? savedRoutesByDay.get(selectedDay) ?? null : null;

  // Helper to find parking lot by name
  const findParkingLotByName = (name: string) => {
    return parkingLotsData.find((lot) => lot.name === name) || null;
  };

  /**
   * Compute and display a route from building entries.
   */
  const computeRoute = (
    entries: string[],
    useParking: boolean,
    parkingName: string | null
  ) => {
    const allEntries =
      useParking && parkingName ? [parkingName, ...entries] : entries;

    const parsedClasses = allEntries.map((name, index) => ({
      id: Math.random().toString(36).substring(2, 9),
      courseCode: useParking && index === 0 ? "Parking" : `Class ${index}`,
      courseName: undefined,
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      buildingRaw: name.trim(),
      roomRaw: "",
      rawText: name,
    }));

    let results = matchAllClasses(parsedClasses, buildings);

    if (useParking && parkingName) {
      const parkingLot = findParkingLotByName(parkingName);
      if (parkingLot) {
        results = [
          {
            parsedClass: parsedClasses[0],
            match: {
              building: {
                id: parkingLot.id,
                name: parkingLot.name,
                address: null,
                daysOpen: null,
                description: parkingLot.description || "Parking lot",
                eventIDs: null,
                floors: 1,
                hoursOpen: "24/7",
                image_URLs: [],
                metaTags: ["parking"],
                otherNames: [],
                rooms: null,
                website: null,
              },
              confidence: 1.0,
              matchedOn: "exact",
              matchType: "exact",
            },
            suggestions: [],
          },
          ...results.slice(1),
        ];
      }
    }

    setMatchResults(results);

    const validMatches = results.filter((r) => r.match !== null);
    if (validMatches.length > 1) {
      const allPolygons = [...buildingPolygons, ...parkingPolygons];
      const allBuildings =
        useParking
          ? [
              ...buildings,
              ...parkingLotsData.map((lot) => ({
                id: lot.id,
                name: lot.name,
                address: null,
                daysOpen: null,
                description: lot.description || "Parking lot",
                eventIDs: null,
                floors: 1,
                hoursOpen: "24/7",
                image_URLs: [],
                metaTags: ["parking"],
                otherNames: [],
                rooms: null,
                website: null,
              })),
            ]
          : buildings;

      const graph = buildCampusGraph(allBuildings, allPolygons);
      const routeResult = planScheduleRoute(graph, results, allPolygons, constructionZones);
      setScheduleRoute(routeResult, results);
    } else if (validMatches.length === 1) {
      setScheduleRoute(null, results);
    }
  };

  const handleLoadSavedRoute = (savedRoute: SavedRoute) => {
    const entries = savedRoute.buildingNames;
    const useParking = !!savedRoute.parkingLotName;
    const parkingName = savedRoute.parkingLotName;

    // Update UI state
    setBuildingEntries(entries);
    if (useParking && parkingName) {
      setStartFromParking(true);
      setSelectedParkingLot(parkingName);
    } else {
      setStartFromParking(false);
      setSelectedParkingLot("");
    }

    setIsProcessing(true);
    setError(null);
    try {
      computeRoute(entries, useParking, parkingName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved route");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSavedRoute = async (day: DayOfWeek) => {
    if (!confirm(`Delete your saved route for ${DAY_LABELS[day].full}?`)) return;
    setIsDeleting(true);
    try {
      await deleteSavedRoute(day);
      if (selectedDay === day) setSelectedDay(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete saved route");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setMatchResults(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setMatchResults(null);
    setBuildingEntries([""]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Manual entry handlers
  const addBuildingEntry = () => {
    setBuildingEntries([...buildingEntries, ""]);
  };

  const removeBuildingEntry = (index: number) => {
    if (buildingEntries.length > 1) {
      setBuildingEntries(buildingEntries.filter((_, i) => i !== index));
    }
  };

  const updateBuildingEntry = (index: number, value: string) => {
    const newEntries = [...buildingEntries];
    newEntries[index] = value;
    setBuildingEntries(newEntries);
  };

  const getSuggestions = (input: string): string[] => {
    if (input.length < 2) return [];
    const normalized = input.toLowerCase();
    return buildings
      .filter((b) => b.name.toLowerCase().includes(normalized))
      .slice(0, 5)
      .map((b) => b.name);
  };

  const processManualEntry = () => {
    const validEntries = buildingEntries.filter((e) => e.trim().length > 0);
    if (validEntries.length === 0) {
      setError("Please enter at least one building");
      return;
    }

    if (startFromParking && !selectedParkingLot) {
      setError("Please select a parking lot");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setOcrProgress("Processing...");

    try {
      computeRoute(
        validEntries,
        startFromParking && !!selectedParkingLot,
        startFromParking ? selectedParkingLot : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process entry");
    } finally {
      setIsProcessing(false);
      setOcrProgress("");
    }
  };

  const processScreenshot = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setOcrProgress("Initializing OCR engine...");

    try {
      setOcrProgress("Extracting text from image...");
      const ocrResult = await extractTextFromImage(selectedFile);

      console.log("=== OCR Debug ===");
      console.log("Confidence:", ocrResult.confidence);
      console.log("Raw text:", ocrResult.text.substring(0, 1000));

      setOcrProgress("Parsing schedule...");
      const parsedSchedule = parseScheduleText(ocrResult);

      console.log("=== Parse Debug ===");
      console.log("Classes found:", parsedSchedule.classes.length);
      console.log("Classes:", parsedSchedule.classes);

      if (parsedSchedule.classes.length === 0) {
        setError(
          `OCR couldn't find building names in the image. Please try manual entry instead.`
        );
        setIsProcessing(false);
        return;
      }

      setOcrProgress("Matching buildings...");
      const results = matchAllClasses(parsedSchedule.classes, buildings);
      setMatchResults(results);

      const validMatches = results.filter((r) => r.match !== null);
      if (validMatches.length > 1) {
        setOcrProgress("Calculating route...");
        const graph = buildCampusGraph(buildings, buildingPolygons);
        const routeResult = planScheduleRoute(graph, results, buildingPolygons, constructionZones);
        setScheduleRoute(routeResult, results);
      } else if (validMatches.length === 1) {
        setScheduleRoute(null, results);
      }

      setOcrProgress("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process schedule"
      );
    } finally {
      setIsProcessing(false);
      setOcrProgress("");
    }
  };

  if (matchResults) {
    const saveBuildingNames = buildingEntries.filter((e) => e.trim().length > 0);
    const saveParkingLotName = startFromParking && selectedParkingLot ? selectedParkingLot : null;

    return (
      <ScheduleResult
        results={matchResults}
        onBack={clearFile}
        user={user}
        buildingNames={saveBuildingNames}
        parkingLotName={saveParkingLotName}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setView("search")}
          className="button-depth group p-2 rounded-lg border border-transparent hover:border-highlight-hover hover:bg-highlight transition-[transform_background-color_border-color] duration-150 ease-out-2 cursor-pointer hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 group-hover:text-white transition-colors duration-150 ease-out-2" />
        </button>
        <h2 className="text-xl font-semibold">Plan Your Route</h2>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4 p-1 bg-neutral-100 rounded-lg">
        <button
          onClick={() => setInputMode("manual")}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            inputMode === "manual"
              ? "bg-white shadow-sm text-highlight"
              : "text-neutral-600 hover:text-neutral-800"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Enter Buildings
        </button>
        <button
          onClick={() => setInputMode("screenshot")}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            inputMode === "screenshot"
              ? "bg-white shadow-sm text-highlight"
              : "text-neutral-600 hover:text-neutral-800"
          }`}
        >
          <Camera className="w-4 h-4" />
          Screenshot
        </button>
      </div>

      {/* Saved Routes Section */}
      {savedRoutes.length > 0 && user && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookMarked className="w-4 h-4 text-green-700" />
            <span className="text-sm font-medium text-green-800">Saved Routes</span>
          </div>

          {/* Day pills */}
          <div className="flex gap-1.5 mb-2">
            {DAYS_OF_WEEK.map((day) => {
              const hasSaved = savedRoutesByDay.has(day);
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isSelected
                      ? "bg-green-600 text-white"
                      : hasSaved
                        ? "bg-green-200 text-green-800 hover:bg-green-300"
                        : "bg-white border border-neutral-200 text-neutral-400 cursor-default"
                  }`}
                  disabled={!hasSaved}
                >
                  {DAY_LABELS[day].short}
                  {hasSaved && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-green-50" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day details */}
          {selectedSavedRoute && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <p className="text-xs text-green-700 font-medium mb-1">
                {DAY_LABELS[selectedSavedRoute.dayOfWeek].full}
              </p>
              <p className="text-xs text-green-600 mb-2 truncate">
                {selectedSavedRoute.buildingNames.join(" → ")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadSavedRoute(selectedSavedRoute)}
                  disabled={isProcessing}
                  className="flex-1 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Load Route
                </button>
                <button
                  onClick={() => handleDeleteSavedRoute(selectedSavedRoute.dayOfWeek)}
                  disabled={isDeleting}
                  className="py-1.5 px-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {inputMode === "manual" ? (
        /* Manual Entry Mode */
        <div className="flex-1 flex flex-col">
          <p className="text-sm text-neutral-600 mb-3">
            Enter the buildings you need to visit in order. Start typing for suggestions.
          </p>

          {/* Parking Lot Option */}
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={startFromParking}
                onChange={(e) => setStartFromParking(e.target.checked)}
                className="w-4 h-4 text-highlight focus:ring-highlight"
              />
              <span className="text-sm font-medium text-blue-900">
                Start from parking lot
              </span>
            </label>
            {startFromParking && (
              <select
                value={selectedParkingLot}
                onChange={(e) => setSelectedParkingLot(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight text-sm bg-white"
              >
                <option value="">Select a parking lot</option>
                {parkingLots.map((lot) => (
                  <option key={lot} value={lot}>
                    {lot}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {buildingEntries.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-highlight text-white text-xs flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={entry}
                  onChange={(e) => updateBuildingEntry(index, e.target.value)}
                  placeholder="e.g., McKee-Fisk, Science 1, Peters Business"
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent text-sm"
                  list={`suggestions-${index}`}
                />
                <datalist id={`suggestions-${index}`}>
                  {getSuggestions(entry).map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
                {buildingEntries.length > 1 && (
                  <button
                    onClick={() => removeBuildingEntry(index)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addBuildingEntry}
            className="mt-3 w-full py-2 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-highlight hover:text-highlight transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Another Building
          </button>

          {/* Process Button */}
          <button
            onClick={processManualEntry}
            disabled={buildingEntries.every((e) => e.trim().length === 0) || isProcessing}
            className="button-depth mt-4 w-full bg-highlight text-white py-3 rounded-lg border border-highlight-hover hover:bg-highlight-hover transition-[transform_background-color] duration-150 ease-out-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Create Route
              </>
            )}
          </button>
        </div>
      ) : (
        /* Screenshot Mode */
        <div className="flex-1 flex flex-col">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-lg text-center transition-colors duration-150 ease-out-2
              ${previewUrl ? "border-highlight p-2" : "border-neutral-300 hover:border-highlight p-6 cursor-pointer"}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Schedule preview"
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-neutral-100 rounded-full">
                  <ImageIcon className="w-6 h-6 text-neutral-400" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium text-sm">
                    Drop schedule screenshot here
                  </p>
                  <p className="text-gray-400 text-xs mt-1">or click to browse</p>
                </div>
              </div>
            )}
          </div>

          {/* Processing Progress */}
          {isProcessing && ocrProgress && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span>{ocrProgress}</span>
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={processScreenshot}
            disabled={!selectedFile || isProcessing}
            className="button-depth mt-3 w-full bg-highlight text-white py-3 rounded-lg border border-highlight-hover hover:bg-highlight-hover transition-[transform_background-color] duration-150 ease-out-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Process Screenshot
              </>
            )}
          </button>

          {/* Warning */}
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <p className="font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              OCR may not work well with all screenshot formats
            </p>
            <p className="mt-1">
              If it doesn&apos;t detect your classes, use &quot;Enter Buildings&quot; mode instead.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
