"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ConstructionZone,
  ConstructionZoneFormData,
} from "@/types/constructionZone";
import {
  createConstructionZone,
  updateConstructionZone,
} from "@/app/actions/constructionZoneActions";
import { useMapContext } from "@/context/MapContext";
import { Pencil } from "lucide-react";

type Props = {
  zone: ConstructionZone | null;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function ConstructionZoneForm({
  zone,
  onCancel,
  onSuccess,
}: Props) {
  const router = useRouter();
  const { drawingMode, startDrawing, stopDrawing } = useMapContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<ConstructionZoneFormData>({
    name: zone?.name || "",
    description: zone?.description || "",
    geojson: zone?.geojson || (null as any),
    isActive: zone?.isActive ?? true,
    startDate: zone?.startDate
      ? new Date(zone.startDate).toISOString().split("T")[0]
      : "",
    endDate: zone?.endDate
      ? new Date(zone.endDate).toISOString().split("T")[0]
      : "",
  });
  const [geoJsonInput, setGeoJsonInput] = useState(
    zone?.geojson ? JSON.stringify(zone.geojson, null, 2) : ""
  );

  // When a polygon is drawn, update the GeoJSON input
  useEffect(() => {
    if (drawingMode.drawnPolygon) {
      const polygon = drawingMode.drawnPolygon;
      setGeoJsonInput(JSON.stringify(polygon, null, 2));
      setFormData((prev) => ({
        ...prev,
        geojson: polygon,
      }));
    }
  }, [drawingMode.drawnPolygon]);

  // Cleanup drawing mode when component unmounts
  useEffect(() => {
    return () => {
      if (drawingMode.isActive) {
        stopDrawing();
      }
    };
  }, [drawingMode.isActive, stopDrawing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    // Validate GeoJSON
    if (!geoJsonInput.trim()) {
      alert("Please provide GeoJSON for the construction zone");
      return;
    }

    try {
      const parsedGeoJson = JSON.parse(geoJsonInput);
      console.log("Parsed GeoJSON:", parsedGeoJson);

      if (parsedGeoJson.type !== "Feature") {
        alert("GeoJSON must be a Feature object");
        return;
      }

      setIsProcessing(true);

      const dataToSubmit = {
        ...formData,
        geojson: parsedGeoJson,
      };

      console.log("Submitting construction zone:", dataToSubmit);

      if (zone) {
        await updateConstructionZone(zone.id, dataToSubmit);
      } else {
        const result = await createConstructionZone(dataToSubmit);
        console.log("Created construction zone:", result);
      }

      router.refresh();
      onSuccess();
    } catch (error) {
      console.error("Failed to save zone:", error);
      if (error instanceof SyntaxError) {
        alert("Invalid GeoJSON format. Please check your input.");
      } else {
        alert("Failed to save zone. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3 pb-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded-lg"
          placeholder="e.g., North Campus Construction"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full p-2 border rounded-lg"
          rows={2}
          placeholder="Optional details about the construction"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Construction Zone Area *
        </label>
        <button
          type="button"
          onClick={drawingMode.isActive ? stopDrawing : startDrawing}
          className={`w-full p-3 mb-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
            drawingMode.isActive
              ? "border-highlight bg-highlight-hover text-white"
              : "border-gray-300 hover:border-highlight hover:bg-gray-50"
          }`}
        >
          <Pencil className="w-5 h-5" />
          {drawingMode.isActive ? "Drawing... (Click to finish)" : "Draw Zone on Map"}
        </button>
        {geoJsonInput && (
          <div className="text-xs text-green-600 mb-2 flex items-center gap-1">
            ✓ Zone area defined ({JSON.parse(geoJsonInput).geometry.coordinates[0].length} points)
          </div>
        )}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            Advanced: Edit GeoJSON manually
          </summary>
          <textarea
            value={geoJsonInput}
            onChange={(e) => setGeoJsonInput(e.target.value)}
            className="w-full p-2 border rounded-lg font-mono text-xs mt-2"
            rows={6}
            placeholder='{"type":"Feature","geometry":{"type":"Polygon","coordinates":[...]},"properties":{}}'
          />
        </details>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
          id="isActive"
          className="w-4 h-4"
        />
        <label htmlFor="isActive" className="text-sm">
          Active (blocks routes)
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-auto pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="flex-1 p-2 bg-highlight text-white rounded-lg hover:bg-highlight-hover disabled:opacity-50"
        >
          {isProcessing ? "Saving..." : zone ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
