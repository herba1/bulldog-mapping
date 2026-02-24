"use client";

import { useState } from "react";
import { ConstructionZone } from "@/types/constructionZone";
import { useRouter } from "next/navigation";
import { useMapContext } from "@/context/MapContext";
import {
  toggleConstructionZone,
  deleteConstructionZone,
  approveConstructionZone,
} from "@/app/actions/constructionZoneActions";
import { Edit2, Trash2, Power, CheckCircle } from "lucide-react";

type Props = {
  zone: ConstructionZone;
  onEdit: (zone: ConstructionZone) => void;
  isAdmin?: boolean;
};

export default function ConstructionZoneCard({ zone, onEdit, isAdmin = false }: Props) {
  const router = useRouter();
  const { flyTo } = useMapContext();
  const [isProcessing, setIsProcessing] = useState(false);

  console.log(`🎫 Zone "${zone.name}" - isAdmin: ${isAdmin}, isApproved: ${zone.isApproved}, isActive: ${zone.isActive}`);

  const handleToggle = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      await toggleConstructionZone(zone.id, !zone.isActive);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle zone:", error);
      alert("Failed to toggle zone. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (isProcessing) return;

    if (!confirm(`Delete "${zone.name}"? This cannot be undone.`)) return;

    try {
      setIsProcessing(true);
      await deleteConstructionZone(zone.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete zone:", error);
      alert("Failed to delete zone. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      await approveConstructionZone(zone.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to approve zone:", error);
      alert("Failed to approve zone. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    // Fly to zone center
    const coords = zone.geojson.geometry.coordinates[0];
    if (coords && coords.length > 0) {
      const center = coords.reduce(
        (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
        [0, 0]
      );
      const centerCoords = [
        center[0] / coords.length,
        center[1] / coords.length,
      ] as [number, number];

      flyTo(centerCoords[0], centerCoords[1], 17);
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        !zone.isApproved
          ? "border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
          : zone.isActive
          ? "border-red-300 bg-red-50 hover:bg-red-100"
          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{zone.name}</h3>
          {!zone.isApproved && (
            <span className="text-xs text-yellow-600 font-medium">
              Pending Approval
            </span>
          )}
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {isAdmin && !zone.isApproved && (
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="p-1 rounded hover:bg-white transition-colors text-green-600"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={handleToggle}
                disabled={isProcessing}
                className={`p-1 rounded hover:bg-white transition-colors ${
                  zone.isActive ? "text-red-600" : "text-gray-600"
                }`}
                title={zone.isActive ? "Deactivate" : "Activate"}
              >
                <Power className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit(zone)}
                disabled={isProcessing}
                className="p-1 rounded hover:bg-white transition-colors text-blue-600"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="p-1 rounded hover:bg-white transition-colors text-red-600"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {zone.description && (
        <p className="text-xs text-gray-600 mb-2">{zone.description}</p>
      )}

      {(zone.startDate || zone.endDate) && (
        <div className="text-xs text-gray-500">
          {zone.startDate && (
            <span>Start: {new Date(zone.startDate).toLocaleDateString()}</span>
          )}
          {zone.startDate && zone.endDate && <span> • </span>}
          {zone.endDate && (
            <span>End: {new Date(zone.endDate).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </div>
  );
}
